"""
StudySphere AI - AI Exam Assistant Routes
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document
from app.models.schemas import ExamRequest, ExamResponse
from app.prompts.prompt_manager import build_exam_prompt
from app.rag import vector_store
from app.services import llm_service

router = APIRouter(prefix="/api/exam", tags=["Exam Assistant"])


@router.post("/generate", response_model=ExamResponse)
def generate(payload: ExamRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document is not ready yet (status: {doc.status}).")

    document_text = vector_store.get_all_document_text(db, current_user.id, doc.id)
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document.")

    messages = build_exam_prompt(document_text, payload.question_type, payload.difficulty, payload.count)
    content = llm_service.run_chat(messages, document_text)
    return ExamResponse(content=content)
