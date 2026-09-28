# 🪐 StudySphere AI — Intelligent Academic Knowledge Companion

> **"Turn Your Study Materials Into Interactive Knowledge."**

StudySphere AI is a full-stack Generative AI academic workspace built around **ORBIT**, an AI companion that
turns any PDF — notes, textbooks, question papers, research papers — into an interactive, chattable,
quizzable, and visually explorable knowledge base using **Retrieval-Augmented Generation (RAG)** and
**Prompt Engineering**.

This is a complete, runnable project, engineered to be genuinely easy to deploy: a lightweight,
**fully stateless** FastAPI backend (deployable as Vercel serverless functions) and a React + Tailwind +
Framer Motion frontend — both parts of the **same Vercel deployment flow**. It's built to help with real
coursework: assignments, exam preparation, and project overviews.

---

## 1. Project Introduction

Students accumulate huge volumes of PDFs every semester — lecture notes, textbooks, previous year papers —
but rarely have time to revisit all of it meaningfully before exams. StudySphere AI turns that pile of PDFs
into an active study partner: upload once, then chat, summarize, generate exam questions, build flashcards,
explore the topic map, and follow a personalized day-by-day study plan — all grounded in *your own*
documents, with page-level citations.

## 2. Problem Statement

- Students have large amounts of unstructured study material (PDFs) but no easy way to query it directly.
- Generic AI chatbots hallucinate or answer from general knowledge instead of the student's own syllabus.
- Manually creating flashcards, revision notes, and study schedules from long documents is time-consuming.
- There's no single tool that combines document Q&A, summarization, exam prep, and study planning together.

## 3. Solution

StudySphere AI ingests a student's PDFs into a personal, isolated knowledge base and exposes that knowledge
through six connected tools — AI Chat, Study Modes, Exam Assistant, Summarizer, Flashcards, Knowledge
Explorer, and the signature **AI Study Path** — all powered by a real RAG backend and a prompt-engineered
LLM layer that adapts its tone and depth to how the student wants to learn.

## 4. Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Simple sign-up (name, email, password only), JWT sessions, per-user isolated workspace |
| 📄 **Smart Upload** | Drag-and-drop PDF upload with an animated processing pipeline (extract → chunk → embed) |
| 💬 **RAG AI Chat** | Ask questions about your documents; ORBIT answers only from retrieved context |
| 📌 **Source Citations** | Every answer shows the source PDF name, page number, and snippet |
| 🎯 **Smart Study Modes** | Explain Simply, Detailed, Exam Prep, Quick Revision, Beginner — each a distinct prompt |
| 🎓 **AI Exam Assistant** | Important Qs, MCQs, Short/Long Qs, Revision Notes, Viva Qs at Easy/Medium/Hard |
| 📝 **PDF Summarizer** | Short / Detailed / Bullet-point summaries of any document |
| 🗂️ **Flashcard Generator** | AI-generated Q/A flashcards with a flip animation and prev/next navigation |
| 🕸️ **Knowledge Explorer** | Interactive, animated Subject → Topic → Subtopic map |
| 🛣️ **AI Study Path** | A day-by-day generated learning + revision timeline, presented as an animated timeline |
| 📊 **Dashboard** | Animated stats: documents, questions asked, study sessions, flashcards generated |

Every feature above is **fully implemented and working end-to-end** — including a dependency-free fallback
mode (see §9) so the app is fully demoable even without a paid LLM API key.

## 5. Technology Stack

**Frontend:** React 18 (Vite), Tailwind CSS, Framer Motion, Lucide Icons, React Router, Axios, React Markdown

**Backend:** Python, FastAPI (deployed as Vercel serverless functions), SQLAlchemy, python-jose (JWT), bcrypt

**Database:** SQLite for local development (zero setup); a managed Postgres (Vercel Postgres / Neon /
Supabase) for production — just change one environment variable, no code changes

**Generative AI / RAG:** PyMuPDF (PDF parsing), FAISS (in-memory vector similarity search, built per-request
from the database), an OpenAI-compatible `/embeddings` endpoint for semantic vectors, a lightweight
dependency-free hashing-vectorizer fallback for fully offline use, an OpenAI-compatible Chat Completions API
for generation, and a dedicated **Prompt Management module**

