# Questra — Architecture

Questra is a multimodal intent-aware query discovery system. It accepts any combination of
**image, voice, and text**, fuses them into a single multimodal intent, generates candidate
search queries, scores them for intentionality, selects a diverse subset with MMR, lets the
user confirm or edit a query, then searches and semantically reranks the results.

```
image + voice + text  →  fusion  →  candidate generation  →  intentionality scoring
      →  MMR diversity  →  user confirmation  →  search  →  semantic reranking  →  results
```

This document is the canonical architecture reference. For deeper rationale, see the
[design specification](../docs/superpowers/specs/2026-09-22-questra-design.md). The concept lives
in [idea.md](idea.md), the build plan in [plan.md](plan.md), and the task breakdown in
[tasks.md](tasks.md).

---

## 1. Goals and Non-Goals

### Goals

- Accept image, voice, and text inputs in any combination (at least one required).
- Generate candidate search queries from the fused multimodal context (default 12, configurable).
- Score each candidate for intentionality — how well it captures the user's intent.
- Select a diverse subset (3–5) using Maximal Marginal Relevance.
- Let the user confirm, edit, or write a custom query before searching.
- Search via SerpAPI and rerank results by semantic similarity.
- Run as a local prototype with no persistent storage and no auth.

### Non-Goals

