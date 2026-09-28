"""
StudySphere AI - PDF Processing Service
Extracts text page-by-page and splits it into overlapping chunks
suitable for embedding + retrieval.
"""
import re
from dataclasses import dataclass
from typing import List

import fitz  # PyMuPDF


@dataclass
class TextChunk:
    text: str
    page_number: int
    chunk_index: int


def extract_pages(filepath: str) -> List[str]:
    """Returns a list where index i is the raw text of page i+1."""
    pages = []
    with fitz.open(filepath) as doc:
        for page in doc:
            pages.append(page.get_text("text"))
    return pages


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text)  # fix hyphenated line breaks
    return text.strip()


def chunk_document(
    filepath: str,
    chunk_size: int = 900,
    chunk_overlap: int = 150,
) -> List[TextChunk]:
    """
    Extracts text from a PDF and splits it into overlapping character-based
    chunks, tagging each chunk with its source page number.
    """
    pages = extract_pages(filepath)
    chunks: List[TextChunk] = []
    chunk_idx = 0

    for page_num, raw_page_text in enumerate(pages, start=1):
        text = clean_text(raw_page_text)
        if not text:
            continue

        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            piece = text[start:end]
            if piece.strip():
                chunks.append(TextChunk(text=piece.strip(), page_number=page_num, chunk_index=chunk_idx))
                chunk_idx += 1
            if end == len(text):
                break
            start = end - chunk_overlap

    return chunks
