# Questra — Architecture

Questra is a multimodal, intent-aware query discovery app. It accepts any combination of
**image, voice, and text**, fuses them into one intent, generates candidate queries, scores them
for intentionality, selects a diverse subset with MMR, lets the user confirm or edit a query,
then searches and semantically reranks the results. It now also has **accounts and a free-tier
quota** (Supabase) and a **conversation-style UI**.

```
image + voice + text  →  fusion  →  candidate generation  →  intentionality scoring
      →  MMR diversity  →  user confirmation  →  search  →  semantic reranking  →  results
```

This is the canonical architecture reference for the code as implemented. Setup and commands
live in [agent.md](agent.md) and [supabase-setup.md](supabase-setup.md); the concept is in
[idea.md](idea.md).

---

## 1. Goals and Non-Goals

### Goals

- Accept image, voice, and text in any combination (at least one required).
- Generate candidate queries from the fused context (default 12, configurable).
- Score each candidate for intentionality and select a diverse subset (3–5) with MMR.
- Let the user confirm, edit, or write a custom query before searching.
- Search via SerpAPI and rerank results by semantic similarity.
- **Accounts + free-tier quota:** logged-out visitors get a small number of free suggestion
  generations, then sign in (email + password + emailed OTP) for unlimited use.
- Present it all as a modern, dark "chat product" UI.

### Non-Goals

