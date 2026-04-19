import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // Tesseract canvas refs sometimes clash with strict mode double-renders but keep for safety
  // <StrictMode>
    <App />
  // </StrictMode>,
)
