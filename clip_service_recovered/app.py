from flask import Flask, request, jsonify
import torch
import faiss
import numpy as np
import os
from PIL import Image
import time
from functools import lru_cache
from transformers import CLIPProcessor, CLIPModel
import json

app = Flask(__name__)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# === Đường dẫn ===
INDEX_PATH = "faiss_index_3d_products_clip.idx"
PATHS_PATH = "product_paths_clip.npy"
METADATA_PATH = "product_metadata.json"
STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "product_images")
os.makedirs(STORAGE_DIR, exist_ok=True)

# === Cấu hình tối ưu ===
torch.backends.cudnn.benchmark = True
if DEVICE.type == 'cuda':
    torch.cuda.empty_cache()
else:
    torch.set_num_threads(4)

TIMEOUT_SECONDS = 30

# === Lazy loading CLIP model ===
clip_processor = None
clip_model = None

# === Product metadata storage ===
product_metadata = {}

def load_models_if_needed():
    global clip_processor, clip_model
    
    if clip_processor is None or clip_model is None:
        print("🔄 Đang tải mô hình CLIP...")
        try:
            clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(DEVICE).eval()
            print("✅ Đã tải xong mô hình CLIP")
        except Exception as e:
            print(f"❌ Lỗi khi tải mô hình CLIP: {e}")
            raise

def preload_models():
    print("⏳ Preloading CLIP model in background...")
    try:
        load_models_if_needed()
        print("✅ CLIP model preloaded successfully!")
    except Exception as e:
        print(f"❌ Error preloading models: {e}")

# === Load index và metadata ===
print("🔄 Đang tải FAISS index và metadata...")
if os.path.exists(INDEX_PATH) and os.path.exists(PATHS_PATH):
    index = faiss.read_index(INDEX_PATH)
    image_paths = list(np.load(PATHS_PATH, allow_pickle=True))
    print(f"✅ Đã tải index với {len(image_paths)} sản phẩm")
else:
    index = faiss.IndexFlatIP(512)  # CLIP uses 512-dim features
    image_paths = []
    print("✅ Tạo index mới (CLIP 512-dim)")

# Load metadata
if os.path.exists(METADATA_PATH):
    with open(METADATA_PATH, 'r', encoding='utf-8') as f:
        product_metadata = json.load(f)
    print(f"✅ Đã tải metadata cho {len(product_metadata)} sản phẩm")
else:
    product_metadata = {}

# === Hàm tiền xử lý ảnh cho CLIP ===
def preprocess_image(image_path):
    """Tiền xử lý ảnh sản phẩm 3D cho CLIP"""
    try:
        image = Image.open(image_path).convert("RGB")
        # CLIP processor sẽ tự động resize về 224x224
        return image
    except Exception as e:
        print(f"❌ Lỗi preprocess ảnh {image_path}: {e}")
        return None

