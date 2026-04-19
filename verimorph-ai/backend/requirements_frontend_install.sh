#!/bin/bash
# =============================================================
# PART 20 — requirements_frontend_install.sh
# Install all frontend dependencies
# =============================================================

npm install react@18 react-dom@18 typescript vite @vitejs/plugin-react \
  tailwindcss@3 postcss autoprefixer framer-motion zustand axios \
  lucide-react tesseract.js@5 pdfjs-dist@3.4.120 jsqr xlsx \
  react-router-dom@6 @radix-ui/react-collapsible @radix-ui/react-tooltip \
  @radix-ui/react-dialog @radix-ui/react-select @supabase/supabase-js \
  groq deepseek-ai

# DarkVeil — special install (not npm)
npx shadcn@latest add @react-bits/DarkVeil-TS-TW