> **Why not Sentence-Transformers / PyTorch?** They work great, but PyTorch alone adds 700MB-2GB to a
> deployment — far too heavy for Vercel's serverless function size limit. StudySphere AI intentionally uses a
> tiny dependency footprint (well under 500MB installed) while still supporting real semantic embeddings
> whenever an API key is configured.

## 6. System Architecture

```
studysphere-ai/
├── backend/
│   ├── api/
│   │   └── index.py       # Vercel serverless entry point (exports the FastAPI app)
│   ├── app/
│   │   ├── api/           # FastAPI route modules (one per feature)
│   │   ├── core/          # config, security (JWT/bcrypt), shared deps
│   │   ├── database/      # SQLAlchemy engine/session (SQLite or Postgres)
│   │   ├── models/        # ORM models + Pydantic schemas
│   │   ├── prompts/       # Prompt Engineering module (all system prompts live here)
│   │   ├── rag/           # Database-backed vector store + ephemeral FAISS search
│   │   ├── services/      # PDF extraction, embeddings, LLM client, fallback generators
│   │   └── main.py        # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── vercel.json         # Vercel serverless deployment config
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/            # Axios client with auth interceptor
    │   ├── context/        # Auth + Documents React contexts
    │   ├── components/     # Sidebar, ORBIT orb, shared UI primitives
    │   └── pages/          # Landing, Login/Signup, Dashboard, and all feature pages
    ├── package.json
    ├── vercel.json          # Vercel SPA deployment config
    └── .env.example
```

**Frontend ↔ Backend:** the React app talks to FastAPI purely over REST (`VITE_API_URL`), with a JWT bearer
token attached automatically by an Axios interceptor. Frontend and backend deploy as **two separate Vercel
projects** from the same repository (one with Root Directory `frontend`, one with Root Directory `backend`)
— this is the standard, supported way to run a non-Next.js API alongside a Vercel frontend.

**A key design decision — full statelessness:** every piece of persistent data (users, documents, chat
history, flashcards, study paths, *and* document chunks with their embeddings) lives in the relational
database. Nothing is written to local disk that needs to survive between requests. Uploaded PDFs are
processed via a temporary file that's discarded immediately after text extraction. This is what makes the
backend deployable as Vercel serverless functions in the first place — serverless functions get a fresh,
throwaway filesystem on every invocation, so anything you need later must live in a database, not on disk.

## 7. RAG Workflow

```
PDF Upload
   ↓
PyMuPDF Text Extraction (per page, via a temp file discarded immediately after)
   ↓
Text Cleaning (whitespace/hyphenation fixes)
   ↓
Overlapping Character-Based Chunking (page-tagged)
   ↓
Embedding Generation
   (OpenAI-compatible /embeddings endpoint if LLM_API_KEY is set,
    otherwise a deterministic offline hashing-vectorizer)
   ↓
Stored as rows in the database (SQLite locally / Postgres in production)
   ↓
User Question
   ↓
Relevant rows loaded from the database and compared via an in-memory
FAISS index built fresh for that request (cosine similarity, top-k)
   ↓
Prompt Construction (ORBIT persona + selected Study Mode + retrieved context)
   ↓
LLM Chat Completion  (or a deterministic extractive fallback if no API key is set)
   ↓
Answer + Per-Chunk Source Citations (PDF name + page number)
```

This exact pipeline is reused, with different prompts, for the Summarizer, Exam Assistant, Flashcards,
Knowledge Explorer, and AI Study Path — they all pull the document's stored chunks from the database and
pass them through the Prompt Management module (`backend/app/prompts/prompt_manager.py`).

### Prompt Engineering Module

All system prompts live in one file, `app/prompts/prompt_manager.py`, so they're easy to inspect and explain
in a viva:

- **ORBIT_PERSONA** — the base persona: helpful, academic, and instructed to *never hallucinate* and to say
  when an answer isn't in the uploaded material.
- **STUDY_MODE_PROMPTS** — five distinct instructions (`beginner`, `explain_simply`, `detailed`,
  `exam_prep`, `quick_revision`) that are layered on top of the persona depending on what the student
  selects in the Chat UI.
