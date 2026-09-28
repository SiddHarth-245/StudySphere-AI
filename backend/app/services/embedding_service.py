"""
StudySphere AI - Embedding Service
===================================
Deliberately avoids heavyweight ML dependencies (PyTorch / Sentence-Transformers,
which alone add 700MB-2GB+ to a deployment) so the whole backend stays small
enough to deploy comfortably on free-tier hosting.

Two embedding strategies, chosen automatically:

1. LLM_API_KEY configured -> real semantic embeddings via any OpenAI-compatible
   `/embeddings` endpoint (default model: text-embedding-3-small), truncated
   to EMBEDDING_DIM using OpenAI's native `dimensions` parameter.

2. No API key (or the embeddings call fails) -> a deterministic, dependency-free
   "feature hashing" vectorizer (the same technique behind scikit-learn's
   HashingVectorizer): each token is hashed into a fixed-size vector with a
   pseudo-random sign, weighted by log term-frequency, then L2-normalized.
   This keeps the app 100% functional offline, with zero downloads and zero
   extra dependencies, while still producing genuinely comparable vectors for
   cosine-similarity search.
"""
import hashlib
import math
import re
from typing import List

import numpy as np

from app.core.config import settings

EMBEDDING_DIM = 512

_client = None


def _has_llm() -> bool:
    return bool(settings.LLM_API_KEY.strip())


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    return _client


def _normalize(vectors: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms < 1e-8] = 1.0
    return (vectors / norms).astype("float32")


def _openai_embed(texts: List[str]) -> np.ndarray:
    client = _get_client()
    response = client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=texts,
        dimensions=EMBEDDING_DIM,
    )
    vectors = np.array([d.embedding for d in response.data], dtype="float32")
    return _normalize(vectors)


_TOKEN_RE = re.compile(r"[a-zA-Z0-9]+")


def _tokenize(text: str) -> List[str]:
    return _TOKEN_RE.findall(text.lower())


def _hash_index(token: str, salt: str = "") -> int:
    digest = hashlib.md5(f"{salt}{token}".encode("utf-8")).hexdigest()
    return int(digest, 16)


def _hashing_embed(texts: List[str]) -> np.ndarray:
    vectors = np.zeros((len(texts), EMBEDDING_DIM), dtype="float32")
    for i, text in enumerate(texts):
        counts = {}
        for token in _tokenize(text):
            counts[token] = counts.get(token, 0) + 1

        vec = np.zeros(EMBEDDING_DIM, dtype="float32")
        for token, count in counts.items():
            idx = _hash_index(token) % EMBEDDING_DIM
            sign = 1.0 if _hash_index(token, salt="sign") % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 + math.log(count))
        vectors[i] = vec
    return _normalize(vectors)


def embed_texts(texts: List[str]) -> np.ndarray:
    """Returns an (N, EMBEDDING_DIM) float32 numpy array of normalized embeddings."""
    if not texts:
        return np.zeros((0, EMBEDDING_DIM), dtype="float32")

    if _has_llm():
        try:
            return _openai_embed(texts)
        except Exception:  # noqa: BLE001
            # e.g. the configured provider has no embeddings endpoint - fall back gracefully
            pass

    return _hashing_embed(texts)


def embed_query(query: str) -> np.ndarray:
    return embed_texts([query])[0]
