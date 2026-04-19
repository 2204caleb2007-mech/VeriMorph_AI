# =============================================================
# STEP 4b — ocr_service.py
# Tesseract for English, EasyOCR for 8 regional languages
# SHA-256 Redis cache (TTL from env)
# Word-level bbox output
# structlog only — no print()
# =============================================================
import hashlib
import io
import json
import os
import structlog
from PIL import Image
from typing import List, TypedDict

log = structlog.get_logger(__name__)

CACHE_TTL = int(os.environ.get("OCR_CACHE_TTL_SECONDS", "3600"))
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

# Language → EasyOCR code mapping (PART 19 — all 9)
LANG_MAP = {
    "eng": ["en"],
    "tam": ["ta"],
    "hin": ["hi"],
    "ben": ["bn"],
    "mar": ["mr"],
    "guj": ["gu"],
    "urd": ["ur"],
    "kan": ["kn"],
    "mal": ["ml"],
    "auto": ["en"],
}


class OcrWord(TypedDict):
    text: str
    bbox: dict       # {x0, y0, x1, y1}
    suspicious: bool


class OcrResult(TypedDict):
    text: str
    words: List[OcrWord]
    language: str


def _get_cache():
    """Lazy Redis connection — returns None if unavailable."""
    try:
        import redis
        return redis.from_url(REDIS_URL, decode_responses=True)
    except Exception:
        return None


def _cache_key(image_hash: str, language: str) -> str:
    return f"ocr:{language}:{image_hash}"


def _image_sha256(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return hashlib.sha256(buf.getvalue()).hexdigest()


def _is_suspicious_word(word: str) -> bool:
    """Flag words that might be forgery indicators."""
    suspicious_patterns = [
        "VOID", "SAMPLE", "DUPLICATE", "INVALID",
        "CANCELLED", "REVOKED", "EXPIRED",
    ]
    return word.upper().strip() in suspicious_patterns


def run_ocr(image: Image.Image, language: str = "eng") -> OcrResult:
    """
    Run OCR on a PIL Image.
    - English → pytesseract
    - All other languages → EasyOCR
    Results are cached in Redis by SHA-256 image hash.
    """
    lang_code = language if language in LANG_MAP else "eng"
    image_hash = _image_sha256(image)
    cache_key = _cache_key(image_hash, lang_code)

    # Try cache first
    cache = _get_cache()
    if cache:
        try:
            cached = cache.get(cache_key)
            if cached:
                log.info("ocr_service.cache_hit", lang=lang_code)
                return json.loads(cached)
        except Exception as e:
            log.warning("ocr_service.cache_read_error", error=str(e))

    log.info("ocr_service.running", lang=lang_code, size=image.size)

    if lang_code == "eng":
        result = _run_tesseract(image)
    else:
        result = _run_easyocr(image, lang_code)

    result["language"] = lang_code

    # Store in cache
    if cache:
        try:
            cache.setex(cache_key, CACHE_TTL, json.dumps(result))
        except Exception as e:
            log.warning("ocr_service.cache_write_error", error=str(e))

    log.info("ocr_service.done", words=len(result["words"]), text_len=len(result["text"]))
    return result


def _run_tesseract(image: Image.Image) -> OcrResult:
    """Tesseract English OCR with word-level bboxes."""
    import pytesseract

    tess_cmd = os.environ.get("TESSERACT_CMD", "/usr/bin/tesseract")
    pytesseract.pytesseract.tesseract_cmd = tess_cmd

    raw = pytesseract.image_to_data(
        image,
        lang="eng",
        output_type=pytesseract.Output.DICT,
    )

    words: List[OcrWord] = []
    full_words: List[str] = []

    for i, word in enumerate(raw["text"]):
        word = str(word).strip()
        if not word or raw["conf"][i] == -1:
            continue
        x, y, w, h = raw["left"][i], raw["top"][i], raw["width"][i], raw["height"][i]
        words.append({
            "text": word,
            "bbox": {"x0": x, "y0": y, "x1": x + w, "y1": y + h},
            "suspicious": _is_suspicious_word(word),
        })
        full_words.append(word)

    return {"text": " ".join(full_words), "words": words, "language": "eng"}


def _run_easyocr(image: Image.Image, lang_code: str) -> OcrResult:
    """EasyOCR for all 8 non-English languages."""
    import easyocr
    import numpy as np

    langs = LANG_MAP.get(lang_code, ["en"])
    reader = easyocr.Reader(langs, gpu=False, verbose=False)
    img_arr = np.array(image)
    detections = reader.readtext(img_arr)

    words: List[OcrWord] = []
    full_words: List[str] = []

    for bbox_pts, text, conf in detections:
        word = str(text).strip()
        if not word:
            continue
        xs = [p[0] for p in bbox_pts]
        ys = [p[1] for p in bbox_pts]
        words.append({
            "text": word,
            "bbox": {
                "x0": int(min(xs)),
                "y0": int(min(ys)),
                "x1": int(max(xs)),
                "y1": int(max(ys)),
            },
            "suspicious": _is_suspicious_word(word),
        })
        full_words.append(word)

    return {"text": " ".join(full_words), "words": words, "language": lang_code}