- Production deployment, scaling, or multi-user support.
- User accounts, sessions, or saved search history.
- Real-time streaming of LLM responses.
- Mobile-optimized UI.
- Search engines other than Google (reached through SerpAPI).
- Reinforcement-learning training of any kind (see [§17](#17-research-framing)).

---

## 2. System Context

```
                       ┌──────────────────────────────┐
                       │      Browser (user)          │
                       └──────────────┬───────────────┘
                                      │
                       ┌──────────────▼───────────────┐
                       │   Frontend — React 18 + Vite │
                       │   (3-stage SPA, axios)       │
                       └──────────────┬───────────────┘
                                      │  HTTP / JSON  (multipart for uploads)
                       ┌──────────────▼───────────────┐
                       │   Backend — Python + FastAPI │
                       │                              │
                       │   API Layer                  │
                       │     routes_health            │
                       │     routes_query             │
                       │     routes_search            │
                       │            │                 │
                       │   Pipeline Layer             │
                       │     speech  vision  fusion   │
                       │     candidate_gen  scoring   │
                       │     diversity  search  rerank│
                       │            │                 │
                       │   Services Layer             │
                       │     llm_service (Groq)       │
                       │     embedding_service (ST)   │
                       │     search_service (SerpAPI) │
                       └──────┬───────────────┬───────┘
                              │               │
              ┌───────────────▼──┐     ┌──────▼──────────────┐
              │  Groq API         │     │  SerpAPI            │
              │  · Llama 4 (vision)│    │  · Google results   │
              │  · Whisper (STT)   │    │                     │
              │  · Llama 3.3 (text)│    └─────────────────────┘
              └───────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  Sentence Transformers (local) │
              │  all-MiniLM-L6-v2 (CPU)        │
              └───────────────────────────────┘
```

The backend is the only component that holds secrets and talks to external providers. The
frontend never sees an API key.

---

## 3. Component Architecture

### 3.1 Frontend — React + Vite

A single-page application with three stages that map directly to the user journey. State is
plain React `useState` — a three-stage flow does not justify a state library.

| Stage | Components | Entered when |
|-------|-----------|--------------|
| `input` | `ImageInput`, `VoiceInput`, `TextInput`, "Generate Queries" button | Default, and after "New Search" |
| `suggestions` | `QuerySuggestions`, `QueryEditor` | Suggestions API returns |
| `results` | `SearchResults` | Search API returns |

State held in `App.jsx`:

- `stage`: `"input"` | `"suggestions"` | `"results"`
- `suggestions`: the `SuggestionResponse` payload
- `results`: the `SearchResponse` payload
- `loading`: boolean plus a contextual message string

Voice capture uses the browser `MediaRecorder` API (record → pulsing indicator → stop → Blob),
with an "upload audio file" fallback. All HTTP goes through `src/services/api.js`; styling is
Tailwind CSS.

### 3.2 Backend — Python + FastAPI

Three layers, with a strict one-way dependency: **API → Pipeline → Services**.

1. **API layer** (`api/`) — HTTP routes. Parses and validates requests, maps typed errors to
   HTTP responses, returns Pydantic responses. **No business logic.** Auth/quota are resolved
   here via dependencies (`api/deps.py`) that delegate to services.
2. **Pipeline layer** (`pipeline/`) — one responsibility per module (speech→text, image→
   description, fuse, generate, score, select, search, rerank). Modules orchestrate services
   but never reach into each other's internals.
3. **Services layer** (`services/`) — thin wrappers around externals (Groq, SerpAPI, Supabase)
   and the local embedding model. Stateless except for the embedding-model singleton.
   `supabase_client`, `auth_service` and `quota_service` live here; the service-role key never
   leaves the backend.

### 3.3 Auth & free-query quota (Supabase)

Auth (email + password + emailed OTP) and the quota table run on **Supabase**. The frontend
authenticates with `supabase-js` and sends `Authorization: Bearer <token>`; the backend validates
it via Supabase (`auth_service`) and meters usage in `public.query_usage`:

- Logged-out visitors get `ANONYMOUS_FREE_QUERIES` (default 2) suggestion generations, keyed by
  `X-Anon-Id` (falling back to client IP); the next call returns `429 QUOTA_EXCEEDED`.
- Signed-in users are unlimited.
- Setup steps live in [supabase-setup.md](supabase-setup.md).

These boundaries are what make each pipeline module independently testable and keep the
provider choice swappable.

---

## 4. Directory Structure

```
Questra/
├── backend/
│   ├── app.py                    # FastAPI app + CORS + startup
│   ├── api/
│   │   ├── routes_health.py      # GET /api/health
│   │   ├── routes_query.py       # POST /api/query/suggestions
│   │   └── routes_search.py      # POST /api/search
│   ├── pipeline/
│   │   ├── speech.py             # audio → text (Whisper)
│   │   ├── vision.py             # image → description (Llama 4)
│   │   ├── fusion.py             # combine modalities → context
│   │   ├── candidate_gen.py      # context → N candidate queries
│   │   ├── scoring.py            # intentionality scoring (LLM judge)
│   │   ├── diversity.py          # MMR selection
│   │   ├── search.py             # search orchestration
│   │   └── rerank.py             # semantic reranking
│   ├── services/
│   │   ├── llm_service.py        # Groq client wrapper
│   │   ├── embedding_service.py  # Sentence Transformer wrapper
│   │   └── search_service.py     # SerpAPI wrapper
│   ├── models/
│   │   └── schemas.py            # Pydantic models
│   ├── config/
│   │   └── settings.py           # Pydantic Settings from .env
│   ├── tests/                    # pytest unit tests
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageInput.jsx
│   │   │   ├── VoiceInput.jsx
│   │   │   ├── TextInput.jsx
│   │   │   ├── QuerySuggestions.jsx
│   │   │   ├── QueryEditor.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── plan/                         # all planning + design docs
│   ├── idea.md                   # concept + research motivation
│   ├── plan.md                   # implementation plan
│   ├── tasks.md                  # phase / task breakdown
│   ├── architecture.md           # this file
│   └── agent.md                  # agent/dev operating guide
└── docs/                         # superpowers design spec
```

---

## 5. Data Flow

### 5.1 Query suggestions

```
User (image, audio, text)
  → speech.py      : audio_bytes  → transcript        (Groq Whisper)
  → vision.py      : image_bytes  → description       (Groq Llama 4 Scout)
  → fusion.py      : modalities   → MultimodalContext
  → candidate_gen.py: context     → 12 candidate query strings (Groq LLM)
  → scoring.py     : candidates + context → scored QueryCandidates (Groq LLM judge)
  → diversity.py   : scored candidates → 5 diverse QuerySuggestions (MMR + embeddings)
  → SuggestionResponse
```

### 5.2 Search

```
User confirms / edits query
  → search.py : query → 10 raw results      (SerpAPI)
  → rerank.py : query + results → 5 reranked SearchResults (cosine similarity)
  → SearchResponse
```

---

## 6. Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Backend framework | FastAPI | Async, auto OpenAPI docs, Pydantic validation |
| Frontend framework | React 18 + Vite 5 | Fast dev server, simple SPA |
| Styling | Tailwind CSS | Utility-first, no component library needed |
| LLM provider | Groq | Free tier, fast inference, one SDK for vision + speech + text |
| Vision model | `qwen/qwen3.8-27b` | Groq vision-capable model, free tier |
| Speech model | `whisper-large-v3` | Best accuracy, sub-second on Groq |
| Text generation | `openai/gpt-oss-120b` | Fast, good structured JSON output |
| Embeddings | `all-MiniLM-L6-v2` (Sentence Transformers) | 80 MB, runs on CPU, no API calls |
| Search API | SerpAPI (`google-search-results` SDK) | Structured JSON, Google results |
| Intentionality scoring | LLM judge (not CLIP) | Simpler, handles text constraints, one less model |

### Why an LLM judge over CLIP for scoring

CLIP compares image and text embeddings — good for "does this query match this image?" but
blind to text-only constraints like "under 5000 rupees". The LLM judge sends every modality
plus the candidates to Groq in one call and asks for 0–1 scores; it reasons about constraint
matching, is simpler to implement, and avoids downloading a ~400 MB CLIP model.

### Why local Sentence Transformers over an embedding API

`all-MiniLM-L6-v2` is 80 MB, loads once, and runs on CPU. This removes per-request embedding
cost and a network dependency from the MMR and reranking loops, and keeps latency predictable.
The trade-off is a slower first load, mitigated by lazy initialization at startup.

---

## 7. Data Models

Pydantic v2, defined in `backend/models/schemas.py`.

```python
class MultimodalContext(BaseModel):
    image_description: str | None = None
    voice_transcript: str | None = None
    text_input: str | None = None

class QueryCandidate(BaseModel):
    id: str              # UUID
    query: str
    intent_score: float  # 0.0 – 1.0

class QuerySuggestion(BaseModel):
    id: str
    query: str
    intent_score: float
    diversity_rank: int  # 1 = best

class SuggestionResponse(BaseModel):
    success: bool
    suggestions: list[QuerySuggestion]
    context: MultimodalContext  # returned for transparency

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    score: float                 # cosine similarity after reranking
    thumbnail: str | None = None

class SearchResponse(BaseModel):
    success: bool
    query: str
    results: list[SearchResult]

class ErrorDetail(BaseModel):
    code: str                    # e.g. "NO_INPUT", "LLM_ERROR"
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
```

---

## 8. API Contracts

### `GET /api/health`

```json
{ "status": "ok", "models_loaded": true }
```

### `POST /api/query/suggestions`

**Request**: `multipart/form-data`

| Field | Required | Notes |
|-------|----------|-------|
| `image` | one of the three | jpeg, png, webp, gif; max 10 MB |
| `audio` | one of the three | wav, mp3, m4a, webm, ogg; max 25 MB |
| `text`  | one of the three | form field string |

At least one field must be present.

**Response** (200):

```json
{
  "success": true,
  "suggestions": [
    { "id": "uuid", "query": "red leather crossbody bag", "intent_score": 0.94, "diversity_rank": 1 }
  ],
  "context": {
    "image_description": "A red leather handbag with gold hardware...",
    "voice_transcript": "I want something like this but cheaper",
    "text_input": "under 5000 rupees"
  }
}
```

### `POST /api/search`

**Request**: `application/json`

```json
{ "query": "red leather crossbody bag under 5000 rupees" }
```

**Response** (200):

```json
{
  "success": true,
  "query": "red leather crossbody bag under 5000 rupees",
  "results": [
    { "title": "...", "url": "...", "snippet": "...", "score": 0.89, "thumbnail": "..." }
  ]
}
```

### Error envelope

All errors return `ErrorResponse` with `success: false`, a code, and a human-readable message:

```json
{
  "success": false,
  "error": { "code": "NO_INPUT", "message": "At least one input (image, audio, or text) is required" }
}
```

---

## 9. Key Algorithms

### 9.1 Maximal Marginal Relevance (MMR)

Balances relevance and diversity when selecting the final suggestions from scored candidates.

```
MMR(q) = λ · intent_score(q) − (1 − λ) · max_similarity(q, already_selected)
```

- `λ = 0.7` by default, configurable (`MMR_LAMBDA`).
- `λ = 1.0` → pure relevance (just take the top-scored candidates).
- `λ = 0.0` → pure diversity (maximise difference from already-selected).
- Similarity is cosine similarity over Sentence Transformer embeddings.

Greedy selection:

1. Select the candidate with the highest intent score.
2. For every remaining candidate compute MMR against all selected.
3. Select the candidate with the highest MMR.
4. Repeat until `SUGGESTION_COUNT` suggestions are selected.

### 9.2 Semantic reranking

1. Embed the confirmed query with Sentence Transformers.
2. Embed each result's snippet.
3. Compute cosine similarity between the query and each snippet.
4. Sort descending.
5. Return the top `RERANK_TOP_K` results with their similarity scores.

---

## 10. Configuration

All configuration is environment variables loaded by Pydantic Settings from `backend/.env`.
Nothing sensitive or tunable is hardcoded.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `SERPAPI_API_KEY` | Yes | — | SerpAPI key |
| `VISION_MODEL` | No | `qwen/qwen3.8-27b` | Groq vision model |
| `GENERATION_MODEL` | No | `openai/gpt-oss-120b` | Groq text model |
| `WHISPER_MODEL` | No | `whisper-large-v3` | Groq speech model |
| `EMBEDDING_MODEL` | No | `all-MiniLM-L6-v2` | Local embedding model |
| `CANDIDATE_COUNT` | No | `12` | Queries to generate |
| `SUGGESTION_COUNT` | No | `5` | Suggestions after MMR |
| `MMR_LAMBDA` | No | `0.7` | Relevance vs. diversity |
| `SEARCH_TOP_K` | No | `10` | Raw search results |
| `RERANK_TOP_K` | No | `5` | Results after reranking |
| `MAX_IMAGE_SIZE_MB` | No | `10` | Image upload limit |
| `MAX_AUDIO_SIZE_MB` | No | `25` | Audio upload limit |
| `SUPABASE_URL` | For auth/quota | — | Supabase project URL |
| `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` | For auth/quota | — | Public browser-safe key |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | For auth/quota | — | Backend-only key (bypasses RLS) |
| `ANONYMOUS_FREE_QUERIES` | No | `2` | Free suggestion generations for logged-out visitors |
| `QUOTA_WINDOW_HOURS` | No | `24` | Rolling window for the free quota (`0` = all-time) |
| `QUOTA_DB_PATH` | No | `quota_usage.sqlite3` | Local SQLite fallback store for the quota |

---

## 11. Error Handling

| Error code | HTTP status | Cause |
|------------|-------------|-------|
| `NO_INPUT` | 400 | No image, audio, or text provided |
| `INVALID_FILE_TYPE` | 400 | Unsupported image/audio format |
| `FILE_TOO_LARGE` | 400 | File exceeds size limit |
| `EMPTY_QUERY` | 400 | Search called with empty/whitespace query |
| `LLM_ERROR` | 502 | Groq API failure (timeout, rate limit, model error) |
| `SEARCH_ERROR` | 502 | SerpAPI failure |
| `GENERATION_FAILED` | 500 | Could not parse LLM output into queries |
| `SCORING_FAILED` | 500 | Could not parse LLM scoring output |
| `UNAUTHORIZED` | 401 | Session token is invalid or expired |
| `QUOTA_EXCEEDED` | 429 | Free query limit reached — sign in to continue |

Internal details (stack traces, API keys) are never exposed to the client.

---

## 12. Security Constraints

- Never hardcode API keys — use `.env` + Pydantic Settings.
- Ship `.env.example` with placeholder values only.
- Never expose API keys to the frontend — the frontend talks only to the backend.
- Never persist user media — process uploads in memory and clean any temp files.
- Validate every upload: enforce size limits and MIME types.
- Sanitize user input before it enters LLM prompts.
- Reject malformed requests via Pydantic validation at the boundary.
- Never log API keys, sensitive user data, or raw uploaded files.

---

## 13. Testing Strategy

Unit tests for pipeline modules (prototype scope). All external services are mocked.

| Module | What is tested |
|--------|----------------|
| `fusion.py` | All 7 modality combinations; missing-all error |
| `candidate_gen.py` | JSON parsing; malformed-JSON fallback; deduplication |
| `scoring.py` | Score parsing; threshold filtering |
| `diversity.py` | MMR selection; λ=0 and λ=1 edge cases; duplicate inputs |
| `rerank.py` | Correct ordering; empty results; missing snippets |
| `search.py` | Result normalization; empty results; API errors |

**Approach**: `unittest.mock.patch` for Groq and SerpAPI. Test the logic, not the externals.

---

## 14. Deployment (local prototype)

Questra runs as two local processes; there is no auth, no database, and no persistent state.

- **Backend**: Python venv + `uvicorn app:app --reload --port 8000` (see [agent.md](agent.md)).
- **Frontend**: Vite dev server (`npm run dev`) with a proxy / base URL pointed at the backend.
- **CORS**: the FastAPI app allows the frontend origin.
- **API URL**: configured on the frontend so the backend host/port can change.

Setup and run commands are in [agent.md](agent.md).

---

## 15. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Groq model name changes | Medium | High | Model names live in `.env`, not hardcoded |
| Groq free-tier rate limits | High | Medium | Retry with backoff in `LLMService` |
| SerpAPI costs during dev | Medium | Low | Cache results during development |
| Sentence Transformers slow first load | Certain | Low | Lazy-load at startup; show a loading state |
| Browser `MediaRecorder` unsupported | Low | Low | "Upload audio file" fallback |
| LLM JSON output unreliable | Medium | Medium | Fallback regex extraction |
| Large images slow the pipeline | Medium | Low | Size limits + validation |

---

## 16. Design Principles

1. **Modular architecture** — each pipeline stage is independently testable and loosely coupled.
2. **Provider independence** — LLM and search behind service interfaces; swapping providers
   does not touch the API layer.
3. **No unnecessary RL** — the initial system is inference-only.
4. **Human-in-the-loop** — generated queries are suggestions; the user inspects, edits, rejects,
   selects, and confirms.
5. **Explainability** — surface why a query was chosen where practical, without cluttering the UI.
6. **Reproducibility** — candidate count, suggestion count, MMR λ, model names, and search
   provider are all configurable.

---

## 17. Research Framing

Questra is inspired by *Multimodal Query Suggestion with Multi-Agent Reinforcement Learning
from Human Feedback*, which optimizes two objectives: **intentionality** and **diversity**.

Questra implements a practical, inference-oriented architecture using pretrained models — it
does **not** reproduce the paper's RL pipeline. Version 1 deliberately excludes PPO,
PolicyNet, RewardNet, REINFORCE, and large-scale RLHF. It replaces agent-based optimization
with intentionality scoring plus MMR diversity selection, and keeps the human confirmation
stage at the centre of the flow.

---

## 18. References

- [idea.md](idea.md) — full concept and research motivation.
- [plan.md](plan.md) — implementation plan.
- [tasks.md](tasks.md) — phase-by-phase task breakdown.
- [agent.md](agent.md) — agent/developer operating guide.
- [Design specification](../docs/superpowers/specs/2026-09-22-questra-design.md) — approved design spec.
