"""
StudySphere AI - LLM Service
Talks to any OpenAI-compatible chat completions endpoint (OpenAI, Groq,
OpenRouter, Together AI, local vLLM, Gemini's OpenAI-compat endpoint, etc.)

If no LLM_API_KEY is configured, every function gracefully falls back to a
deterministic extractive method so the app remains fully demoable without
any paid API key.
"""
import json
import re
from typing import List, Dict

from app.core.config import settings

_client = None


def _has_llm() -> bool:
    return bool(settings.LLM_API_KEY.strip())


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    return _client


def chat_complete(messages: List[Dict[str, str]], temperature: float = 0.4, max_tokens: int = 1200) -> str:
    """Low-level call. Raises on failure so callers can decide on fallback behaviour."""
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()


def _extractive_fallback(context: str, header: str, max_sentences: int = 8) -> str:
    """
    A simple, dependency-free fallback used when no LLM API key is configured.
    It is NOT a hallucination-prone generator - it just surfaces the most
    relevant retrieved sentences, clearly labelled, so the app stays useful
    end-to-end even with zero API cost.
    """
    sentences = re.split(r"(?<=[.!?])\s+", context)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 25][:max_sentences]
    bullet_list = "\n".join(f"- {s}" for s in sentences) if sentences else "- No relevant content was found."
    return (
        f"{header}\n\n{bullet_list}\n\n"
        f"_Note: No LLM_API_KEY is configured, so ORBIT is showing the most relevant extracted "
        f"passages directly from your document instead of a generated answer. Add an API key in "
        f"the backend .env file to enable full generative responses._"
    )


def run_chat(messages: List[Dict[str, str]], context: str) -> str:
    if _has_llm():
        try:
            return chat_complete(messages)
        except Exception as e:  # noqa: BLE001
            return _extractive_fallback(context, f"⚠️ LLM request failed ({e}). Showing extracted content instead:")
    return _extractive_fallback(context, "Here is the most relevant information from your document:")


def run_json(messages: List[Dict[str, str]], fallback: dict) -> dict:
    """For features that expect a strict JSON response (flashcards, knowledge graph, study path)."""
    if _has_llm():
        try:
            raw = chat_complete(messages, temperature=0.3)
            raw = re.sub(r"^```json|```$", "", raw.strip(), flags=re.MULTILINE).strip()
            return json.loads(raw)
        except Exception:
            return fallback
    return fallback
