"""
StudySphere AI - Document Upload & Processing Routes

Pipeline (matches the RAG architecture in the README):
  Upload -> Extract text -> Clean -> Chunk -> Embed -> Store chunks + embeddings in the database

Note: the uploaded PDF itself is only ever written to a temporary file for the
duration of processing and is discarded immediately afterward - only the
extracted text and embeddings are kept. This keeps the backend fully
stateless between requests, which is required for serverless hosts (Vercel)
that provide no persistent disk.
"""
import os
import tempfile

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database.db import get_db
from app.models.models import User, Document, ChatMessage, Flashcard, StudyPath
from app.models.schemas import DocumentOut
from app.services.pdf_service import chunk_document
from app.rag import vector_store

router = APIRouter(prefix="/api/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf"}


@router.post("/upload", response_model=DocumentOut)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    document = Document(
        user_id=current_user.id,
        filename=file.filename,
        status="processing",
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Processing happens synchronously here for simplicity and reliability in
    # a student-project context. It is isolated in its own try/except so a
    # bad PDF marks the document "failed" instead of crashing the request.
    # The upload is written to a temp file only for the duration of parsing.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file.file.read())
            tmp_path = tmp.name

        chunks = chunk_document(tmp_path)
        vector_store.add_document_chunks(
            db=db,
            user_id=current_user.id,
            document_id=document.id,
            document_name=document.filename,
            chunks=chunks,
        )
        num_pages = max((c.page_number for c in chunks), default=0)

        document.status = "ready"
        document.num_pages = num_pages
        document.num_chunks = len(chunks)
    except Exception as e:  # noqa: BLE001
        document.status = "failed"
        document.error_message = str(e)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    db.commit()
    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    vector_store.delete_document(db, current_user.id, document_id)

    db.query(ChatMessage).filter(ChatMessage.document_id == document_id).delete()
    db.query(Flashcard).filter(Flashcard.document_id == document_id).delete()
    db.query(StudyPath).filter(StudyPath.document_id == document_id).delete()

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully."}
