"""
StudySphere AI - Knowledge Explorer Routes
Builds a topic -> subtopic hierarchy from a document for the frontend's
interactive knowledge-graph visualization.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document
from app.models.schemas import KnowledgeGraphRequest, KnowledgeGraphResponse
from app.prompts.prompt_manager import build_knowledge_graph_prompt
from app.rag import vector_store
from app.services import llm_service
from app.services.fallback_generators import fallback_knowledge_graph

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Explorer"])


@router.post("/graph", response_model=KnowledgeGraphResponse)
def build_graph(payload: KnowledgeGraphRequest, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == payload.document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    if doc.status != "ready":
        raise HTTPException(status_code=400, detail=f"Document is not ready yet (status: {doc.status}).")

    document_text = vector_store.get_all_document_text(db, current_user.id, doc.id)
    if not document_text.strip():
        raise HTTPException(status_code=400, detail="No extractable text found in this document.")

    messages = build_knowledge_graph_prompt(document_text)
    fallback = fallback_knowledge_graph(doc.filename, document_text)
    result = llm_service.run_json(messages, fallback)

    if not isinstance(result, dict) or "root" not in result:
        result = fallback

    return KnowledgeGraphResponse(**result)
