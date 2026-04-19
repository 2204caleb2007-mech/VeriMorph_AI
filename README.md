# 🌐 VeriMorph AI

An advanced, AI-powered document forgery detection platform featuring a stunning 3D interactive landing page.

![VeriMorph AI](public/verimorph/favicon.svg)

## 📖 Overview
VeriMorph AI is a comprehensive platform designed to detect document tamering, identify deepfakes in documents, and perform rigorous forensic analysis using cutting-edge AI and computer vision techniques.

This repository consists of:
1. **The 3D Hero Landing Page (Next.js)**: A highly interactive, performant front-end built with Next.js, React Three Fiber, and Tailwind CSS.
2. **The VeriMorph Web App (React + Vite)**: A dedicated single-page application located in the `verimorph-ai/` directory that handles document uploads, forensic analysis pipelines, and Chatbot explainability.
3. **The AI Backend (FastAPI)**: Located in `verimorph-ai/backend/`, this Python backend processes OCR, Error Level Analysis (ELA), morphometric hashing, and AI-driven compliance checks using asynchronous processing (Celery + Redis).

## 🚀 Features
- **3D Interactive Landing Page**: An immersive introduction designed with `three.js`.
- **Advanced Document Forensics**: OCR text extraction, morphological verification, QR code structural analysis, and visual tampering detection.
- **RAG-Powered Explainability**: Powered by Groq, Mistral/Llama3, and Tavily for live web search functionality to explain the results of forensic analysis to users in a Chat UI.
- **Microservices Architecture**: Combines Next.js for SSR SEO landing pages, Vite for high-speed client-side dashboard rendering, and FastAPI for intensive AI workloads.

## 🛠️ Quick Start

### 1. Launching the Landing Page
```bash
# From the root directory
npm install
npm run dev
```
The landing page will be available at `http://localhost:3000`.

### 2. Launching the VeriMorph AI Dashboard
```bash
# Navigate to the verimorph app
cd verimorph-ai
npm install
npm run dev
```

### 3. Launching the Python Backend
```bash
# Navigate to the backend directory
cd verimorph-ai/backend

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```
For full instructions on the backend, please see [verimorph-ai/README.md](./verimorph-ai/README.md).

## 🔒 Environment Variables
Check `.env.example` inside `verimorph-ai/` to configure the required API keys for PostgreSQL (Supabase), Groq, Tavily, and DeepSeek services.

## 📄 License
This project is proprietary and not open for commercial reuse without explicit permission.
