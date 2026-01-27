from flask import Flask, request, jsonify
from flask_cors import CORS
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
CORS(app)  # Enable CORS for all routes
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

        # BƯỚC 1: Thu thập kết quả và deduplication (chỉ giữ best score per product_id)
        seen_products = {}  # Track best score for each product_id
        
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
            
            # Deduplication: Chỉ giữ ảnh có original_score cao nhất cho mỗi product_id
            product_id = metadata.get('product_id', img_path)  # Fallback to path if no product_id
            
            if product_id not in seen_products or score > seen_products[product_id]['original_score']:
                seen_products[product_id] = {
                    "path": img_path,
                    "original_score": float(score),
                    "metadata": metadata
                }
        
        # BƯỚC 2: Tạo results với true CLIP scores (không boost)
        results = []
        
        for product_data in seen_products.values():
            original_score = product_data['original_score']
            
            results.append({
                "path": product_data['path'],
                "score": float(original_score),  # Sử dụng score gốc từ CLIP
                "original_score": original_score,
                "metadata": product_data['metadata']
            })
        
        results.sort(key=lambda x: x['score'], reverse=True)
        
        for idx, result in enumerate(results[:top_k]):
            result['rank'] = idx + 1
        
        results = results[:top_k]
        print(results)
        
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

@app.route('/recommend', methods=['POST'])
def recommend_product():
    """
    Gợi ý sản phẩm tương tự dựa trên product_id hoặc tên file ảnh đang có
    """
    start_time = time.time()
    
    data = request.get_json()
    product_id = data.get('product_id')
    filename = data.get('filename') 
    top_k = int(data.get('top_k', 10))
    
    if not product_id and not filename:
        return jsonify({"error": "Cần cung cấp product_id hoặc filename"}), 400

    # 1. Tìm đường dẫn ảnh của sản phẩm mục tiêu
    target_path = None
    
    # Cách đơn giản: Tìm trong product_metadata
    for path, meta in product_metadata.items():
        if (product_id and meta.get('product_id') == product_id) or \
           (filename and os.path.basename(path) == filename):
            target_path = path
            break
            
    if not target_path or not os.path.exists(target_path):
        return jsonify({"error": "Không tìm thấy sản phẩm trong cơ sở dữ liệu"}), 404

    try:
        # 2. Lấy vector của sản phẩm mục tiêu
        vec = extract_feature_clip(target_path).astype("float32").reshape(1, -1)
        
        # 3. Search 
        k = min(top_k + 1, index.ntotal)
        D, I = index.search(vec, k=k)
        
        results = []
        for i, score in zip(I[0], D[0]):
            if i >= len(image_paths):
                continue
                
            img_path = image_paths[i]
            
            # Bỏ qua chính sản phẩm đang query
            if img_path == target_path:
                continue
                
            metadata = product_metadata.get(img_path, {})
            
            results.append({
                "path": img_path,
                "score": float(score),
                "metadata": metadata
            })
            
            if len(results) >= top_k:
                break
        
        elapsed = time.time() - start_time
        return jsonify({
            "source_product": product_metadata.get(target_path),
            "recommendations": results,
            "time": elapsed
        })
        
    except Exception as e:
        print(f"❌ Lỗi recommend: {e}")
        return jsonify({"error": str(e)}), 500

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

# ============================================================
# 📊 EVALUATION METRICS - Thống kê đánh giá cho báo cáo
# ============================================================

# Global tracking variables
search_stats = {
    "total_searches": 0,
    "total_latency_ms": 0,
    "latencies": [],  # Keep last 100 latencies
    "score_distribution": {"0.9+": 0, "0.8-0.9": 0, "0.7-0.8": 0, "0.6-0.7": 0, "<0.6": 0},
    "results_count": [],  # Number of results per search
}

def update_search_stats(latency_ms, scores):
    """Cập nhật thống kê search"""
    global search_stats
    search_stats["total_searches"] += 1
    search_stats["total_latency_ms"] += latency_ms
    search_stats["latencies"].append(latency_ms)
    if len(search_stats["latencies"]) > 100:
        search_stats["latencies"] = search_stats["latencies"][-100:]
    
    search_stats["results_count"].append(len(scores))
    if len(search_stats["results_count"]) > 100:
        search_stats["results_count"] = search_stats["results_count"][-100:]
    
    # Update score distribution
    for score in scores:
        if score >= 0.9:
            search_stats["score_distribution"]["0.9+"] += 1
        elif score >= 0.8:
            search_stats["score_distribution"]["0.8-0.9"] += 1
        elif score >= 0.7:
            search_stats["score_distribution"]["0.7-0.8"] += 1
        elif score >= 0.6:
            search_stats["score_distribution"]["0.6-0.7"] += 1
        else:
            search_stats["score_distribution"]["<0.6"] += 1