- Dedicated prompt builders for summaries, exam questions, flashcards (strict JSON), knowledge graphs
  (strict JSON), and the AI Study Path (strict JSON).

## 8. Installation Steps (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) an API key from OpenAI, Groq, OpenRouter, Together AI, or another OpenAI-compatible provider

### Clone / Unzip
```bash
cd studysphere-ai
```

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt   # a lean install — no PyTorch, well under 500MB
cp .env.example .env            # then edit .env if you have an API key (optional)
```

### Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env            # defaults to http://localhost:8000, edit if needed
```

## 9. Environment Variables

**`backend/.env`**

| Variable | Description | Default |
|---|---|---|
| `APP_SECRET_KEY` | Secret used to sign JWT tokens — change this! | dev placeholder |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT session length | `1440` (24h) |
| `LLM_API_KEY` | Your LLM provider's API key | *(empty)* |
| `LLM_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `LLM_MODEL` | Chat model name | `gpt-4o-mini` |
| `EMBEDDING_MODEL` | OpenAI-compatible embeddings model (used only if `LLM_API_KEY` is set) | `text-embedding-3-small` |
| `DATABASE_URL` | SQLAlchemy connection string — SQLite locally, Postgres in production | `sqlite:///./studysphere.db` |
| `FRONTEND_ORIGINS` | Comma-separated allowed CORS origins | `*` (tighten in production) |

> **No API key? No problem.** If `LLM_API_KEY` is left blank, StudySphere AI automatically uses a
> deterministic, dependency-free **hashing-vectorizer** for embeddings and a non-hallucinating **extractive
> mode** for every generative feature — surfacing the most relevant content straight from your own
> documents. The entire application is fully functional and demoable with **zero cost and zero setup**
> beyond installing dependencies — add a key later any time to unlock full semantic embeddings and
> generative answers.

**`frontend/.env`**

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | URL of the running backend | `http://localhost:8000` |

## 10. How to Run Locally

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
- API root: http://localhost:8000
- Interactive API docs (Swagger): http://localhost:8000/docs
- On first run, tables are created automatically in `studysphere.db`. No model downloads required.

**Frontend:**
```bash
cd frontend
npm run dev
```
- App: http://localhost:5173 (make sure the backend is running first)

### Quick Start Checklist
1. Start the backend (`uvicorn app.main:app --reload --port 8000`)
2. Start the frontend (`npm run dev`)
3. Open http://localhost:5173, click **Get Started**, sign up with your name, email, and password
4. Go to **My Library** → upload a PDF → wait for "StudySphere is Ready!"
5. Head to **AI Chat** and ask a question about your document

## 11. Deployment — Both Frontend and Backend on Vercel

Because the backend is fully stateless (no local database file, no local vector index — see §6), it deploys
to Vercel's Python serverless runtime just as cleanly as the React frontend deploys to Vercel's static/edge
hosting. Both live in the same GitHub repo, as **two separate Vercel projects**.

### 11.1 Step 1 — Create a Postgres database

Serverless functions have no persistent disk, so SQLite (a single local file) can't be used in production —
you need a real database reachable over the network. The easiest option is entirely inside Vercel:

1. In your Vercel dashboard, open **Storage → Create Database → Postgres** (this provisions a free
   Neon-backed Postgres instance and is designed to be used exactly like this).
2. Copy the connection string it gives you (it will look like `postgres://user:pass@host/dbname`).

*(Neon or Supabase's own free tiers work identically if you'd rather manage the database outside Vercel.)*

### 11.2 Step 2 — Deploy the backend to Vercel

