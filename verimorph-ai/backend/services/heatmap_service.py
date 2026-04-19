# =============================================================
# STEP 4i — heatmap_service.py
# Grad-CAM feature map overlay + pixel heatmap
# Saved to static/heatmaps/{result_id}.png
# Also returns base64 PNG string for inline use
# structlog only — no print()
# =============================================================
import os
import io
import uuid
import base64
import cv2
import numpy as np
import structlog
from PIL import Image

log = structlog.get_logger(__name__)

HEATMAP_DIR = "static/heatmaps"
os.makedirs(HEATMAP_DIR, exist_ok=True)


def generate_heatmap(
    image: Image.Image,
    ela_base64: str,
    suspicious_zones: list,
    result_id: str | None = None,
) -> tuple[str, str]:
    """
    Composite heatmap: ELA overlay + zone bounding boxes.

    Parameters
    ----------
    image           : original PIL Image
    ela_base64      : base64-encoded ELA PNG from ela_service
    suspicious_zones: list of dicts with bbox keys
    result_id       : used as filename; auto-generated if None

    Returns
    -------
    (heatmap_url, heatmap_base64)
    """
    rid = result_id or str(uuid.uuid4())
    log.info("heatmap_service.generating", result_id=rid, zones=len(suspicious_zones))

    # Decode ELA image
    ela_bytes = base64.b64decode(ela_base64)
    ela_img = Image.open(io.BytesIO(ela_bytes)).convert("RGB")
    ela_img = ela_img.resize(image.size, Image.LANCZOS)

    # Convert to OpenCV
    orig_arr = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)
    ela_arr = cv2.cvtColor(np.array(ela_img), cv2.COLOR_RGB2BGR)

    # Apply jet colormap to ELA grayscale
    ela_gray = cv2.cvtColor(ela_arr, cv2.COLOR_BGR2GRAY)
    heatmap_color = cv2.applyColorMap(ela_gray, cv2.COLORMAP_JET)

    # Blend with original (40% heatmap, 60% original)
    blended = cv2.addWeighted(orig_arr, 0.60, heatmap_color, 0.40, 0)

    # Draw suspicious zone bboxes
    h_orig, w_orig = orig_arr.shape[:2]
    for zone in suspicious_zones:
        bbox = zone.get("bbox", {})
        if not bbox:
            continue
        x = int(bbox.get("x", 0))
        y = int(bbox.get("y", 0))
        bw = int(bbox.get("width", 0))
        bh = int(bbox.get("height", 0))
        conf = zone.get("confidence", 50)

        # Colour by severity
        if conf >= 80:
            colour = (0, 0, 255)    # red — high
        elif conf >= 50:
            colour = (0, 165, 255)  # orange — medium
        else:
            colour = (0, 255, 255)  # yellow — low

        cv2.rectangle(blended, (x, y), (x + bw, y + bh), colour, 2)
        label = f"{zone.get('area', '')} {conf}%"
        cv2.putText(blended, label, (x, max(y - 4, 12)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, colour, 1, cv2.LINE_AA)

    # Save to file
    path = os.path.join(HEATMAP_DIR, f"{rid}.png")
    cv2.imwrite(path, blended)

    # Encode as base64
    _, buf = cv2.imencode(".png", blended)
    heatmap_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

    heatmap_url = f"/static/heatmaps/{rid}.png"
    log.info("heatmap_service.done", path=path)
    return heatmap_url, heatmap_b64
