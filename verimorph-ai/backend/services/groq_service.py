# =============================================================
# PART 13 — Groq Service
# PDF reader, question generator, chat
# Keys from environment — no hardcoding
# structlog — no print()
# =============================================================
import json
import os
import structlog
from groq import Groq

log = structlog.get_logger(__name__)

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])


def read_pdf_and_generate_questions(pdf_text: str, model: str = "llama3-70b-8192") -> dict:
    """
    Sends PDF text to Groq and returns 6 semantically specific suggested questions.
    """
    log.info("groq.read_pdf", text_length=len(pdf_text), model=model)

    response = groq_client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a document intelligence assistant. "
                    "Read the provided document text carefully. "
                    "Then generate exactly 6 highly specific, semantically rich questions "
                    "that a verification officer would want answered about this document. "
                    'Return ONLY a JSON object: {"questions": ["q1", "q2", ...]}'
                ),
            },
            {
                "role": "user",
                "content": f"Document text:\n\n{pdf_text[:8000]}",
            },
        ],
        temperature=0.3,
        max_tokens=1000,
    )

    raw = response.choices[0].message.content.strip()
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        import re
        matches = re.findall(r'"([^"]{10,200})"', raw)
        result = {"questions": matches[:6] if matches else []}

    log.info("groq.questions_generated", count=len(result.get("questions", [])))
    return result


def chat(prompt: str, model: str = "llama3-70b-8192") -> str:
    """
    Sends a combined prompt to Groq and returns the response string.
    """
    log.info("groq.chat", model=model, prompt_length=len(prompt))

    response = groq_client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=2048,
    )
    return response.choices[0].message.content
