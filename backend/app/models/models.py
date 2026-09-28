"""
StudySphere AI - Database Models

Design note: ALL persistent state (including document chunks and their
embeddings) lives in this relational database. There is no local-disk vector
index and no persisted upload folder. This keeps the backend fully stateless
between requests, which is required for serverless hosts like Vercel: SQLite
works great for local development, and swapping DATABASE_URL to a managed
Postgres (e.g. Vercel Postgres / Neon / Supabase) is all that's needed for a
serverless production deployment - no code changes required.
"""
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship

from app.database.db import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), default="")
    created_at = Column(DateTime, default=utcnow)

    documents = relationship("Document", back_populates="owner", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    flashcards = relationship("Flashcard", back_populates="user", cascade="all, delete-orphan")
    study_paths = relationship("StudyPath", back_populates="user", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="uploading")  # uploading, processing, ready, failed
    num_pages = Column(Integer, default=0)
    num_chunks = Column(Integer, default=0)
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="documents")


class DocumentChunk(Base):
    """
    A single embedded chunk of a document, stored directly in the relational
    database (not on local disk). At query time, the relevant chunks for a
    user (optionally scoped to one document) are loaded and compared against
    the query embedding using an in-memory FAISS index built on the fly -
    fast at this scale, and fully compatible with stateless/serverless hosts.
    """
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False, index=True)
    document_name = Column(String(255), nullable=False)
    page_number = Column(Integer, default=0)
    text = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=False)  # list[float] - portable across SQLite & Postgres
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="chunks")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    sources_json = Column(Text, default="[]")
    study_mode = Column(String(50), default="detailed")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="chat_messages")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="flashcards")


class StudyPath(Base):
    __tablename__ = "study_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    content_json = Column(Text, nullable=False)  # serialized timeline
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="study_paths")
