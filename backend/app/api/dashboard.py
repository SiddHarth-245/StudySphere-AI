"""
StudySphere AI - Dashboard Stats Routes
"""
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document, ChatMessage, Flashcard, StudyPath
from app.models.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_documents = db.query(func.count(Document.id)).filter(Document.user_id == current_user.id).scalar() or 0
    questions_asked = (
        db.query(func.count(ChatMessage.id))
        .filter(ChatMessage.user_id == current_user.id, ChatMessage.role == "user")
        .scalar() or 0
    )
    study_sessions = (
        db.query(func.count(func.distinct(StudyPath.document_id)))
        .filter(StudyPath.user_id == current_user.id)
        .scalar() or 0
    )
    flashcards_generated = (
        db.query(func.count(Flashcard.id)).filter(Flashcard.user_id == current_user.id).scalar() or 0
    )

    return DashboardStats(
        total_documents=total_documents,
        questions_asked=questions_asked,
        study_sessions=study_sessions,
        flashcards_generated=flashcards_generated,
    )
