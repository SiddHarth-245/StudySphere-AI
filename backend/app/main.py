"""
StudySphere AI - Backend Entrypoint
Run with: uvicorn app.main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.db import init_db
from app.api import auth, documents, chat, summarizer, exam, flashcards, knowledge, studypath, dashboard

app = FastAPI(
    title="StudySphere AI API",
    description="Intelligent Academic Knowledge Companion — RAG + Prompt Engineering backend.",
    version="1.0.0",
)

_origins = [o.strip() for o in settings.FRONTEND_ORIGINS.split(",")] if settings.FRONTEND_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,  # set FRONTEND_ORIGINS in production, e.g. https://your-app.vercel.app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {
        "project": "StudySphere AI",
        "status": "online",
        "message": "Hello! I'm ORBIT, your academic knowledge companion. Visit /docs for the API reference.",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(summarizer.router)
app.include_router(exam.router)
app.include_router(flashcards.router)
app.include_router(knowledge.router)
app.include_router(studypath.router)
app.include_router(dashboard.router)
