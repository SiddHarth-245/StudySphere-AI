"""
StudySphere AI - Pydantic Schemas (request / response contracts)
"""
from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel, EmailStr, Field


# ---------------- Auth ----------------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------- Documents ----------------

class DocumentOut(BaseModel):
    id: int
    filename: str
    status: str
    num_pages: int
    num_chunks: int
    error_message: Optional[str] = ""
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- Chat ----------------

StudyModeType = Literal["explain_simply", "detailed", "exam_prep", "quick_revision", "beginner"]


class ChatRequest(BaseModel):
    message: str
    document_id: Optional[int] = None  # None => search across all of the user's documents
    study_mode: StudyModeType = "detailed"


class SourceChunk(BaseModel):
    document_name: str
    page_number: int
    snippet: str


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    study_mode: str


class ChatHistoryItem(BaseModel):
    id: int
    role: str
    content: str
    sources_json: str
    study_mode: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------- Summarizer ----------------

class SummarizeRequest(BaseModel):
    document_id: int
    summary_type: Literal["short", "detailed", "bullet"] = "bullet"


class SummarizeResponse(BaseModel):
    summary: str


# ---------------- Exam Assistant ----------------

class ExamRequest(BaseModel):
    document_id: int
    question_type: Literal["important", "mcq", "short", "long", "revision_notes", "viva"]
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    count: int = Field(default=5, ge=1, le=20)


class ExamResponse(BaseModel):
    content: str


# ---------------- Flashcards ----------------

class FlashcardGenerateRequest(BaseModel):
    document_id: int
    count: int = Field(default=8, ge=1, le=30)


class FlashcardOut(BaseModel):
    id: int
    question: str
    answer: str

    class Config:
        from_attributes = True


# ---------------- Knowledge Explorer ----------------

class KnowledgeGraphRequest(BaseModel):
    document_id: int


class KnowledgeNode(BaseModel):
    name: str
    children: List["KnowledgeNode"] = []


KnowledgeNode.model_rebuild()


class KnowledgeGraphResponse(BaseModel):
    root: KnowledgeNode


# ---------------- AI Study Path ----------------

class StudyPathRequest(BaseModel):
    document_id: int
    days: int = Field(default=5, ge=1, le=30)


class StudyDayPlan(BaseModel):
    day: int
    title: str
    topics: List[str]
    is_revision: bool = False


class StudyPathResponse(BaseModel):
    plan: List[StudyDayPlan]


# ---------------- Dashboard ----------------

class DashboardStats(BaseModel):
    total_documents: int
    questions_asked: int
    study_sessions: int
    flashcards_generated: int
