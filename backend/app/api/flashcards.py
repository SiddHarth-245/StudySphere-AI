"""
StudySphere AI - Flashcard Generator Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document, Flashcard
from app.models.schemas import FlashcardGenerateRequest, FlashcardOut
from app.prompts.prompt_manager import build_flashcard_prompt
from app.rag import vector_store
from app.services import llm_service
from app.services.fallback_generators import fallback_flashcards

router = APIRouter(prefix="/api/flashcards", tags=["Flashcards"])


@router.post("/generate", response_model=list[FlashcardOut])
def generate(payload: FlashcardGenerateRequest, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document is not ready yet (status: {doc.status}).")

    document_text = vector_store.get_all_document_text(db, current_user.id, doc.id)
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document.")

    messages = build_flashcard_prompt(document_text, payload.count)
    fallback = fallback_flashcards(document_text, payload.count)
    result = llm_service.run_json(messages, fallback)

    cards_data = result.get("flashcards", fallback["flashcards"]) if isinstance(result, dict) else fallback["flashcards"]

    saved = []
    for card in cards_data[: payload.count]:
        fc = Flashcard(
            user_id=current_user.id,
            document_id=doc.id,
            question=str(card.get("question", "")).strip(),
            answer=str(card.get("answer", "")).strip(),
        )
        db.add(fc)
        saved.append(fc)
    db.commit()
    for fc in saved:
        db.refresh(fc)

    return saved


@router.get("", response_model=list[FlashcardOut])
def list_flashcards(document_id: int | None = None, db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    query = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    if document_id is not None:
        query = query.filter(Flashcard.document_id == document_id)
    return query.order_by(Flashcard.created_at.desc()).all()


@router.delete("/{flashcard_id}")
def delete_flashcard(flashcard_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fc = db.query(Flashcard).filter(Flashcard.id == flashcard_id, Flashcard.user_id == current_user.id).first()
    if not fc:
        raise HTTPException(status_code=404, detail="Flashcard not found.")
    db.delete(fc)
    db.commit()
    return {"message": "Flashcard deleted."}