@app.route('/stats', methods=['GET'])
def get_stats():
    """
    📊 API lấy thống kê hệ thống cho báo cáo
    Metrics: latency, throughput, score distribution, index info
    """
    latencies = search_stats["latencies"]
    results_counts = search_stats["results_count"]
    
    # Calculate latency statistics
    if latencies:
        avg_latency = np.mean(latencies)
        p50_latency = np.percentile(latencies, 50)
        p95_latency = np.percentile(latencies, 95)
        p99_latency = np.percentile(latencies, 99)
        min_latency = np.min(latencies)
        max_latency = np.max(latencies)
    else:
        avg_latency = p50_latency = p95_latency = p99_latency = min_latency = max_latency = 0
    
    # Calculate average results per search
    avg_results = np.mean(results_counts) if results_counts else 0
    
    # Memory usage
    if torch.cuda.is_available():
        gpu_memory = torch.cuda.memory_allocated() / 1024**2
        gpu_memory_max = torch.cuda.max_memory_allocated() / 1024**2
    else:
        gpu_memory = gpu_memory_max = 0
    
    # Index statistics
    index_type = "IndexIVFFlat" if isinstance(index, faiss.IndexIVFFlat) else "IndexFlatIP"
    
    return jsonify({
        "model_info": {
            "name": "CLIP ViT-B/32",
            "feature_dimension": 512,
            "input_resolution": "224x224",
            "similarity_metric": "Cosine Similarity (Inner Product)",
            "device": str(DEVICE),
        },
        "index_info": {
            "type": index_type,
            "total_vectors": index.ntotal,
            "total_products": len(image_paths),
            "dimension": 512,
        },
        "search_performance": {
            "total_searches": search_stats["total_searches"],
            "latency_ms": {
                "average": round(avg_latency, 2),
                "median_p50": round(p50_latency, 2),
                "p95": round(p95_latency, 2),
                "p99": round(p99_latency, 2),
                "min": round(min_latency, 2),
                "max": round(max_latency, 2),
            },
            "avg_results_per_search": round(avg_results, 2),
            "throughput_qps": round(1000 / avg_latency, 2) if avg_latency > 0 else 0,
        },
        "score_distribution": search_stats["score_distribution"],
        "memory_usage": {
            "gpu_current_mb": round(gpu_memory, 2),
            "gpu_peak_mb": round(gpu_memory_max, 2),
            "cache_size": extract_feature_clip.cache_info().currsize if hasattr(extract_feature_clip, 'cache_info') else 0,
        }
    })

@app.route('/benchmark', methods=['POST'])
def run_benchmark():
    """
    🧪 Chạy benchmark đánh giá hiệu năng
    Body JSON:
    - num_queries: số query thử nghiệm (default: 10)
    - top_k: số kết quả mỗi query (default: 10)
    """
    data = request.get_json() or {}
    num_queries = int(data.get('num_queries', 10))
    top_k = int(data.get('top_k', 10))
    
    if index.ntotal < 5:
        return jsonify({"error": "Cần ít nhất 5 sản phẩm trong index để benchmark"}), 400
    
    # Random sample queries from existing products
    sample_size = min(num_queries, len(image_paths))
    sample_indices = np.random.choice(len(image_paths), sample_size, replace=False)
    
    latencies = []
    all_scores = []
    precision_at_k = []
    recall_results = []
    
    for idx in sample_indices:
        query_path = image_paths[idx]
        query_metadata = product_metadata.get(query_path, {})
        query_category = query_metadata.get('category', '')
        
        start_time = time.time()
        
        # Extract features and search
        vec = extract_feature_clip(query_path).astype("float32").reshape(1, -1)
        k = min(top_k + 1, index.ntotal)
        D, I = index.search(vec, k=k)
        
        elapsed_ms = (time.time() - start_time) * 1000
        latencies.append(elapsed_ms)
        
        # Collect scores (excluding self)
        scores = []
        same_category_count = 0
        for i, score in zip(I[0], D[0]):
            if i >= len(image_paths):
                continue
            if image_paths[i] == query_path:
                continue
            scores.append(float(score))
            
            # Check if same category (for Precision calculation)
            result_meta = product_metadata.get(image_paths[i], {})
            if result_meta.get('category', '') == query_category and query_category:
                same_category_count += 1
        
        all_scores.extend(scores[:top_k])
        
        # Precision@K = relevant / retrieved
        if query_category:
            precision = same_category_count / min(top_k, len(scores)) if scores else 0
            precision_at_k.append(precision)
        
        recall_results.append(len(scores))
    
    # Calculate statistics
    avg_latency = np.mean(latencies)
    p50_latency = np.percentile(latencies, 50)
    p95_latency = np.percentile(latencies, 95)
    
    avg_score = np.mean(all_scores) if all_scores else 0
    score_std = np.std(all_scores) if all_scores else 0
    
    avg_precision = np.mean(precision_at_k) if precision_at_k else None
    
    return jsonify({
        "benchmark_config": {
            "num_queries": sample_size,
            "top_k": top_k,
            "index_size": index.ntotal,
        },
        "latency_results": {
            "average_ms": round(avg_latency, 2),
            "median_p50_ms": round(p50_latency, 2),
            "p95_ms": round(p95_latency, 2),
            "min_ms": round(min(latencies), 2),
            "max_ms": round(max(latencies), 2),
            "throughput_qps": round(1000 / avg_latency, 2) if avg_latency > 0 else 0,
        },
        "similarity_results": {
            "average_score": round(avg_score, 4),
            "score_std": round(score_std, 4),
            "score_min": round(min(all_scores), 4) if all_scores else 0,
            "score_max": round(max(all_scores), 4) if all_scores else 0,
        },
        "retrieval_quality": {
            "precision_at_k": round(avg_precision, 4) if avg_precision else "N/A (no category data)",
            "avg_results_returned": round(np.mean(recall_results), 2),
        },
        "model_specs": {
            "name": "CLIP ViT-B/32 (OpenAI)",
            "embedding_dim": 512,
            "similarity_metric": "Cosine Similarity",
            "index_type": "FAISS IndexFlatIP" if isinstance(index, faiss.IndexFlatIP) else "FAISS IndexIVFFlat",
        }
    })

