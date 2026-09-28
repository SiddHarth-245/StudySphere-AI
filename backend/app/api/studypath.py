"""
StudySphere AI - "AI Study Path" Routes
The signature differentiating feature: analyzes uploaded material and
produces a day-by-day learning + revision timeline.
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document, StudyPath as StudyPathModel
from app.models.schemas import StudyPathRequest, StudyPathResponse
from app.prompts.prompt_manager import build_study_path_prompt
from app.rag import vector_store
from app.services import llm_service
from app.services.fallback_generators import fallback_study_path

router = APIRouter(prefix="/api/study-path", tags=["AI Study Path"])


@router.post("/generate", response_model=StudyPathResponse)
def generate(payload: StudyPathRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document is not ready yet (status: {doc.status}).")

    document_text = vector_store.get_all_document_text(db, current_user.id, doc.id)
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document.")

    messages = build_study_path_prompt(document_text, payload.days)
    fallback = fallback_study_path(document_text, payload.days)
    result = llm_service.run_json(messages, fallback)

    if not isinstance(result, dict) or "plan" not in result:
        result = fallback

    record = StudyPathModel(user_id=current_user.id, document_id=doc.id, content_json=json.dumps(result["plan"]))
    db.add(record)
    db.commit()

    return StudyPathResponse(**result)


@router.get("/latest", response_model=StudyPathResponse)
def latest(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = (
        db.query(StudyPathModel)
        .filter(StudyPathModel.user_id == current_user.id, StudyPathModel.document_id == document_id)
        .order_by(StudyPathModel.created_at.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No study path generated yet for this document.")
    return StudyPathResponse(plan=json.loads(record.content_json))
