import io
import re
from typing import Optional
import pypdf
import docx


def clean_text(text: str) -> str:
    """Normalize whitespace and strip non-printable characters from extracted resume text."""
    if not text:
        return ""
    # Replace non-breaking spaces and control characters
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    # Collapse multiple consecutive newlines to maximum 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Collapse excessive horizontal spaces/tabs
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF resume using pypdf."""
    stream = io.BytesIO(file_bytes)
    reader = pypdf.PdfReader(stream)
    pages_text = []
    for page in reader.pages:
        try:
            page_text = page.extract_text()
            if page_text:
                pages_text.append(page_text)
        except Exception:
            continue
    return clean_text("\n\n".join(pages_text))


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX resume including paragraphs and tables."""
    stream = io.BytesIO(file_bytes)
    doc = docx.Document(stream)
    parts = []

    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            parts.append(paragraph.text.strip())

    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                parts.append(" | ".join(row_text))

    return clean_text("\n\n".join(parts))


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """Universal resume text extractor supporting PDF, DOCX, and plain text."""
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    else:
        # Fallback to UTF-8 decoding with latin-1 fallback
        try:
            return clean_text(file_bytes.decode("utf-8"))
        except UnicodeDecodeError:
            return clean_text(file_bytes.decode("latin-1", errors="ignore"))
