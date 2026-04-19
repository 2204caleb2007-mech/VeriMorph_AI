# =============================================================
# PART 13 — DeepSeek LLM Service
# Keys from environment — no hardcoding
# structlog — no print()
# =============================================================
import os
import httpx
import structlog

log = structlog.get_logger(__name__)

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"


def chat(prompt: str, model: str = "deepseek-chat") -> str:
    """
    Sends a prompt to DeepSeek API and returns the response string.
    """
    log.info("deepseek.chat", model=model, prompt_length=len(prompt))

    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 2048,
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            f"{DEEPSEEK_BASE_URL}/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    content = data["choices"][0]["message"]["content"]
    log.info("deepseek.done", response_length=len(content))
    return content