- Production deployment, scaling, or multi-user support beyond the above.
- Real-time streaming of LLM responses.
- Mobile-native apps.
- Search engines other than Google (via SerpAPI).
- Reinforcement-learning training of any kind (see [§15](#15-research-framing)).

> Note: "no auth / no database" was a v1 non-goal. Accounts and a Supabase database are now in
> scope (see [§3.3](#33-auth--free-query-quota-supabase)).

---

## 2. System Context

```
                    ┌──────────────────────────────────────────┐
                    │           Browser (React 18 + Vite)        │
                    │  chat UI · composer · auth modal · quota   │
                    └───────────────┬───────────────┬───────────┘
                                    │               │
                    supabase-js     │               │  /api (X-Anon-Id, Bearer)
                    (auth + session)│               │
                    ┌───────────────▼───┐   ┌───────▼────────────────────────┐
                    │  Supabase Auth    │   │  Backend — FastAPI              │
                    │  (email + OTP)    │   │   API → Pipeline → Services     │
                    └───────────────────┘   └───┬───────────────┬────────────┘
                                                │               │
                              ┌─────────────────▼──┐   ┌────────▼─────────┐
                              │ Groq (vision/STT/  │   │ SerpAPI + local  │
                              │ text generation)   │   │ SentenceTransform│
                              └────────────────────┘   └──────────────────┘
                                                │
                              ┌─────────────────▼───────────────────────────┐
                              │ Supabase Postgres — public.query_usage      │
                              └─────────────────────────────────────────────┘
```

The backend is the only component that holds secrets and talks to Groq/SerpAPI/Supabase with the
service key. The browser only ever receives public values (Supabase URL + publishable/anon key).

---

## 3. Backend Architecture

### 3.1 Layering

Strict one-way dependency: **API → Pipeline → Services**. `evaluation/` is a peer, offline
consumer that sits *above* both (it imports pipeline + services but nothing imports it).

```
        ┌──────────────────────────────────────────────┐
        │  API layer (api/)                            │
        │   routes_* · deps (auth + subject)           │
        └───────────────┬──────────────────────────────┘
                        │
        ┌───────────────▼──────────────────────────────┐
        │  Pipeline layer (pipeline/)                  │
        │   speech vision fusion candidate_gen         │
        │   scoring diversity search rerank            │
        └───────────────┬──────────────────────────────┘
                        │
        ┌───────────────▼──────────────────────────────┐
        │  Services layer (services/)                  │
        │   llm_service · embedding_service            │
        │   search_service · supabase_client           │
        │   auth_service · quota_service               │
        └──────────────────────────────────────────────┘

        evaluation/  →  (offline) imports pipeline + services
```

Rules: routes parse/validate and delegate; pipeline modules do one job and don't reach into each
other's internals; external providers sit behind services.

### 3.2 Modules

| Module | Responsibility |
|--------|----------------|
| `api/deps.py` | `current_user` (Bearer → `AuthUser`), `client_subject` (user / `X-Anon-Id` / IP) |
| `api/routes_health.py` | `GET /api/health` |
| `api/routes_me.py` | `GET /api/me` — auth + quota snapshot |
| `api/routes_query.py` | `POST /api/query/suggestions` — validates input, consumes quota, runs the pipeline |
| `api/routes_search.py` | `POST /api/search` — search + rerank (not metered) |
| `pipeline/speech.py` | audio bytes → transcript (validates type/size) |
| `pipeline/vision.py` | image bytes → description (validates type/size) |
| `pipeline/fusion.py` | normalize modalities → `MultimodalContext`; `build_context_prompt` |
| `pipeline/candidate_gen.py` | context → N query strings (JSON, fallbacks, dedupe) |
| `pipeline/scoring.py` | LLM-judge intent scores → filtered `QueryCandidate`s |
| `pipeline/diversity.py` | MMR selection → ranked `QuerySuggestion`s |
| `pipeline/search.py` | query → raw results (SerpAPI) |
| `pipeline/rerank.py` | cosine-similarity rerank → top-K `SearchResult`s |
| `services/llm_service.py` | Groq wrapper (transcribe / describe / complete), retries |
| `services/embedding_service.py` | lazy SentenceTransformer singleton + cosine similarity |
| `services/search_service.py` | SerpAPI wrapper + normalization |
| `services/supabase_client.py` | lazy admin (secret) + public (publishable) clients |
| `services/auth_service.py` | validate a Supabase access token → `AuthUser` |
| `services/quota_service.py` | windowed usage counting; Supabase-only (runs unmetered when unreachable) |
| `models/schemas.py` | Pydantic v2 request/response + domain models |
| `config/settings.py` | Pydantic Settings from `.env` + key-alias properties |
| `evaluation/*` | offline metrics, baselines, benchmark harness, CLI |

### 3.3 Auth & free-query quota (Supabase)

- The browser authenticates with **Supabase Auth** (email + password, OTP email confirmation) and
  sends the access token as `Authorization: Bearer <token>`.
- `api/deps.current_user` validates the token through Supabase (`auth_service`). No token → anonymous.
- `POST /api/query/suggestions` is **metered**:
  - signed in → unlimited;
  - anonymous → `ANONYMOUS_FREE_QUERIES` (default **2**), keyed by `X-Anon-Id`, else client IP.
  - Over the limit → `429 QUOTA_EXCEEDED`; the frontend opens the login popup.
- `quota_service` counts rows in `public.query_usage` inside a rolling `QUOTA_WINDOW_HOURS`
  window. If that table is unreachable (or Supabase is unconfigured) it logs a warning and runs
  **unmetered** rather than blocking requests.
- The service-role/secret key is **backend-only**; the frontend only gets the publishable/anon key.

### 3.4 Evaluation (offline)

`evaluation/` scores the pipeline against the objectives in `idea.md` (§20–21): ranking metrics,
intentionality and diversity metrics, the four baselines plus the full Questra selector, and a
benchmark harness (`python -m evaluation.run`).

---

## 4. Frontend Architecture

A single-page **chat product**: a left rail of past searches, a centered conversation thread, and a
composer pinned at the bottom.

```
┌───────────────┬────────────────────────────────────────┐
│ QUESTRA       │  thread, centered (max ~768px)         │
│ + New search  │   user turn · assistant turn           │
│ conversations │   suggestion cards / result cards      │
│ (hover: 🗑)   │                                        │
│ ── account ── │  ┌────────── composer ──────────────┐  │
│ email / sign  │  │ [image][voice][text]  → Search    │  │
└───────────────┴────────────────────────────────────────┘
```

### Components (`src/components/`)

| Component | Responsibility |
|-----------|----------------|
| `SuggestionsPanel` | Empty-state hero: composer, example prompts, pipeline strip |
| `Conversation` | Renders the session thread (list of turns) and the pinned composer dock; auto-scrolls to the newest turn |
| `Turn` | One turn: the user's input bubble, then context summary, suggestion cards, and inline result cards |
| `ComposerBar` | Text input, image picker, MediaRecorder voice capture (client-side limits, mic-error mapping, file fallback); exports a `useComposerRefs` hook |
| `Sidebar` | Session list (chronological) with hover-reveal delete + confirm, account footer |
| `TopBar` | Brand notch, quota pill, and "New" action |
| `AuthModal` | Sign up → OTP → verify, and sign in |
| `QueryEditor` | Inline editor for a single suggestion |
| `Aurora`, `Icons` | Ambient background and the SVG icon set |

### Services & hooks

- `services/supabase.js` — builds the supabase-js client from `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`, or `null` when unset.
- `services/api.js` — one axios instance; a request interceptor attaches `X-Anon-Id` (a persisted
  UUID) and `Authorization: Bearer <token>` from the live session; helpers `extractError`,
  `errorCode`, `isQuotaError`, `isUnauthorized`, `getMe`, `generateSuggestions`, `search`.
- `hooks/useAuth.js` — session state (`getSession` + `onAuthStateChange`) plus `signUp`,
  `verifyOtp`, `signIn`, `signOut`.

### State (`App.jsx`)

`entries` (each a session with a `turns[]` conversation) + `activeId` (persisted to `localStorage`
under `questra.console.v2`, migrating the older `questra.console.v1` shape), `draft`, `status`,
`error`, `account` (from `GET /api/me`), and `authOpen`/`authMessage`. Submitting input **appends a
turn** to the active session (creating one only when there is none) and runs `runSuggestions` for
that turn; running a suggestion calls `handleSearch(turnId, query)` and patches that turn's results.
A per-turn `loading` flag drives the skeletons, and `pendingRef` holds a turn that hit the quota so
authentication can retry it. Because history lives in the turns, results render inline and earlier
turns stay visible.

---

## 5. Design System

Dark "violet obsidian" theme (`tailwind.config.js`, `index.css`):

- **Color:** layered dark surfaces (`#08070F` base → `#0E0C18`/`#141126`/`#221D3C`), electric-violet
  brand `#7C5CFF`, gold `#F5B544` **reserved for confidence scores**, mint `#0FD6A5` for state.
- **Type:** **Bricolage Grotesque** (display), **Inter** (UI), tabular figures for scores.
- **Surface treatment:** a `.glass` blur used for the top bar, sidebar, and composer; a single
  aurora gradient behind the hero. Hairline white/10 borders; depth via layered surfaces.
- Quality floor: responsive to mobile, visible focus rings, `prefers-reduced-motion` respected.

---

## 6. Directory Structure

```
Questra/
├── backend/
│   ├── app.py                     # FastAPI app: CORS, error handler, routers
│   ├── errors.py                  # QuestraError hierarchy → (code, HTTP status)
│   ├── conftest.py                # test path + hermetic Supabase fixture
│   ├── api/                       # deps.py, routes_health.py, routes_me.py,
│   │                              #   routes_query.py, routes_search.py
│   ├── pipeline/                  # speech, vision, fusion, candidate_gen,
│   │                              #   scoring, diversity, search, rerank
│   ├── services/                  # llm_service, embedding_service, search_service,
│   │                              #   supabase_client, auth_service, quota_service
│   ├── models/schemas.py          # Pydantic v2 models
│   ├── config/settings.py         # Pydantic Settings from .env
│   ├── evaluation/                # metrics, intentionality, diversity, baselines,
│   │                              #   harness, dataset, run
│   ├── supabase/schema.sql        # public.query_usage
│   ├── tests/                     # 11 pytest modules (auth, quota, pipeline, api)
│   ├── requirements.txt / requirements-dev.txt
│   ├── Dockerfile / .dockerignore
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/            # SuggestionsPanel, Conversation, Turn, ComposerBar,
│   │   │                          #   Sidebar, TopBar, AuthModal, QueryEditor, Icons, Aurora
│   │   ├── hooks/useAuth.js
│   │   ├── services/              # api.js, supabase.js
│   │   ├── App.jsx, main.jsx, index.css
│   ├── index.html
│   ├── package.json, vite.config.js, tailwind.config.js, postcss.config.js
│   ├── Dockerfile / nginx.conf / .dockerignore
│   └── .env.example
├── plan/                          # all planning + design docs
│   ├── idea.md plan.md tasks.md architecture.md agent.md supabase-setup.md
└── docs/                          # superpowers design spec (gitignored)
```

---

## 7. Data Flows

### 7.1 Query suggestions (metered)

```
inputs (image, audio, text)
  → api/routes_query: validate at least one input
  → deps: resolve user + subject
  → quota_service.check_and_consume(subject, limit)      # 429 if over
  → pipeline.speech.process_audio        → transcript     (Groq Whisper)
  → pipeline.vision.process_image        → description    (Groq vision)
  → pipeline.fusion.fuse_modalities      → MultimodalContext
  → pipeline.candidate_gen.generate_candidates → 12 queries (Groq LLM)
  → pipeline.scoring.score_candidates    → scored candidates (Groq LLM judge)
  → pipeline.diversity.select_diverse    → 5 QuerySuggestions (MMR + embeddings)
  → SuggestionResponse { suggestions, context, quota }
```

### 7.2 Search (not metered)

```
query → pipeline.search.execute_search → 10 raw results (SerpAPI)
      → pipeline.rerank.rerank_results → 5 SearchResults (cosine similarity)
      → SearchResponse
```

### 7.3 Auth & quota

```
signup   : supabase.auth.signUp(email, password) → OTP email
verify   : supabase.auth.verifyOtp(email, token) → session (JWT)
requests : api.js attaches X-Anon-Id + Bearer token
           backend validates token → user → unlimited
           else anon → 2 free → 429 QUOTA_EXCEEDED → AuthModal
```

---

## 8. Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Backend | FastAPI | Async, OpenAPI docs, Pydantic validation |
| Frontend | React 18 + Vite 5 | Fast dev server, simple SPA |
| Styling | Tailwind CSS | Utility-first design tokens |
| LLM provider | Groq | One SDK for vision + speech + text, free tier |
| Vision model | `qwen/qwen3.8-27b` | Vision-capable and available on the free tier |
| Speech model | `whisper-large-v3` | Fast, accurate transcription |
| Text generation | `openai/gpt-oss-120b` | Structured JSON output, free tier |
| Embeddings | `all-MiniLM-L6-v2` (local) | 80 MB, CPU, no API calls |
| Search | SerpAPI (`google-search-results`) | Structured Google results |
| Intentionality | LLM judge (not CLIP) | Reasons about text constraints CLIP cannot |
| **Auth + DB** | **Supabase** (Auth + Postgres) | Managed email+OTP auth, RLS-backed usage table |
| Frontend auth | `@supabase/supabase-js` | Session handling in the browser |

Note: model ids are config in `.env`; the catalog is account-specific, so verify with
`client.models.list()` before changing them.

---

## 9. Data Models (`backend/models/schemas.py`)

```python
class MultimodalContext(BaseModel): image_description, voice_transcript, text_input
class QueryCandidate(BaseModel):    id, query, intent_score
class QuerySuggestion(BaseModel):   id, query, intent_score, diversity_rank
class QuotaInfo(BaseModel):         authenticated, limit, used, remaining
class SuggestionResponse(BaseModel): success, suggestions, context, quota
class MeResponse(BaseModel):         authenticated, email, quota
class SearchRequest / SearchResult / SearchResponse
class HealthResponse, ErrorDetail, ErrorResponse
```

---

## 10. API Contracts

### `GET /api/health`
`{ "status": "ok", "models_loaded": true }`

### `GET /api/me`
```json
{ "authenticated": false, "email": null,
  "quota": { "authenticated": false, "limit": 2, "used": 1, "remaining": 1 } }
```

### `POST /api/query/suggestions` (multipart, metered)
Fields `image` | `audio` | `text` (≥1). Returns `suggestions[]` + `context` + `quota`.
Over the limit → `429 QUOTA_EXCEEDED`.

### `POST /api/search` (JSON, not metered)
`{ "query": "..." }` → `{ success, query, results[] }`.

### Error envelope
```json
{ "success": false, "error": { "code": "QUOTA_EXCEEDED", "message": "..." } }
```

---

## 11. Key Algorithms

**MMR** (`pipeline/diversity.py`): `λ·intent_score − (1−λ)·max_similarity` vs already-selected;
greedy selection of `SUGGESTION_COUNT`; `λ = MMR_LAMBDA` (default 0.7).

**Reranking** (`pipeline/rerank.py`): embed the query and each snippet, cosine similarity, sort
descending, return the top `RERANK_TOP_K`.

---

## 12. Configuration

All config is environment-driven (Pydantic Settings, `extra="ignore"`). Defaults shown.

| Variable | Default | Notes |
|----------|---------|-------|
| `GROQ_API_KEY` | — | required |
| `SERPAPI_API_KEY` | — | required |
| `SUPABASE_URL` | — | required for auth + quota |
| `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` | — | public key (either name) |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | — | **backend-only** (either name) |
| `SUPABASE_USAGE_TABLE` | `query_usage` | quota table |
| `ANONYMOUS_FREE_QUERIES` | `2` | free suggestions for logged-out visitors |
| `QUOTA_WINDOW_HOURS` | `24` | rolling window (`0` = all-time) |
| `VISION_MODEL` | `qwen/qwen3.8-27b` | |
| `GENERATION_MODEL` | `openai/gpt-oss-120b` | |
| `WHISPER_MODEL` | `whisper-large-v3` | |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | |
| `CANDIDATE_COUNT` / `SUGGESTION_COUNT` | `12` / `5` | |
| `MMR_LAMBDA` | `0.7` | |
| `SEARCH_TOP_K` / `RERANK_TOP_K` | `10` / `5` | |
| `MAX_IMAGE_SIZE_MB` / `MAX_AUDIO_SIZE_MB` | `10` / `25` | |
| `CORS_ORIGINS` | `http://localhost:5173` | comma-separated |
| `ENV_FILE` | `backend/.env` | dotenv path override (real env vars still win) |

Frontend (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public).

Unused keys that may sit in `.env` are ignored: `SMTP_*`, `EMAIL_*`, `SUPABASE_JWKS_URL`,
`DATABASE_URL` (SMTP lives in the Supabase dashboard; tokens are validated via the Supabase API,
so JWKS is not needed).

---

## 13. Error Handling

| Code | HTTP | Cause |
|------|------|-------|
| `NO_INPUT` | 400 | No image, audio, or text |
| `INVALID_FILE_TYPE` | 400 | Unsupported image/audio format |
| `FILE_TOO_LARGE` | 400 | Upload exceeds the size limit |
| `EMPTY_QUERY` | 400 | Search called with a blank query |
| `UNAUTHORIZED` | 401 | Session token invalid or expired |
| `QUOTA_EXCEEDED` | 429 | Free query limit reached |
| `LLM_ERROR` | 502 | Groq failure |
| `SEARCH_ERROR` | 502 | SerpAPI failure |
| `GENERATION_FAILED` | 500 | Could not parse LLM output into queries |
| `SCORING_FAILED` | 500 | Could not parse LLM scoring output |

Internal details are never exposed.

---

## 14. Security

- Secrets only in `backend/.env` (gitignored); the frontend never sees them.
- The Supabase **secret/service-role** key is backend-only — never referenced in `VITE_*`.
- Anonymous quota keyed by `X-Anon-Id` then IP (a browser-only limit; cleared by clearing storage).
- Uploads processed in memory; MIME + size validated; never persisted.
- `public.query_usage` has RLS enabled with no public policies (service role only).
- Never log keys, raw uploads, or sensitive user data.

---

## 15. Testing

`backend/tests/` (pytest). Externals (Groq, SerpAPI, Supabase) are mocked; `conftest.py` forces a
hermetic Supabase.

Covered: fusion (all 7 combinations), candidate generation, scoring, diversity/MMR, rerank,
search, evaluation, auth dependencies, quota service (Supabase + unmetered), and the API
(auth + quota + error envelopes).

---

## 16. Deployment

Runs as local processes today, and ships as containers for hosting:

- **Local:** `uvicorn app:app --reload --port 8000` (venv active) + `npm run dev` on 5173
  (Vite proxies `/api` → `VITE_BACKEND_URL`, default 8000).
- **Containers:** `docker compose up --build` — backend `backend/Dockerfile`, frontend
  `frontend/Dockerfile` builds the Vite app and serves it with nginx. The frontend image bakes
  `VITE_*` values at build time; the backend binds `$PORT` and reads config from environment
  variables first, falling back to `.env` (`ENV_FILE` overrides the path).
- **Supabase:** hosted project; run `backend/supabase/schema.sql` once.

See [agent.md](agent.md) and [supabase-setup.md](supabase-setup.md).

---

## 17. Risks

| Risk | Mitigation |
|------|-----------|
| Groq model catalog is account-specific | Model ids in `.env`; verify via `client.models.list()` |
| Groq free-tier rate limits | Retry with backoff in `LLMService` |
| Sentence Transformers slow first load | Lazy-load at startup |
| Supabase usage table missing | Warning logged; quota runs unmetered until the table exists |
| Anonymous quota is device-scoped | Accept for a prototype; in-app sign-in removes it |
| LLM JSON output unreliable | Regex/line fallback extraction |

---

## 18. Research Framing

Questra is inspired by *Multimodal Query Suggestion with Multi-Agent Reinforcement Learning from
Human Feedback*, which optimizes **intentionality** and **diversity**. Questra implements a
practical, inference-only architecture (LLM-judge scoring + MMR) and deliberately excludes the
paper's RL pipeline (PPO, PolicyNet, RewardNet, REINFORCE, RLHF).

---

## 19. References

- [idea.md](idea.md) — concept and research motivation.
- [plan.md](plan.md) — implementation plan.
- [tasks.md](tasks.md) — phase-by-phase task breakdown and status.
- [agent.md](agent.md) — operating guide for developers/agents.
- [supabase-setup.md](supabase-setup.md) — Supabase project, auth, SMTP, schema.
