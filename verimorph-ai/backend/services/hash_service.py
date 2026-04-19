# =============================================================
# STEP 4c — hash_service.py
# Morphological perceptual hash via imagehash (phash 8x8)
# Returns "0x" + 16 hex chars — EXACTLY matching types.ts
# structlog only — no print()
# =============================================================
import io
import structlog
from PIL import Image

log = structlog.get_logger(__name__)


def compute_morph_hash(image: Image.Image) -> str:
    """
    Compute perceptual hash of image using imagehash.phash (8×8 DCT).
    Returns "0x" + exactly 16 hex characters as defined in types.ts.
    """
    import imagehash

    log.info("hash_service.computing", size=image.size)
    ph = imagehash.phash(image, hash_size=8)
    # imagehash returns a 64-bit hash; format as 16 hex chars
    hex_str = format(int(str(ph), 16), '016x')
    result = f"0x{hex_str}"
    log.info("hash_service.done", hash=result)
    return result


def hashes_match(hash1: str, hash2: str, max_distance: int = 10) -> bool:
    """
    Compare two morph hashes.
    Returns True if Hamming distance <= max_distance (near-duplicate).
    """
    import imagehash

    # Strip "0x" prefix
    h1 = imagehash.hex_to_hash(hash1[2:].zfill(16))
    h2 = imagehash.hex_to_hash(hash2[2:].zfill(16))
    distance = h1 - h2
    log.info("hash_service.compare", distance=distance, match=distance <= max_distance)
    return distance <= max_distance
