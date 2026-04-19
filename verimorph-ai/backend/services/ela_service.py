# =============================================================
# STEP 4e — ela_service.py
# Error Level Analysis — exact implementation from Example 8
# Thresholds match god prompt: <5 authentic, 5-15 suspicious, >15 tampered
# structlog only — no print()
# =============================================================
import io
import base64
import numpy as np
import structlog
from PIL import Image, ImageChops, ImageEnhance
from typing import TypedDict

log = structlog.get_logger(__name__)


class ElaResult(TypedDict):
    ela_score: float      # mean pixel value of enhanced ELA image
    verdict: str          # "authentic" | "suspicious" | "tampered"
    ela_base64: str       # PNG base64 of enhanced ELA image for heatmap overlay


def run_ela(image: Image.Image, quality: int = 90) -> ElaResult:
    """
    Error Level Analysis per Example 8 of the God Prompt.

    Process:
    1. Save image as JPEG at quality=90
    2. Re-open the JPEG
    3. Compute pixel difference vs original
    4. Enhance contrast by scaling to 0-255
    5. Compute mean → derive verdict

    Thresholds:
      ela_score < 5.0       → authentic
      5.0 <= score < 15.0   → suspicious
      score >= 15.0         → tampered
    """
    log.info("ela_service.running", size=image.size, quality=quality)

    # Step 1-2: Save at JPEG quality and reload
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    compressed = Image.open(buf).convert("RGB")

    # Step 3: Pixel difference
    diff = ImageChops.difference(image.convert("RGB"), compressed)

    # Step 4: Scale to 0-255
    extrema = diff.getextrema()
    max_diff = max(ex[1] for ex in extrema) or 1
    scale = 255.0 / max_diff
    diff_enhanced = ImageEnhance.Brightness(diff).enhance(scale)

    # Step 5: Score
    ela_score = float(np.array(diff_enhanced).mean())

    # Verdict
    if ela_score < 5.0:
        verdict = "authentic"
    elif ela_score < 15.0:
        verdict = "suspicious"
    else:
        verdict = "tampered"

    # Encode ELA image as base64 PNG for storage / heatmap
    out_buf = io.BytesIO()
    diff_enhanced.save(out_buf, format="PNG")
    ela_base64 = base64.b64encode(out_buf.getvalue()).decode("utf-8")

    log.info("ela_service.done", score=ela_score, verdict=verdict)
    return {"ela_score": ela_score, "verdict": verdict, "ela_base64": ela_base64}
