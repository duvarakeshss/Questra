# Questra — Implementation Plan

## Context

Questra is a multimodal intent-aware query discovery system that transforms image, voice, and text inputs into diverse, relevant search queries. The user uploads any combination of modalities → the system generates candidate queries → scores them for intentionality → selects diverse suggestions via MMR → the user confirms/edits → search + semantic reranking → results displayed.

The repo is brand new (only `idea.md` exists). Goal: **working end-to-end prototype** using Groq (LLM + vision + whisper) and SerpAPI (search).

---

## Architecture Overview

```
Frontend (React + Vite)          Backend (Python + FastAPI)
┌─────────────────────┐          ┌──────────────────────────────────┐
│ ImageInput           │          │ API Layer (FastAPI)              │
│ VoiceInput           │  HTTP    │   /api/health                   │
│ TextInput            │ ──────► │   /api/query/suggestions         │
│ QuerySuggestions     │          │   /api/search                   │
│ SearchResults        │          │                                  │
└─────────────────────┘          │ Pipeline Layer                   │
                                 │   speech.py (Groq Whisper)       │
                                 │   vision.py (Groq Llama Vision)  │
                                 │   fusion.py (combine modalities) │
                                 │   candidate_gen.py (Groq LLM)   │
                                 │   scoring.py (intentionality)    │
                                 │   diversity.py (MMR selection)   │
                                 │   search.py (SerpAPI)            │
                                 │   rerank.py (semantic reranking) │
                                 │                                  │
                                 │ Services Layer                   │
                                 │   llm_service.py (Groq client)   │
                                 │   embedding_service.py (ST)      │
                                 │   search_service.py (SerpAPI)    │
                                 └──────────────────────────────────┘
```

---

## Technology Decisions

### Backend: Python 3.11+ with FastAPI

- **Why**: Async support, automatic OpenAPI docs, Pydantic validation, excellent ecosystem for ML
- **File uploads**: `python-multipart` for handling image/audio uploads
- **CORS**: `fastapi.middleware.cors` for frontend communication

### Frontend: React 18 + Vite 5

- **Why**: Fast dev server, simple setup, widely understood
- **Styling**: Tailwind CSS — utility-first, no component library overhead
- **HTTP**: `axios` for API calls
- **Audio**: Web Audio API / `MediaRecorder` for voice recording

### LLM Provider: Groq

| Task | Model | Why |
|------|-------|-----|
| Vision (image understanding) | `llama-4-scout-17b-16e-instruct` | Multimodal Llama 4 on Groq — fast, free tier, understands images |
| Speech-to-text | `whisper-large-v3` | Best accuracy, runs on Groq in <1s |
| Query generation | `llama-3.3-70b-versatile` | Fast, good at structured JSON output |
| Intentionality scoring (LLM judge) | `llama-3.3-70b-versatile` | Same model, batch scoring via prompt |

### Embeddings: Sentence Transformers

- **Model**: `all-MiniLM-L6-v2` (22M params, 80MB, runs on CPU)
- **Use cases**: MMR diversity selection, result reranking, text similarity
- **Why not CLIP for scoring**: LLM-judge approach is simpler, more explainable, and doesn't require downloading a 400MB CLIP model. Keeps the prototype lean.

### Search: SerpAPI

- **Why**: Structured JSON responses, Google results, images included
- **Package**: `google-search-results` Python SDK
- **Fallback**: The search service interface allows swapping to DuckDuckGo later

### Intentionality Scoring: LLM Judge

- **Why chosen over CLIP**: Simpler to implement, more explainable scores, no extra model download
- **How**: Ask Groq to rate each query 0-1 against the multimodal context
- **Advantage**: The LLM can reason about constraint matching ("under 5000 rupees") which CLIP cannot

---

## Directory Structure

```
Questra/
├── backend/
│   ├── app.py                    # FastAPI app + CORS + startup
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes_health.py      # GET /api/health
│   │   ├── routes_query.py       # POST /api/query/suggestions
│   │   └── routes_search.py      # POST /api/search
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── speech.py             # Audio → text via Whisper
│   │   ├── vision.py             # Image → description via Llama Vision
│   │   ├── fusion.py             # Combine modalities into context
│   │   ├── candidate_gen.py      # Generate 12 candidate queries (configurable)
│   │   ├── scoring.py            # Intentionality scoring (LLM judge)
│   │   ├── diversity.py          # MMR diversity selection
│   │   ├── search.py             # Search orchestration
│   │   └── rerank.py             # Semantic reranking
│   ├── services/
│   │   ├── __init__.py
│   │   ├── llm_service.py        # Groq API client wrapper
│   │   ├── embedding_service.py  # Sentence Transformer wrapper
│   │   └── search_service.py     # SerpAPI wrapper
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py            # Pydantic models
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py           # Pydantic Settings from .env
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_fusion.py
│   │   ├── test_candidate_gen.py
│   │   ├── test_scoring.py
│   │   ├── test_diversity.py
│   │   ├── test_search.py
│   │   └── test_rerank.py
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
├── idea.md
├── plan.md
├── tasks.md
└── .gitignore
```

