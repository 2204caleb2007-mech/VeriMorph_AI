# =============================================================
# PART 14 — Chat Router
# POST /api/chat/message
# POST /api/chat/read-pdf
# POST /api/chat/tavily-search
# GET  /api/chat/history
# DELETE /api/chat/history
# structlog — no print() — keys from environment
# =============================================================
import fitz  # pymupdf
import structlog
from fastapi import APIRouter, UploadFile, Query
from fastapi.responses import JSONResponse
from schemas import ChatPayload
from services import groq_service, tavily_service, deepseek_service, supabase_service

log = structlog.get_logger(__name__)
router = APIRouter(tags=["Chat"])


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[str]:
    """Chunk text into overlapping 1000-char blocks with 100-char overlap."""
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + chunk_size])
        start += chunk_size - overlap
    return chunks


def retrieve_relevant_chunks(full_text: str, query: str, top_k: int = 3) -> list[str]:
    """Simple TF-IDF-style retrieval: score chunks by query word overlap."""
    chunks = chunk_text(full_text)
    query_words = set(query.lower().split())
    scored = [
        (sum(1 for w in query_words if w in chunk.lower()), chunk)
        for chunk in chunks
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


def needs_web_search(query: str, pdf_context: str) -> bool:
    """Heuristic: use Tavily if no relevant chunks or query implies current info."""
    if not pdf_context.strip():
        return True
    freshness_keywords = ["latest", "current", "recent", "today", "news", "2024", "2025", "2026"]
    return any(kw in query.lower() for kw in freshness_keywords)


def format_history(history: list[dict]) -> str:
    return "\n".join(f"{m.get('role','user').capitalize()}: {m.get('content','')}" for m in history[-6:])


# ── POST /api/chat/read-pdf ─────────────────────────────────
@router.post("/chat/read-pdf")
async def read_pdf(file: UploadFile, model: str = "llama3-70b-8192"):
    """
    Upload PDF → extract text via pymupdf → Groq generates 6 suggested questions.
    Returns: { extracted_text, chunks, suggested_questions }
    """
    log.info("chat.read_pdf", filename=file.filename, model=model)
    file_bytes = await file.read()

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    full_text = " ".join(page.get_text() for page in doc)
    doc.close()

    chunks = chunk_text(full_text, chunk_size=1000, overlap=100)
    questions_result = groq_service.read_pdf_and_generate_questions(full_text[:8000], model)

    log.info("chat.read_pdf.done", pages=len(chunks), questions=len(questions_result.get("questions", [])))
    return {
        "extracted_text": full_text,
        "chunks": chunks,
        "suggested_questions": questions_result.get("questions", []),
    }


# ── POST /api/chat/tavily-search ────────────────────────────
@router.post("/chat/tavily-search")
async def tavily_search(query: str = Query(..., description="Search query")):
    """
    Searches Tavily with a live query → returns answer + sources.
    """
    log.info("chat.tavily_search", query=query[:80])
    result = tavily_service.search_tavily(query)
    return result


# ── POST /api/chat/message ──────────────────────────────────
@router.post("/chat/message")
async def chat_message(payload: ChatPayload):
    """
    Send chat message → routes to Groq/DeepSeek + optional Tavily.
    Persists to Supabase.
    """
    log.info("chat.message", model=payload.model, session=payload.session_id)

    pdf_context = ""
    tavily_context = ""
    used_web_search = False

    # Step 1: PDF context retrieval
    if payload.pdf_text:
        relevant_chunks = retrieve_relevant_chunks(payload.pdf_text, payload.user_query)
        pdf_context = "\n\n".join(relevant_chunks)

    # Step 2: Tavily fallback if needed
    if needs_web_search(payload.user_query, pdf_context):
        try:
            tavily_result = tavily_service.search_tavily(payload.user_query)
            tavily_context = tavily_result["context_block"]
            used_web_search = True
        except Exception as e:
            log.warning("chat.tavily_fallback_failed", error=str(e))

    # Step 3: Build combined prompt
    system_prompt = (
        "You are VeriDoc AI, an expert document forensics assistant. "
        "Answer based on provided context. Cite sources when using web results."
    )
    combined_prompt = (
        f"{system_prompt}\n\n"
        f"PDF Context:\n{pdf_context}\n\n"
        f"Web Search Results:\n{tavily_context}\n\n"
        f"Previous conversation:\n{format_history(payload.history)}\n\n"
        f"User: {payload.user_query}"
    )

    # Step 4: Route to correct model
    if payload.model == "deepseek-chat":
        response_text = deepseek_service.chat(combined_prompt)
    else:
        response_text = groq_service.chat(combined_prompt, payload.model)

    # Step 5: Persist to Supabase
    try:
        await supabase_service.save_message(payload.session_id, payload.user_query, response_text)
    except Exception as e:
        log.warning("chat.supabase_persist_failed", error=str(e))

    log.info("chat.message.done", used_web_search=used_web_search)
    return {"response": response_text, "used_web_search": used_web_search}


# ── GET /api/chat/history ───────────────────────────────────
@router.get("/chat/history")
async def get_chat_history(session_id: str = Query(...)):
    log.info("chat.get_history", session_id=session_id)
    return await supabase_service.get_history(session_id)


# ── DELETE /api/chat/history ────────────────────────────────
@router.delete("/chat/history")
async def clear_chat_history(session_id: str = Query(...)):
    log.info("chat.clear_history", session_id=session_id)
    await supabase_service.clear_history(session_id)
    return {"status": "cleared"}
