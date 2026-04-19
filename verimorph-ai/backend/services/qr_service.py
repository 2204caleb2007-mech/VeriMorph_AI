# =============================================================
# STEP 4f — qr_service.py
# Multi-pass QR decoding with pyzbar (4 passes as per GATE 5)
# Pass 1: original, Pass 2: grayscale, Pass 3: contrast-enhanced,
# Pass 4: adaptive threshold
# structlog only — no print()
# =============================================================
import cv2
import numpy as np
import structlog
from PIL import Image, ImageEnhance

log = structlog.get_logger(__name__)


def _pil_to_cv_gray(image: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2GRAY)


def decode_qr(image: Image.Image) -> str:
    """
    Attempt QR decoding with 4 successive passes per GATE 5.
    Returns decoded URL/text or empty string if no QR found.

    Pass 1 — original RGB image
    Pass 2 — grayscale
    Pass 3 — contrast-enhanced (factor 2.0)
    Pass 4 — adaptive threshold (binarised)
    """
    from pyzbar.pyzbar import decode as pyzbar_decode

    log.info("qr_service.decoding", size=image.size)

    def _try_decode(pil_img: Image.Image) -> str:
        results = pyzbar_decode(pil_img)
        for r in results:
            data = r.data.decode("utf-8", errors="replace").strip()
            if data:
                return data
        return ""

    # Pass 1 — original
    result = _try_decode(image)
    if result:
        log.info("qr_service.found_pass1", data=result[:80])
        return result

    # Pass 2 — grayscale
    gray_img = image.convert("L")
    result = _try_decode(gray_img)
    if result:
        log.info("qr_service.found_pass2", data=result[:80])
        return result

    # Pass 3 — contrast-enhanced
    enhanced = ImageEnhance.Contrast(gray_img).enhance(2.0)
    result = _try_decode(enhanced)
    if result:
        log.info("qr_service.found_pass3", data=result[:80])
        return result

    # Pass 4 — adaptive threshold via OpenCV
    gray_arr = _pil_to_cv_gray(image)
    adapt = cv2.adaptiveThreshold(
        gray_arr, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2,
    )
    adapt_pil = Image.fromarray(adapt)
    result = _try_decode(adapt_pil)
    if result:
        log.info("qr_service.found_pass4", data=result[:80])
        return result

    log.info("qr_service.no_qr_found")
    return ""