@app.route('/evaluate-query', methods=['POST'])
def evaluate_single_query():
    """
    🔍 Đánh giá chi tiết một query
    Trả về: scores, latency breakdown, top matches
    """
    start_total = time.time()
    
    if 'image' not in request.files:
        return jsonify({"error": "Thiếu file ảnh"}), 400
    
    file = request.files['image']
    temp_path = f"temp_eval_{int(time.time() * 1000)}.jpg"
    top_k = int(request.form.get('top_k', 10))
    
    try:
        # Step 1: Save file
        start_save = time.time()
        file.save(temp_path)
        save_time = (time.time() - start_save) * 1000
        
        # Step 2: Feature extraction
        start_extract = time.time()
        vec = extract_feature_clip(temp_path).astype("float32").reshape(1, -1)
        extract_time = (time.time() - start_extract) * 1000
        
        # Step 3: FAISS search
        start_search = time.time()
        k = min(top_k * 3, index.ntotal)
        D, I = index.search(vec, k=k)
        search_time = (time.time() - start_search) * 1000
        
        # Step 4: Post-processing
        start_post = time.time()
        results = []
        scores = []
        for i, score in zip(I[0], D[0]):
            if i >= len(image_paths) or len(results) >= top_k:
                continue
            scores.append(float(score))
            metadata = product_metadata.get(image_paths[i], {})
            results.append({
                "rank": len(results) + 1,
                "score": round(float(score), 4),
                "path": image_paths[i],
                "product_id": metadata.get('product_id', ''),
                "category": metadata.get('category', ''),
            })
        post_time = (time.time() - start_post) * 1000
        
        total_time = (time.time() - start_total) * 1000
        
        # Update global stats
        update_search_stats(total_time, scores)
        
        # Score analysis
        score_analysis = {
            "mean": round(np.mean(scores), 4) if scores else 0,
            "std": round(np.std(scores), 4) if scores else 0,
            "max": round(max(scores), 4) if scores else 0,
            "min": round(min(scores), 4) if scores else 0,
            "above_0.8": sum(1 for s in scores if s >= 0.8),
            "above_0.7": sum(1 for s in scores if s >= 0.7),
        }
        
        return jsonify({
            "timing_breakdown_ms": {
                "file_save": round(save_time, 2),
                "feature_extraction": round(extract_time, 2),
                "faiss_search": round(search_time, 2),
                "post_processing": round(post_time, 2),
                "total": round(total_time, 2),
            },
            "score_analysis": score_analysis,
            "results_count": len(results),
            "top_results": results,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except:
                pass

if __name__ == '__main__':
    import threading
    preload_thread = threading.Thread(target=preload_models)
    preload_thread.daemon = True
    preload_thread.start()
    
    print("🚀 Starting 3D Product Image Search Service (CLIP)...")
    print(f"📁 Storage directory: {STORAGE_DIR}")
    print(f"🔧 Device: {DEVICE}")
    print(f"🤖 Model: CLIP ViT-B/32 (512-dim)")
    
    app.run(host="0.0.0.0", port=5001, threaded=True)