1. Push this repository to GitHub.
2. On [vercel.com](https://vercel.com), click **Add New → Project**, import the repo, and set the
   **Root Directory** to `backend`. Vercel will detect `vercel.json` and the Python runtime automatically.
3. Add these Environment Variables in the project settings:
   - `APP_SECRET_KEY` — any long random string
   - `DATABASE_URL` — the Postgres connection string from Step 1
   - `LLM_API_KEY` — optional; leave unset to use the built-in fallback mode
   - `LLM_BASE_URL`, `LLM_MODEL`, `EMBEDDING_MODEL` — optional, sensible defaults are built in
4. Deploy. Copy the resulting URL, e.g. `https://studysphere-ai-backend.vercel.app`.

### 11.3 Step 3 — Deploy the frontend to Vercel

1. Click **Add New → Project** again, import the *same* repo, and set the **Root Directory** to `frontend`.
2. Vercel auto-detects the Vite framework and the included `vercel.json` (build command, output directory,
   and a rewrite rule so React Router works on refresh/deep links).
3. Add an environment variable: `VITE_API_URL` = the backend URL from Step 2.
4. Deploy. Your app will be live at `https://<your-project>.vercel.app`.

### 11.4 Step 4 — Lock down CORS

Back in the **backend** project's settings, add `FRONTEND_ORIGINS` = your frontend's Vercel URL (e.g.
`https://studysphere-ai.vercel.app`) and redeploy, so the API only accepts requests from your own frontend.

### 11.5 Good to know

- **Cold starts:** the first request after a period of inactivity may take a couple of seconds while the
  function boots — this is normal for serverless hosting.
- **Function duration:** `backend/vercel.json` requests a 60-second timeout for large-document processing.
  Vercel's Hobby (free) plan supports this via Fluid Compute (enabled by default on new projects); very old
  Hobby projects without Fluid Compute are capped at 10 seconds — upgrade to Pro or enable Fluid Compute if
  you hit this limit on a large PDF.
- **Alternative hosts:** if you'd rather not manage an external Postgres, the same backend can be deployed
  to Render, Railway, or Fly.io with zero code changes — just set the same environment variables there.

## 12. Screenshots

_Add your own screenshots here before submission — suggested shots:_
- Landing page hero
- Dashboard with animated stats
- Document upload pipeline animation
- AI Chat with source citations
- Flashcard flip animation
- Knowledge Explorer topic map
- AI Study Path timeline

## 13. Future Enhancements

- Add Redis or a managed cache in front of the ephemeral FAISS rebuild for very large personal libraries
- Multi-PDF cross-document chat ("compare Chapter 3 across both textbooks")
- Streaming token-by-token responses over WebSockets/SSE
- OCR support for scanned PDFs (currently text-layer PDFs only)
- Collaborative study groups / shared document workspaces
- Mobile app (React Native) wrapping the same FastAPI backend
- Spaced-repetition scheduling for the Flashcard Generator

---

## Design Notes (for viva / evaluation)

- **Why store embeddings in the database instead of a local FAISS index file?** Serverless hosts like Vercel
  give every function invocation a fresh, throwaway filesystem — anything written to disk is not guaranteed
  to exist on the next request. By making the database the single source of truth and rebuilding a small
  in-memory FAISS index per request, the exact same code works identically on a laptop (SQLite) or on Vercel
  (Postgres), with no persistence or cache-invalidation logic required.
- **Isn't rebuilding a FAISS index on every request wasteful?** At the scale of one student's personal
  document library (typically hundreds, not millions, of chunks), building a flat `IndexFlatIP` in memory
  takes single-digit milliseconds — effectively free compared to the LLM call that follows it.
- **Why a hashing-vectorizer fallback instead of a downloaded embedding model?** It keeps the entire backend
  dependency-light (well under 500MB, no PyTorch), removes any first-run model-download step, and still
  produces genuinely comparable vectors for cosine-similarity search — a legitimate, classical IR technique
  (the same idea behind scikit-learn's `HashingVectorizer`), not a placeholder.
- **Why is document processing synchronous on upload?** Simplicity and reliability for a project of this
  scope — the animated frontend pipeline (`Uploading → Extracting → Building AI Memory → Ready`) makes the
  wait feel purposeful, and it stays well within Vercel's function timeout for typical assignment-sized PDFs.
- **Why an extractive fallback instead of just failing without an API key?** So graders/evaluators can run
  and demo *every single feature* immediately after `pip install`, without needing to obtain and pay for an
  LLM API key.

---

Built with ❤️ using FastAPI, React, RAG, and Prompt Engineering — by StudySphere AI.