---

## Backend Implementation Plan

### Phase 1 — Project Setup & Configuration

**Files**: `backend/app.py`, `backend/config/settings.py`, `backend/requirements.txt`, `backend/.env.example`

1. Create `requirements.txt`:
   ```
   fastapi>=0.115.0
   uvicorn[standard]>=0.30.0
   python-multipart>=0.0.9
   pydantic-settings>=2.0.0
   groq>=0.11.0
   sentence-transformers>=3.0.0
   google-search-results>=2.4.2
   numpy>=1.26.0
   python-dotenv>=1.0.0
   pytest>=8.0.0
   httpx>=0.27.0
   ```

2. Create `config/settings.py` with Pydantic Settings:
   - `GROQ_API_KEY` (required)
   - `SERPAPI_API_KEY` (required)
   - `VISION_MODEL` = `"llama-4-scout-17b-16e-instruct"`
   - `GENERATION_MODEL` = `"llama-3.3-70b-versatile"`
   - `WHISPER_MODEL` = `"whisper-large-v3"`
   - `EMBEDDING_MODEL` = `"all-MiniLM-L6-v2"`
   - `CANDIDATE_COUNT` = `12`
   - `SUGGESTION_COUNT` = `5`
   - `MMR_LAMBDA` = `0.7`
   - `SEARCH_TOP_K` = `10`
   - `RERANK_TOP_K` = `5`
   - `MAX_IMAGE_SIZE_MB` = `10`
   - `MAX_AUDIO_SIZE_MB` = `25`

3. Create `app.py`:
   - FastAPI app with CORS middleware (allow frontend origin)
   - Include routers from `api/`
   - Startup event to initialize embedding model (lazy load)

4. Create `.env.example` with placeholder values

### Phase 2 — Pydantic Models

**File**: `backend/models/schemas.py`

```python
# Key models:
class MultimodalContext(BaseModel):
    image_description: str | None = None
    voice_transcript: str | None = None
    text_input: str | None = None

class QueryCandidate(BaseModel):
    id: str
    query: str
    intent_score: float

class QuerySuggestion(BaseModel):
    id: str
    query: str
    intent_score: float
    diversity_rank: int

class SuggestionResponse(BaseModel):
    success: bool
    suggestions: list[QuerySuggestion]
    context: MultimodalContext

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    score: float
    thumbnail: str | None = None

class SearchResponse(BaseModel):
    success: bool
    query: str
    results: list[SearchResult]

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
```

### Phase 3 — Service Layer

**Files**: `backend/services/llm_service.py`, `embedding_service.py`, `search_service.py`

1. **LLMService** (`llm_service.py`):
   - `transcribe_audio(audio_bytes, filename)` → str (uses Groq Whisper)
   - `describe_image(image_bytes, mime_type)` → str (uses Groq Vision)
   - `generate_candidates(context, count)` → list[str] (uses Groq LLM)
   - `score_intentionality(context, queries)` → list[float] (uses Groq LLM)
   - All methods use the `groq` Python SDK
   - Handles API errors with retries and meaningful error messages

2. **EmbeddingService** (`embedding_service.py`):
   - Loads `all-MiniLM-L6-v2` once at startup (lazy singleton)
   - `embed(texts: list[str])` → numpy array
   - `cosine_similarity(a, b)` → float
   - Used by diversity.py and rerank.py

3. **SearchService** (`search_service.py`):
   - `search(query, num_results)` → list[dict]
   - Uses SerpAPI's `GoogleSearch` class
   - Normalizes results into a consistent format
   - Handles empty results and API errors

### Phase 4 — Pipeline Modules

**Files**: All under `backend/pipeline/`

1. **speech.py** — `process_audio(audio_bytes, filename) → str`
   - Validates audio format (wav, mp3, m4a, webm, ogg)
   - Validates file size
   - Calls `LLMService.transcribe_audio()`
   - Returns transcript or raises meaningful error

2. **vision.py** — `process_image(image_bytes, mime_type) → str`
   - Validates image format (jpeg, png, webp, gif)
   - Validates file size
   - Encodes image to base64
   - Calls `LLMService.describe_image()` with prompt:
     "Describe this image in detail for search purposes. Focus on: object type, color, shape, style, brand indicators, material, and any distinguishing features."
   - Returns description string

