"""
StudySphere AI - Deterministic Fallback Generators
Used only when no LLM_API_KEY is configured, so that Flashcards, the
Knowledge Explorer, and the AI Study Path remain fully functional
(non-LLM, but non-fake) end-to-end demos.
"""
import re
from typing import List, Dict, Any


def _sentences(text: str) -> List[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if len(p.strip()) > 30]


def fallback_flashcards(document_text: str, count: int) -> Dict[str, Any]:
    sents = _sentences(document_text)[: count * 2]
    cards = []
    for i in range(0, len(sents) - 1, 2):
        if len(cards) >= count:
            break
        statement = sents[i]
        words = statement.split()
        keyword = max(words, key=len) if words else "this topic"
        question = f"What does the material say about '{keyword.strip('.,')}' ?"
        cards.append({"question": question, "answer": statement})
    if not cards:
        cards = [{"question": "No content available", "answer": "Please upload a document with more text."}]
    return {"flashcards": cards[:count]}


def fallback_knowledge_graph(document_name: str, document_text: str) -> Dict[str, Any]:
    sents = _sentences(document_text)[:30]
    # Very simple heuristic: pick capitalized multi-word phrases as "topics"
    candidates = []
    for s in sents:
        words = s.split()
        for w in words:
            clean = w.strip(".,:;()")
            if len(clean) > 4 and clean[0].isupper() and clean.lower() not in [c.lower() for c in candidates]:
                candidates.append(clean)
    topics = candidates[:5] if candidates else ["Key Concepts"]
    children = []
    for i, t in enumerate(topics):
        subtopics = candidates[5 + i * 2: 5 + i * 2 + 2] or [f"{t} - Overview"]
        children.append({"name": t, "children": [{"name": s, "children": []} for s in subtopics]})
    return {"root": {"name": document_name, "children": children}}


def fallback_study_path(document_text: str, days: int) -> Dict[str, Any]:
    sents = _sentences(document_text)
    chunk_size = max(1, len(sents) // max(1, days - 1)) if days > 1 else len(sents)
    plan = []
    idx = 0
    for day in range(1, days + 1):
        if day == days:
            plan.append({
                "day": day,
                "title": "Full Revision",
                "topics": ["Review all previous topics", "Attempt self-quiz / flashcards"],
                "is_revision": True,
            })
            continue
        topics_for_day = sents[idx: idx + chunk_size]
        idx += chunk_size
        titles = [t[:60] + ("…" if len(t) > 60 else "") for t in topics_for_day[:3]] or ["General Review"]
        plan.append({
            "day": day,
            "title": f"Day {day} Focus",
            "topics": titles,
            "is_revision": False,
        })
    return {"plan": plan}
