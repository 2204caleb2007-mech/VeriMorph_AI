# 🔍 VeriMorph AI Dashboard & Backend Services

Welcome to the internal directory for the **VeriMorph AI Dashboard** and **Local Processing Pipeline**.

## 🏗️ Architecture

This directory is split into two primary segments:
- **Frontend (`src/`, React + Vite)**: A highly interactive UI that features a split-pane layout to view PDF/Image files alongside AI explanations, forensic heatmaps, and OCR confidence metrics.
- **Backend (`backend/`, FastAPI + Python)**: Handles heavy processing, document structural verifications, deepfake detection workflows, and interfaces directly with the PostgreSQL database.

## ⚙️ Frontend Setup

The frontend is built using React, Vite, TailwindCSS, and Zustand for state management.

```bash
# Inside verimorph-ai/
npm install
npm run dev
```
By default, the Vite dev server runs at `http://localhost:5173`. Make sure the Python backend is running concurrently so that API calls can succeed!

## 🐍 Backend Setup

The backend leverages a series of advanced forensic services processing PDFs and Images using `pdf2image`, `OpenCV`, and various proprietary heuristic engines. It utilizes large language/vision models through APIs like Groq and DeepSeek.

### Prerequisites (For Windows/Linux)
1. **Tesseract OCR**: Needs to be installed on your system.
2. **Poppler**: Required for `pdf2image` capabilities.

### Installation
```bash
cd backend/
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### Starting the Server
```bash
# Navigate inside verimorph-ai/backend/
uvicorn main:app --reload --port 8000
```
This spawns the REST API at `http://127.0.0.1:8000`. You can check the Swagger Docs at `http://127.0.0.1:8000/docs`.

### Dependencies & Environment Variables
Copy `.env.example` to `.env` inside the `verimorph-ai` directory and populate your keys:
- `GROQ_API_KEY`: Used for fast Mistral/Llama inference for document explainability chat.
- `TAVILY_API_KEY`: Enables web-surfacing context for regulatory checks.
- `SUPABASE_URL` / `SUPABASE_KEY`: Database synchronization layer.

## 🧪 Forensic Modules available
1. `Error Level Analysis (ELA)`
2. `Morphological Shape Profiling`
3. `QR / Barcode Forensic Integrity Inspection`
4. `OCR Confidence Mapping`
5. `LLM-driven Content Validation`

*(For details regarding the root Next.js Landing page, please check `../README.md`)*