3. **fusion.py** — `fuse_modalities(image_desc, transcript, text) → MultimodalContext`
   - Validates at least one modality is present
   - Creates structured MultimodalContext
   - Also generates a `unified_prompt` string that combines all available modalities into a single context block for candidate generation

4. **candidate_gen.py** — `generate_candidates(context, count=12) → list[str]`
   - Builds a prompt from the MultimodalContext
   - Instructs the LLM to generate `count` diverse search queries
   - Requests JSON output: `{"queries": [...]}`
   - Parses response, deduplicates, filters empty strings
   - Falls back gracefully if JSON parsing fails (extract queries heuristically)

5. **scoring.py** — `score_candidates(context, queries) → list[QueryCandidate]`
   - Sends all queries + context to LLM in a single call
   - Prompt: "Rate each query 0.0-1.0 for how well it captures the user's multimodal intent"
   - Requests JSON: `{"scores": [{"query": "...", "score": 0.91}, ...]}`
   - Returns list of QueryCandidate with scores
   - Filters out candidates below a minimum threshold (e.g., 0.3)

6. **diversity.py** — `select_diverse(candidates, count=5, lambda_=0.7) → list[QuerySuggestion]`
   - Embeds all candidate queries using EmbeddingService
   - Implements MMR:
     ```
     MMR(q) = λ * intent_score(q) - (1-λ) * max_sim(q, selected)
     ```
   - Iteratively selects `count` queries that maximize MMR
   - Returns QuerySuggestion list with diversity_rank

7. **search.py** — `execute_search(query, top_k=10) → list[dict]`
   - Calls SearchService.search()
   - Normalizes results
   - Returns raw search results for reranking

8. **rerank.py** — `rerank_results(query, results, top_k=5) → list[SearchResult]`
   - Embeds the query and all result snippets
   - Computes cosine similarity between query and each result
   - Sorts by similarity score
   - Returns top_k results with scores

### Phase 5 — API Routes

**Files**: `backend/api/routes_health.py`, `routes_query.py`, `routes_search.py`

1. **GET /api/health** → `{"status": "ok", "models_loaded": true}`

2. **POST /api/query/suggestions**
   - Accepts: `multipart/form-data` with optional `image`, `audio`, `text` fields
   - Validates at least one field is present
   - Pipeline: speech → vision → fusion → candidate_gen → scoring → diversity
   - Returns: `SuggestionResponse`
   - Error handling: returns meaningful errors for each failure mode

3. **POST /api/search**
   - Accepts: `{"query": "..."}`
   - Pipeline: search → rerank
   - Returns: `SearchResponse`

---

## Frontend Implementation Plan

### Phase 6 — Project Setup

1. Scaffold with Vite: `npm create vite@latest frontend -- --template react`
2. Install: `tailwindcss`, `postcss`, `autoprefixer`, `axios`
3. Configure Tailwind, set up proxy to backend in `vite.config.js`

### Phase 7 — Components

**Layout**: Single-page app with three stages (Input → Suggestions → Results)

1. **App.jsx**: Stage manager — tracks `stage` state (`input` | `suggestions` | `results`)

2. **Home.jsx**: Renders current stage's components

3. **ImageInput.jsx**:
   - Drag-and-drop or click-to-upload
   - Preview uploaded image as thumbnail
   - Validates file type and size client-side
   - Stores File object for form submission

4. **VoiceInput.jsx**:
   - "Record" button using MediaRecorder API
   - Shows recording indicator (pulsing red dot)
   - "Stop" button to finish recording
   - Alternative: "Upload audio file" option
   - Stores Blob for form submission

5. **TextInput.jsx**:
   - Simple textarea
   - Placeholder: "Describe what you're looking for..."
   - Character count indicator

6. **QuerySuggestions.jsx**:
   - Displays 3-5 suggestion cards
   - Each card shows: query text, intent score (subtle badge)
   - "Use This" button per card → goes to search
   - "Edit" button per card → opens inline editor
   - "Regenerate" button at bottom
   - "Custom Query" text input at bottom
   - Back button to return to input stage

7. **QueryEditor.jsx**:
   - Inline text input that replaces the suggestion text
   - "Confirm" and "Cancel" buttons
   - Pre-filled with the selected suggestion

8. **SearchResults.jsx**:
   - Shows the confirmed query at top
   - List of result cards: title, snippet, URL, thumbnail (if available), relevance score
   - "Search Again" button → returns to suggestions
   - "New Search" button → returns to input

9. **LoadingSpinner.jsx**:
   - Shows during API calls
   - Displays contextual messages: "Processing image...", "Generating queries...", "Searching..."

