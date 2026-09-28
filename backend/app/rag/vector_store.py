"""
StudySphere AI - Vector Store (Database-backed, serverless-friendly)
======================================================================
Design: every chunk's embedding is stored as a JSON array directly in the
`document_chunks` table (SQLite locally, Postgres in production) - there is
NO local index file on disk. At query time, the relevant rows for a user
(optionally scoped to one document) are loaded into memory and compared
using an ephemeral FAISS `IndexFlatIP` built fresh for that single request.

Why this shape instead of a persistent on-disk FAISS index:
  Serverless hosts (Vercel included) give each function invocation a fresh,
  throwaway filesystem - anything written to disk during one request is not
  guaranteed to exist on the next. By keeping the database as the single
  source of truth and treating FAISS as a pure in-memory computation layer,
  the exact same code works identically whether it's running on a laptop
  against SQLite or on Vercel against a managed Postgres database.

At the scale of a single student's document library (typically hundreds,
not millions, of chunks), rebuilding a flat FAISS index per request is
effectively instant and requires no persistence or cache-invalidation logic.
"""
from typing import List, Optional, Dict, Any

import faiss
import numpy as np
from sqlalchemy.orm import Session

from app.models.models import DocumentChunk
from app.services.embedding_service import embed_texts, embed_query, EMBEDDING_DIM


def add_document_chunks(
    db: Session,
    user_id: int,
    document_id: int,
    document_name: str,
    chunks: List[Any],  # List[TextChunk]
) -> None:
    """Embeds chunks and inserts them as rows in the document_chunks table."""
    if not chunks:
        return

    texts = [c.text for c in chunks]
    vectors = embed_texts(texts)

    for chunk, vector in zip(chunks, vectors):
        db.add(DocumentChunk(
            user_id=user_id,
            document_id=document_id,
            document_name=document_name,
            page_number=chunk.page_number,
            text=chunk.text,
            embedding=vector.tolist(),
        ))
    db.commit()


def _build_ephemeral_index(rows: List[DocumentChunk]):
    """Builds a throwaway FAISS index from a set of already-fetched rows."""
    vectors = np.array([row.embedding for row in rows], dtype="float32")
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(vectors)
    return index


def similarity_search(
    db: Session,
    user_id: int,
    query: str,
    top_k: int = 5,
    document_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Returns the top_k most relevant chunks (as dicts + a `score` key) for the
    query, optionally filtered to a single document.
    """
    q = db.query(DocumentChunk).filter(DocumentChunk.user_id == user_id)
    if document_id is not None:
        q = q.filter(DocumentChunk.document_id == document_id)
    rows = q.all()

    if not rows:
        return []

    index = _build_ephemeral_index(rows)
    query_vec = embed_query(query).reshape(1, -1)
    search_k = min(len(rows), top_k)
    scores, indices = index.search(query_vec, search_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        row = rows[idx]
        results.append({
            "document_id": row.document_id,
            "document_name": row.document_name,
            "page_number": row.page_number,
            "text": row.text,
            "score": float(score),
        })
    return results


def get_all_document_text(db: Session, user_id: int, document_id: int, max_chunks: int = 200) -> str:
    """Concatenates all stored chunks for one document (used by summarizer / exam / study path)."""
    rows = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.user_id == user_id, DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.page_number.asc(), DocumentChunk.id.asc())
        .limit(max_chunks)
        .all()
    )
    return "\n\n".join(row.text for row in rows)


def delete_document(db: Session, user_id: int, document_id: int) -> None:
    """Removes every stored chunk for a document."""
    db.query(DocumentChunk).filter(
        DocumentChunk.user_id == user_id, DocumentChunk.document_id == document_id
    ).delete()
    db.commit()
