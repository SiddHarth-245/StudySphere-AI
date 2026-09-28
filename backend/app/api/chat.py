"""
StudySphere AI - RAG Chat Routes
Implements the retrieval-augmented generation flow:
  Question -> similarity search -> build prompt with retrieved context ->
  LLM (or extractive fallback) -> answer + source citations -> persist history
"""
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, ChatMessage, Document
from app.models.schemas import ChatRequest, ChatResponse, SourceChunk, ChatHistoryItem
from app.prompts.prompt_manager import build_chat_prompt
from app.rag import vector_store
from app.services import llm_service

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


@router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.document_id is not None:
        doc = db.query(Document).filter(
            Document.id == payload.document_id, Document.user_id == current_user.id
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

    results = vector_store.similarity_search(
        db=db,
        user_id=current_user.id,
        query=payload.message,
        top_k=5,
        document_id=payload.document_id,
    )

    if not results:
        answer = (
            "I couldn't find anything related to that in your uploaded documents yet. "
            "Try uploading a relevant PDF first, or rephrase your question."
        )
        sources = []
    else:
        context = "\n\n".join(f"[{r['document_name']} - Page {r['page_number']}]\n{r['text']}" for r in results)
        messages = build_chat_prompt(payload.message, context, payload.study_mode)
        answer = llm_service.run_chat(messages, context)
        sources = [
            SourceChunk(document_name=r["document_name"], page_number=r["page_number"], snippet=r["text"][:200])
            for r in results
        ]

    # Persist both turns for chat history / dashboard stats
    db.add(ChatMessage(user_id=current_user.id, document_id=payload.document_id, role="user", content=payload.message,
                        study_mode=payload.study_mode))
    db.add(ChatMessage(
        user_id=current_user.id,
        document_id=payload.document_id,
        role="assistant",
        content=answer,
        sources_json=json.dumps([s.model_dump() for s in sources]),
        study_mode=payload.study_mode,
    ))
    db.commit()

    return ChatResponse(answer=answer, sources=sources, study_mode=payload.study_mode)


@router.get("/history", response_model=list[ChatHistoryItem])
def chat_history(document_id: int | None = None, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id is not None:
        query = query.filter(ChatMessage.document_id == document_id)
    return query.order_by(ChatMessage.created_at.asc()).all()


@router.delete("/history")
def clear_history(document_id: int | None = None, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id is not None:
        query = query.filter(ChatMessage.document_id == document_id)
    query.delete()
    db.commit()
    return {"message": "Chat history cleared."}
