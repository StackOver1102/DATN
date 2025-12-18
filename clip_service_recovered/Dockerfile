FROM python:3.9-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY app.py .

# IMPORTANT: Copy FAISS index files (needed for search)
COPY faiss_index_3d_products_clip.idx .
COPY product_paths_clip.npy .
COPY product_metadata.json .

# Optional: product_images folder (only if using /add endpoint)
# RUN mkdir -p product_images

# Fix port to match app.py
EXPOSE 5001

CMD ["python", "app.py"]