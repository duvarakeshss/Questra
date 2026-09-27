# agent.md — Questra Operating Guide

Operating guide for any AI agent or developer working in this repository. Read this before
making changes. It covers what the project is, how to set it up, how to run it, and the rules
you must not break.

---

## 1. What this project is

Questra is a multimodal intent-aware query discovery system. It accepts any combination of
**image, voice, and text**, fuses them into a single multimodal intent, generates candidate
search queries, scores them for intentionality, selects a diverse subset with MMR, lets the
user confirm or edit a query, then searches and semantically reranks the results.

```
image + voice + text  →  fusion  →  candidate generation  →  intentionality scoring
      →  MMR diversity  →  user confirmation  →  search  →  semantic reranking  →  results
```

Stack: **React + Vite** frontend, **Python + FastAPI** backend (virtualenv), **Groq** for
vision/speech/text, local **Sentence Transformers** for embeddings, **SerpAPI** for search.

Start with [architecture.md](architecture.md) for the full system picture.

---

## 2. Repo map

```
Questra/
├── backend/            # FastAPI app  (code — see §4 to run)
├── frontend/           # React + Vite app  (code — see §5 to run)
├── plan/               # all planning + design docs
│   ├── idea.md             # concept + research motivation
│   ├── plan.md             # implementation plan
│   ├── tasks.md            # phase / task breakdown
│   ├── architecture.md     # canonical architecture reference
│   └── agent.md            # this file
└── docs/               # superpowers design spec
```

`backend/` and `frontend/` are the code you will edit. Everything under `plan/` and `docs/`
is documentation — keep it accurate when the design changes.

---

## 3. Prerequisites

- **Python** 3.11 or newer
- **Node.js** 18 or newer (npm included)
- **Groq API key** — https://console.groq.com
- **SerpAPI key** — https://serpapi.com

---

## 4. Backend setup and run (virtualenv)

```bash
cd backend

# 1. Create and activate the virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create your env file and fill in the keys
# Windows:
copy .env.example .env
# macOS / Linux:
cp .env.example .env

# 4. Run the API
uvicorn app:app --reload --port 8000
```

- API root: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

Leave the venv activated for every backend command. Never commit `.env` or `.venv`.

Auth and the free-query quota need Supabase: add `SUPABASE_URL` + keys to `.env`, run
`backend/supabase/schema.sql`, and enable email OTP + custom SMTP in the dashboard — see
[supabase-setup.md](supabase-setup.md). If Supabase is unconfigured (or the usage table is
missing) the quota falls back to a local SQLite store so the limit still holds.

---

## 5. Frontend setup and run

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies API calls to the backend on port 8000. The backend must be running
for the app to work end to end.

---

## 6. Common commands

| Task | Command | Where |
|------|---------|-------|
| Install backend deps | `pip install -r requirements.txt` | `backend/` (venv active) |
| Run backend | `uvicorn app:app --reload --port 8000` | `backend/` (venv active) |
| Backend tests | `pytest tests/ -v` | `backend/` (venv active) |
| Install frontend deps | `npm install` | `frontend/` |
| Run frontend | `npm run dev` | `frontend/` |
| Frontend build | `npm run build` | `frontend/` |
| Health check | `curl http://localhost:8000/api/health` | anywhere |

---

## 7. Architecture guardrails (must follow)

These boundaries are load-bearing. Breaking them makes the system hard to test and couples it
to a single provider.

- **Strict layering: API → Pipeline → Services.** A route parses/validates and delegates; it
  contains **no business logic**. Pipeline modules do one job each and never reach into each
  other's internals. All external calls (Groq, SerpAPI) go through `services/`.
- **Provider independence.** Keep Groq and SerpAPI behind the service interfaces. Swapping a
  provider must not require touching the API layer.
- **All config through `config/settings.py`** (Pydantic Settings). Never hardcode API keys, model
  names, counts, or MMR λ — they belong in `.env` with defaults in settings.
- **Uploads are processed in memory.** Validate MIME type and size, then discard; never persist
  user media. Clean any temp files after processing.
- **Secrets never leave the backend.** The frontend never sees an API key. Never log keys, raw
  uploads, or sensitive user data. The Supabase **service-role/secret** key is backend-only — it
  must never appear in the frontend or any `VITE_*` variable. Auth and the free-query quota run on
  Supabase; setup is in [supabase-setup.md](supabase-setup.md). Meter usage in `public.query_usage`
  through `services/quota_service.py` (never hardcode limits — they come from settings).
- **Inference only.** No RL training, no microservices, and no vector DB. A database is used only
  for accounts and usage metering (Supabase) — never for search or model state.

---

## 8. Coding conventions

**Python (backend)**

- Type-hint all function signatures; use Pydantic v2 models for I/O.
- One responsibility per pipeline module.
- Raise typed errors that map to the codes in
  [architecture.md §11](architecture.md#11-error-handling); the API layer turns them into
  `ErrorResponse`.
- Keep LLM/API calls centralized in the service classes.

**JavaScript (frontend)**

- Function components and hooks only.
- Stage state via `useState` — no state-management library.
- All HTTP calls centralized in `src/services/api.js`.
- Tailwind CSS for styling.

---

## 9. Testing conventions

- Framework: **pytest** (`backend/tests/`).
- Mock Groq and SerpAPI with `unittest.mock.patch` — test the logic, not the externals.
- Cover all seven modality combinations for fusion.
- Run `pytest tests/ -v` before considering backend work done.

---

## 10. Pre-flight checklist

Before starting work:

1. Read [architecture.md](architecture.md), [idea.md](idea.md), [plan.md](plan.md), and
   [tasks.md](tasks.md).
2. Confirm you are following the layering and config rules in §7.
3. Check [tasks.md](tasks.md) for the current phase and dependencies.

A change is done when the backend starts, the frontend runs, `pytest` passes, and the relevant
Definition of Done items in [idea.md §38](idea.md) are satisfied.

---

## 11. Do-not list

- Do not reproduce the paper's RL training pipeline (PPO, PolicyNet, RewardNet, REINFORCE, RLHF).
- Do not assume a large dataset is required.
- Do not build a custom vector database without a demonstrated need.
- Do not create microservices — a modular FastAPI backend is enough.
- Do not couple business logic to a single LLM or search provider.
- Do not call external AI APIs from scattered modules — centralize in services.
- Do not expose API keys to the frontend.
- Do not store user-uploaded media permanently.
- Do not implement future extensions unless asked.
- Do not optimize before the end-to-end pipeline works.