# === Hàm trích xuất đặc trưng CLIP ===
@lru_cache(maxsize=1000)
def extract_feature_clip(image_path):
    """Trích xuất đặc trưng CLIP cho ảnh sản phẩm 3D"""
    start_time = time.time()
    try:
        load_models_if_needed()
        
        image = preprocess_image(image_path)
        if image is None:
            return np.zeros(512, dtype=np.float32)
        
        # CLIP preprocessing
        inputs = clip_processor(images=image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            # Get image features from CLIP
            image_features = clip_model.get_image_features(**inputs)
            # L2 normalization cho cosine similarity
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        
        result = image_features.cpu().numpy().squeeze().astype(np.float32)
        
        elapsed = time.time() - start_time
        print(f"⚡ CLIP feature extraction: {elapsed:.2f}s")
        return result
    except Exception as e:
        print(f"❌ Lỗi trích xuất đặc trưng CLIP: {e}")
        return np.zeros(512, dtype=np.float32)

# === Hàm trích xuất text features ===
def extract_text_feature(text):
    """Trích xuất đặc trưng từ text query"""
    try:
        load_models_if_needed()
        
        inputs = clip_processor(text=[text], return_tensors="pt", padding=True).to(DEVICE)
        
        with torch.no_grad():
            text_features = clip_model.get_text_features(**inputs)
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
        
        return text_features.cpu().numpy().squeeze().astype(np.float32)
    except Exception as e:
        print(f"❌ Lỗi trích xuất text features: {e}")
        return np.zeros(512, dtype=np.float32)

# === Hàm tối ưu index ===
def optimize_index_if_needed():
    """Chuyển sang IndexIVFFlat khi có đủ dữ liệu"""
    global index
    
    if len(image_paths) >= 100 and isinstance(index, faiss.IndexFlatIP):
        print("🔄 Tối ưu index sang IndexIVFFlat...")
        try:
            quantizer = faiss.IndexFlatIP(512)  # CLIP 512-dim
            nlist = int(np.sqrt(len(image_paths)))
            nlist = max(10, min(nlist, 100))
            
            new_index = faiss.IndexIVFFlat(quantizer, 512, nlist, faiss.METRIC_INNER_PRODUCT)
            
            all_vectors = []
            for path in image_paths:
                vec = extract_feature_clip(path).reshape(1, -1)
                all_vectors.append(vec)
            
            training_data = np.vstack(all_vectors)
            new_index.train(training_data)
            new_index.add(training_data)
            
            index = new_index
            index.nprobe = max(1, nlist // 4)
            
            faiss.write_index(index, INDEX_PATH)
            print(f"✅ Đã tối ưu index với {nlist} clusters")
        except Exception as e:
            print(f"❌ Lỗi tối ưu index: {e}")

def save_metadata():
    """Lưu metadata vào file JSON"""
    try:
        with open(METADATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(product_metadata, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"❌ Lỗi lưu metadata: {e}")

# === API ===

@app.route('/')
def status():
    models_loaded = {
        "clip_processor": clip_processor is not None,
        "clip_model": clip_model is not None,
    }
    
    index_type = "IndexIVFFlat" if isinstance(index, faiss.IndexIVFFlat) else "IndexFlatIP"
    
    return jsonify({
        "service": "3D Product Image Search",
        "model": "CLIP ViT-B/32",
        "device": str(DEVICE),
        "index_size": len(image_paths),
        "index_type": index_type,
        "feature_dim": 512,
        "models_loaded": models_loaded,
        "memory_usage": f"{torch.cuda.memory_allocated() / 1024**2:.1f}MB" if torch.cuda.is_available() else "N/A"
    })

@app.route('/add', methods=['POST'])
def add_product():
    """Thêm sản phẩm mới vào index"""
    start_time = time.time()
    
    if 'image' not in request.files:
        return jsonify({"error": "Thiếu file ảnh"}), 400
    
    file = request.files['image']
    filename = file.filename
    save_path = os.path.join(STORAGE_DIR, filename)
    file.save(save_path)

    # Trích xuất đặc trưng CLIP
    vec = extract_feature_clip(save_path).astype("float32").reshape(1, -1)
    index.add(vec)
    image_paths.append(save_path)

    # Lưu metadata
    metadata = {
        "product_id": request.form.get('product_id', ''),
        "name": request.form.get('name', ''),
        "category": request.form.get('category', ''),
        "image_path": save_path
    }
    
    if 'metadata' in request.form:
        try:
            additional_meta = json.loads(request.form['metadata'])
            metadata.update(additional_meta)
        except:
            pass
    
    product_metadata[save_path] = metadata

    if len(image_paths) % 5 == 0:
        faiss.write_index(index, INDEX_PATH)
        np.save(PATHS_PATH, np.array(image_paths))
        save_metadata()
        print(f"💾 Đã lưu index với {len(image_paths)} sản phẩm")
        optimize_index_if_needed()
    
    elapsed = time.time() - start_time
    print(f"✅ Thêm sản phẩm: {elapsed:.2f}s")
    return jsonify({
        "message": "Đã thêm sản phẩm",
        "path": save_path,
        "metadata": metadata
    })

@app.route('/add-batch', methods=['POST'])
def add_products_batch():
    """Thêm nhiều sản phẩm cùng lúc"""
    start_time = time.time()
    
    if 'images' not in request.files:
        return jsonify({"error": "Không có file nào được gửi"}), 400
    
    files = request.files.getlist('images')
    if len(files) == 0:
        return jsonify({"error": "Không có file nào được gửi"}), 400
    
    metadata_mapping = {}
    if 'metadata' in request.form:
        try:
            metadata_mapping = json.loads(request.form['metadata'])
        except:
            pass
    
    saved_files = []
    for file in files:
        if file.filename == '':
            continue
            
        filename = file.filename
        save_path = os.path.join(STORAGE_DIR, filename)
        file.save(save_path)
        saved_files.append((save_path, filename))
    
    def process_products():
        added_paths = []
        vectors = []
        
        batch_size = min(10, len(saved_files))
        
        for i in range(0, len(saved_files), batch_size):
            batch_files = saved_files[i:i+batch_size]
            batch_vectors = []
            batch_paths = []
            
            for save_path, filename in batch_files:
                try:
                    vec = extract_feature_clip(save_path).astype("float32").reshape(1, -1)
                    batch_vectors.append(vec)
                    batch_paths.append(save_path)
                    added_paths.append(save_path)
                    
                    metadata = metadata_mapping.get(filename, {})
                    metadata['image_path'] = save_path
                    product_metadata[save_path] = metadata
                    
                except Exception as e:
                    print(f"❌ Lỗi xử lý {filename}: {e}")
            
            if batch_vectors:
                vectors.extend(batch_vectors)
                image_paths.extend(batch_paths)
        
        if vectors:
            index.add(np.vstack(vectors))
            faiss.write_index(index, INDEX_PATH)
            np.save(PATHS_PATH, np.array(image_paths))
            save_metadata()
            print(f"💾 Đã lưu index batch với {len(image_paths)} sản phẩm")
            optimize_index_if_needed()
        
        elapsed = time.time() - start_time
        print(f"✅ Thêm batch {len(added_paths)} sản phẩm: {elapsed:.2f}s")
    
    import threading
    thread = threading.Thread(target=process_products)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "message": f"Đang xử lý {len(saved_files)} sản phẩm...",
        "status": "processing",
        "total": len(saved_files)
    })

@app.route('/search', methods=['POST'])
def search_product():
    """
    Tìm kiếm sản phẩm tương tự bằng ảnh
    CLIP: Better semantic understanding
    """
    start_time = time.time()
    
    if index.ntotal == 0:
        return jsonify([])

    if 'image' not in request.files:
        return jsonify({"error": "Thiếu file ảnh"}), 400

    file = request.files['image']
    temp_path = f"temp_query_{int(time.time() * 1000)}.jpg"
    
    top_k = int(request.form.get('top_k', 10))
    threshold = float(request.form.get('threshold', 0.6))  # CLIP: threshold cao hơn (0.6 vs 0.5)
    
    filters = {}
    if 'filters' in request.form:
        try:
            filters = json.loads(request.form['filters'])
        except:
            pass
    
    try:
        file.save(temp_path)
        
        # Trích xuất đặc trưng CLIP
        vec = extract_feature_clip(temp_path).astype("float32").reshape(1, -1)
        
        # Search với CLIP features
        k = min(top_k * 5, index.ntotal)
        D, I = index.search(vec, k=k)

        results = []
        category_counts = {}
        
        for idx, (i, score) in enumerate(zip(I[0], D[0])):
            if i >= len(image_paths):
                continue
                
            if score < threshold:
                continue
            
            img_path = image_paths[i]
            metadata = product_metadata.get(img_path, {})
            
            # Apply filters
            if filters:
                skip = False
                for key, value in filters.items():
                    if key in metadata and metadata[key] != value:
                        skip = True
                        break
                if skip:
                    continue
            
            # Category boosting
            category = metadata.get('category', 'unknown')
            category_counts[category] = category_counts.get(category, 0) + 1
            
            boosted_score = score
            if category_counts[category] > 1:
                boosted_score *= 1.15  # CLIP: 15% boost (vs 10% cho DINOv2)
            
            results.append({
                "path": img_path,
                "score": float(boosted_score),
                "original_score": float(score),
                "rank": len(results) + 1,
                "metadata": metadata
            })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        for idx, result in enumerate(results[:top_k]):
            result['rank'] = idx + 1
        
        results = results[:top_k]
        
        elapsed = time.time() - start_time
        print(f"🔍 CLIP Search: {elapsed:.2f}s, found {len(results)} results")
        
        return jsonify(results)
    except Exception as e:
        print(f"❌ Lỗi tìm kiếm: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

@app.route('/search-by-text', methods=['POST'])
def search_by_text():
    """
    🆕 Tìm kiếm sản phẩm bằng text
    Chỉ có với CLIP!
    Body: JSON
    - query: text mô tả (e.g., "modern TV wall unit")
    - top_k: số lượng kết quả
    - threshold: ngưỡng similarity
    """
    start_time = time.time()
    
    if index.ntotal == 0:
        return jsonify([])
    
    data = request.get_json()
    query = data.get('query', '')
    top_k = int(data.get('top_k', 10))
    threshold = float(data.get('threshold', 0.6))
    
    if not query:
        return jsonify({"error": "Thiếu query text"}), 400
    
    try:
        # Trích xuất text features
        text_vec = extract_text_feature(query).reshape(1, -1)
        
        # Search
        k = min(top_k * 3, index.ntotal)
        D, I = index.search(text_vec, k=k)
        
        results = []
        for i, score in zip(I[0], D[0]):
            if i >= len(image_paths) or score < threshold:
                continue
            
            img_path = image_paths[i]
            metadata = product_metadata.get(img_path, {})
            
            results.append({
                "path": img_path,
                "score": float(score),
                "metadata": metadata
            })
            
            if len(results) >= top_k:
                break
        
        elapsed = time.time() - start_time
        print(f"🔍 Text Search '{query}': {elapsed:.2f}s, {len(results)} results")
        
        return jsonify({
            "query": query,
            "results": results,
            "total": len(results)
        })
    except Exception as e:
        print(f"❌ Lỗi text search: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/delete', methods=['POST'])
def delete_product():
    """Xóa sản phẩm khỏi index"""
    global index, image_paths
    
    filename = request.json.get('filename')
    if not filename:
        return jsonify({"error": "Thiếu tên file"}), 400

    idx_to_remove = -1
    for i, path in enumerate(image_paths):
        if os.path.basename(path) == filename:
            idx_to_remove = i
            break

    if idx_to_remove == -1:
        return jsonify({"error": "Không tìm thấy file"}), 404

    removed_path = image_paths.pop(idx_to_remove)
    
    if removed_path in product_metadata:
        del product_metadata[removed_path]
    
    # Rebuild index
    if image_paths:
        new_index = faiss.IndexFlatIP(512)
        
        all_vectors = []
        for path in image_paths:
            vec = extract_feature_clip(path).reshape(1, -1)
            all_vectors.append(vec)
        
        if all_vectors:
            new_index.add(np.vstack(all_vectors))
        
        index = new_index
    else:
        index = faiss.IndexFlatIP(512)

    faiss.write_index(index, INDEX_PATH)
    np.save(PATHS_PATH, np.array(image_paths))
    save_metadata()

    file_path = os.path.join(STORAGE_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"❌ Lỗi xóa file: {e}")
    
    return jsonify({"message": "Đã xóa sản phẩm", "filename": filename})

@app.route('/reset', methods=['POST'])
def reset_index():
    """Reset toàn bộ hệ thống"""
    global index, image_paths, product_metadata

    if os.path.exists(INDEX_PATH): 
        os.remove(INDEX_PATH)
    if os.path.exists(PATHS_PATH): 
        os.remove(PATHS_PATH)
    if os.path.exists(METADATA_PATH):
        os.remove(METADATA_PATH)

    for file in os.listdir(STORAGE_DIR):
        path = os.path.join(STORAGE_DIR, file)
        if os.path.isfile(path): 
            try:
                os.remove(path)
            except Exception as e:
                print(f"❌ Lỗi xóa file {path}: {e}")

    index = faiss.IndexFlatIP(512)  # CLIP 512-dim
    image_paths = []
    product_metadata = {}
    
    return jsonify({"message": "Đã reset toàn bộ hệ thống (CLIP ready)"})

if __name__ == '__main__':
    import threading
    preload_thread = threading.Thread(target=preload_models)
    preload_thread.daemon = True
    preload_thread.start()
    
    print("🚀 Starting 3D Product Image Search Service (CLIP)...")
    print(f"📁 Storage directory: {STORAGE_DIR}")
    print(f"🔧 Device: {DEVICE}")
    print(f"🤖 Model: CLIP ViT-B/32 (512-dim)")
    
    app.run(host="0.0.0.0", port=6000, threaded=True)
