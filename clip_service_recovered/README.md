# 3D Product Image Search Service

Flask service for visual similarity search of 3D product images using DINOv2.

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```bash
python app.py
```

Service runs at `http://localhost:5000`

## API Examples

### Add Product
```bash
curl -X POST http://localhost:5000/add \
  -F "image=@product.jpg" \
  -F "product_id=507f1f77bcf86cd799439011" \
  -F "name=Modern Chair 3D Model" \
  -F "category=Furniture"
```

### Search Products
```bash
curl -X POST http://localhost:5000/search \
  -F "image=@query.jpg" \
  -F "top_k=10"
```

## Features

- ✅ Visual similarity search using DINOv2
- ✅ Product metadata management
- ✅ Advanced filtering by category, materials, style
- ✅ Auto-optimization with FAISS IVF index
- ✅ GPU/CPU support

## Documentation

See `implementation_summary.md` for full API documentation.
