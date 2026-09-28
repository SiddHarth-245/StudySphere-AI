"""
StudySphere AI - Vercel Serverless Entry Point
================================================
Vercel's Python runtime detects an ASGI-compatible `app` object exported from
a file under /api and serves it as a serverless function. Every request to
this deployment (see the routing rule in backend/vercel.json) is handled by
this single FastAPI application - the same one used for local development
via `uvicorn app.main:app`.
"""
from app.main import app  # noqa: F401  (re-exported for Vercel's Python runtime)
