#!/bin/bash
# =============================================================
# PART 21 — Run the complete VeriDoc AI system
# =============================================================

# 1. Install Tesseract + all 9 language packs (Ubuntu/Debian)
sudo apt-get install -y \
  tesseract-ocr tesseract-ocr-tam tesseract-ocr-hin \
  tesseract-ocr-ben tesseract-ocr-mar tesseract-ocr-guj \
  tesseract-ocr-urd tesseract-ocr-kan tesseract-ocr-mal

# 2. Start infrastructure (PostgreSQL, MongoDB, Redis)
docker-compose up -d

# 3. Set up Python environment
pip install -r requirements.txt

# 4. Copy and fill in API keys
cp ../verimorph-ai/.env.example .env
echo ""
echo "⚠️  Edit .env and add your Tavily, Groq, DeepSeek, and Supabase keys"
echo "   See YOUR_API_KEY_HERE.txt for key locations"
echo ""

# 5. Start Celery worker
celery -A celery_app worker --concurrency=4 --loglevel=info &

# 6. Start FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &

# 7. Start frontend
cd ../verimorph-ai
npm run dev

echo "✅ VeriDoc AI running at http://localhost:5173"
