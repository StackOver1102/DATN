import faiss
import numpy as np
import os
import json

INDEX_PATH = "faiss_index_3d_products_clip.idx"
PATHS_PATH = "product_paths_clip.npy"
METADATA_PATH = "product_metadata.json"

def inspect():
    print(f"--- Inspecting {INDEX_PATH} ---")
    if os.path.exists(INDEX_PATH):
        try:
            index = faiss.read_index(INDEX_PATH)
            print(f"Index type: {type(index)}")
            print(f"ntotal (number of vectors): {index.ntotal}")
            print(f"d (dimension): {index.d}")
            print(f"is_trained: {index.is_trained}")
            print(f"metric_type: {index.metric_type}")
        except Exception as e:
            print(f"Error reading index: {e}")
    else:
        print("Index file not found.")

    print(f"\n--- Inspecting {PATHS_PATH} ---")
    if os.path.exists(PATHS_PATH):
        try:
            paths = np.load(PATHS_PATH, allow_pickle=True)
            print(f"Shape: {paths.shape}")
            print(f"First 5 paths: {paths[:5]}")
        except Exception as e:
            print(f"Error reading paths: {e}")
    else:
        print("Paths file not found.")

    print(f"\n--- Inspecting {METADATA_PATH} ---")
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"Number of metadata entries: {len(metadata)}")
            keys = list(metadata.keys())
            if keys:
                print(f"First entry key: {keys[0]}")
                print(f"First entry value: {metadata[keys[0]]}")
        except Exception as e:
            print(f"Error reading metadata: {e}")
    else:
        print("Metadata file not found.")

if __name__ == "__main__":
    inspect()