### Phase 8 — API Service

**File**: `frontend/src/services/api.js`

```javascript
const API_BASE = 'http://localhost:8000/api';

export async function generateSuggestions(image, audio, text) {
  const formData = new FormData();
  if (image) formData.append('image', image);
  if (audio) formData.append('audio', audio);
  if (text) formData.append('text', text);
  const { data } = await axios.post(`${API_BASE}/query/suggestions`, formData);
  return data;
}

export async function search(query) {
  const { data } = await axios.post(`${API_BASE}/search`, { query });
  return data;
}
```

---

## Configuration

### .env.example
```
# Required
GROQ_API_KEY=gsk_your_key_here
SERPAPI_API_KEY=your_key_here

# Models (defaults shown)
VISION_MODEL=llama-4-scout-17b-16e-instruct
GENERATION_MODEL=llama-3.3-70b-versatile
WHISPER_MODEL=whisper-large-v3
EMBEDDING_MODEL=all-MiniLM-L6-v2

# Pipeline
CANDIDATE_COUNT=12
SUGGESTION_COUNT=5
MMR_LAMBDA=0.7
SEARCH_TOP_K=10
RERANK_TOP_K=5

# Limits
MAX_IMAGE_SIZE_MB=10
MAX_AUDIO_SIZE_MB=25
```

---

## Testing Strategy

Focus on unit tests for pipeline modules since this is a prototype:

| Module | Test File | Key Tests |
|--------|-----------|-----------|
| fusion | test_fusion.py | All 7 modality combinations, missing all modalities error |
| candidate_gen | test_candidate_gen.py | Valid output parsing, malformed JSON fallback, deduplication |
| scoring | test_scoring.py | Score parsing, threshold filtering, missing modality handling |
| diversity | test_diversity.py | MMR selection, lambda=0 (diversity only), lambda=1 (relevance only), duplicate input |
| rerank | test_rerank.py | Correct ordering, empty results, missing snippets |
| search | test_search.py | Result normalization, empty results, API error handling |

**Testing approach**: Mock external services (Groq, SerpAPI) using `unittest.mock.patch`. Test the logic, not the APIs.

---

## Verification Plan

1. **Backend standalone**:
   - `cd backend && pip install -r requirements.txt`
   - `cp .env.example .env` and fill in keys
   - `uvicorn app:app --reload --port 8000`
   - Test: `curl http://localhost:8000/api/health`
   - Test: Upload image via Swagger UI at `http://localhost:8000/docs`

2. **Frontend standalone**:
   - `cd frontend && npm install && npm run dev`
   - Verify: UI renders, image upload works, voice recording works

3. **End-to-end**:
   - Run both backend and frontend
   - Upload an image → get query suggestions → select one → see search results
   - Test with text-only, voice-only, and combinations

4. **Tests**:
   - `cd backend && pytest tests/ -v`

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Groq Vision model may not be available or may change names | Settings are configurable; model name in .env. Fallback: use `meta-llama/llama-4-scout-17b-16e-instruct` or check Groq docs |
| Groq rate limits on free tier | Add basic retry logic with backoff in LLMService |
| SerpAPI costs add up during development | Cache search results during dev; consider DuckDuckGo for dev/test |
| Sentence Transformer first load is slow (~30s) | Lazy-load at startup, show loading state, cache in memory |
| Voice recording may not work in all browsers | Provide "upload audio file" as fallback |
| JSON parsing from LLM may be unreliable | Add fallback regex-based extraction; use structured prompts |
| Large images slow down the pipeline | Resize images before sending to Groq; set size limits |

---

## Security Constraints

- Never hardcode API keys — use `.env` and Pydantic Settings
- Create `.env.example` with placeholder values only
- Do not expose API keys to the frontend — all API calls proxied through backend
- Do not store user-uploaded media permanently — clean temp files after processing
- Validate uploaded files: restrict file size, validate MIME types
- Sanitize user input before passing to LLM prompts
- Protect endpoints against malformed requests via Pydantic validation
- Do not log API keys, sensitive user data, or raw uploaded files

---

## Key Design Decisions Summary

1. **LLM Judge over CLIP** for intentionality scoring — simpler, handles constraints, one less model to download
2. **Single Groq provider** for vision + speech + generation — simpler API key management, consistent SDK
3. **Sentence Transformers locally** for embeddings — free, fast on CPU, no API calls needed
4. **Three-stage UI** (Input → Suggestions → Results) — maps directly to the user journey, simple state management
5. **No database** — prototype doesn't need persistence. User interactions are ephemeral.
6. **No authentication** — academic prototype, runs locally
