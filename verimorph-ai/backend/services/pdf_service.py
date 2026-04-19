# =============================================================
# STEP 4a — pdf_service.py
# Rasterisation via pymupdf (fitz)
# Returns: List[PIL.Image], full_text, page_count
# structlog only — no print()
# =============================================================
import io
import structlog
from typing import Tuple
from PIL import Image

log = structlog.get_logger(__name__)


def rasterize_pdf(
    file_bytes: bytes,
    dpi: int = 150,
) -> Tuple[list, str, int]:
    """
    Rasterize every page of a PDF into PIL Images.

    Returns
    -------
    pages   : list of PIL.Image – one per page, RGB mode
    full_text : str – concatenated plain text from all pages
    page_count : int
    """
    import fitz  # pymupdf

    log.info("pdf_service.rasterize", byte_len=len(file_bytes), dpi=dpi)

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages: list = []
    texts: list[str] = []

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for page in doc:
        # Raster
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        pages.append(img)

        # Text
        texts.append(page.get_text("text"))

    doc.close()
    full_text = "\n".join(texts)
    log.info("pdf_service.done", pages=len(pages), text_len=len(full_text))
    return pages, full_text, len(pages)


def pdf_to_image(file_bytes: bytes, dpi: int = 150) -> Image.Image:
    """Return only the first page as a PIL Image (for single-page pipelines)."""
    pages, _, _ = rasterize_pdf(file_bytes, dpi)
    return pages[0] if pages else Image.new("RGB", (800, 1100), (255, 255, 255))
