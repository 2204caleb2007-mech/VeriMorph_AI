# =============================================================
# STEP 4d — shape_service.py
# OpenCV-based layout, seal, text alignment, logo analysis
# Returns ShapeAnalysis dict matching types.ts shapeAnalysis field
# structlog only — no print()
# =============================================================
import cv2
import numpy as np
import structlog
from PIL import Image
from typing import TypedDict

log = structlog.get_logger(__name__)


class ShapeAnalysis(TypedDict):
    layoutScore: int          # 0-100
    sealPosition: str         # "top-right" | "bottom-left" | etc. | "none"
    textAlignment: str        # "left" | "center" | "right" | "mixed"
    logoIntegrity: str        # "intact" | "partial" | "missing"


def _pil_to_cv(image: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)


def analyze_shape(image: Image.Image) -> ShapeAnalysis:
    """
    Run full OpenCV structural analysis on document image.
    All scores derived from real computed signals — no random values.
    """
    log.info("shape_service.analyzing", size=image.size)
    img = _pil_to_cv(image)
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # ── Layout Score ─────────────────────────────────────────
    # Measure horizontal text-line regularity using Hough lines
    edges = cv2.Canny(gray, 50, 150)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=60, minLineLength=w // 4, maxLineGap=20)

    if lines is not None:
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            angle = abs(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
            angles.append(angle)
        # Perfect layout → all lines near 0° or 180°
        near_horizontal = sum(1 for a in angles if a < 5 or a > 175)
        layout_score = int(min(100, (near_horizontal / max(len(angles), 1)) * 100))
    else:
        layout_score = 50  # unknown — no lines detected

    # ── Seal Detection ───────────────────────────────────────
    # Look for circular/oval contours in the upper-right and lower-left
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    seal_position = "none"

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < (w * h * 0.002) or area > (w * h * 0.12):
            continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0:
            continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if circularity > 0.6:  # roughly circular
            M = cv2.moments(cnt)
            if M["m00"] == 0:
                continue
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            hor = "left" if cx < w // 2 else "right"
            ver = "top"  if cy < h // 2 else "bottom"
            seal_position = f"{ver}-{hor}"
            break

    # ── Text Alignment ───────────────────────────────────────
    # Use horizontal projection: check if text mass is left/center/right
    row_sums = np.sum(thresh, axis=0).astype(float)
    total = float(np.sum(row_sums))

    if total == 0:
        text_alignment = "mixed"
    else:
        weighted_x = float(np.dot(np.arange(w), row_sums)) / total
        ratio = weighted_x / w
        if ratio < 0.35:
            text_alignment = "left"
        elif ratio > 0.65:
            text_alignment = "right"
        else:
            text_alignment = "center"

    # ── Logo Integrity ───────────────────────────────────────
    # Check top-left corner region for significant non-white pixel density
    corner_h = h // 6
    corner_w = w // 5
    corner_roi = thresh[:corner_h, :corner_w]
    pixel_density = float(np.sum(corner_roi)) / (corner_h * corner_w * 255)

    if pixel_density > 0.08:
        logo_integrity = "intact"
    elif pixel_density > 0.02:
        logo_integrity = "partial"
    else:
        logo_integrity = "missing"

    result: ShapeAnalysis = {
        "layoutScore": layout_score,
        "sealPosition": seal_position,
        "textAlignment": text_alignment,
        "logoIntegrity": logo_integrity,
    }
    log.info("shape_service.done", **result)
    return result
