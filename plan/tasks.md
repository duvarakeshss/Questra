# Questra — Task Breakdown

Structured task list for building the Questra prototype from scratch.
Each phase must be completed before its dependents can begin (see dependency column).

---

## Phase 1: Backend Foundation
**Depends on**: Nothing (start here)
**Estimated effort**: Small

- [ ] Create `backend/` directory structure (`api/`, `pipeline/`, `services/`, `models/`, `config/`, `tests/`)
- [ ] Create all `__init__.py` files
- [ ] Write `backend/requirements.txt` with all dependencies (fastapi, uvicorn, groq, sentence-transformers, google-search-results, etc.)
- [ ] Write `backend/.env.example` with placeholder values for all config keys
- [ ] Write `backend/config/settings.py` — Pydantic Settings class loading from `.env`
- [ ] Write `backend/models/schemas.py` — all Pydantic models (MultimodalContext, QueryCandidate, QuerySuggestion, SuggestionResponse, SearchResult, SearchResponse, ErrorDetail, ErrorResponse)
- [ ] Write `backend/app.py` — FastAPI app with CORS middleware, router includes, startup event
- [ ] Write `backend/api/routes_health.py` — GET `/api/health` endpoint
- [ ] Create root `.gitignore` (Python + Node + .env + __pycache__ + node_modules + venv)
- [ ] Verify: `pip install -r requirements.txt` succeeds
- [ ] Verify: `uvicorn app:app --reload --port 8000` starts and `/api/health` returns `{"status": "ok"}`

---

## Phase 2: Service Layer
**Depends on**: Phase 1
**Estimated effort**: Medium

- [ ] Write `backend/services/llm_service.py` — Groq client wrapper
  - [ ] `__init__` — initialize Groq client with API key from settings
  - [ ] `transcribe_audio(audio_bytes, filename)` → str — Groq Whisper API
  - [ ] `describe_image(image_bytes, mime_type)` → str — Groq Vision (Llama 4 Scout)
  - [ ] `generate_candidates(context, count)` → list[str] — Groq LLM with JSON output
  - [ ] `score_intentionality(context, queries)` → list[float] — Groq LLM judge
  - [ ] Error handling: retries with backoff, meaningful error messages
- [ ] Write `backend/services/embedding_service.py` — Sentence Transformer wrapper
  - [ ] Lazy singleton pattern (load model once, reuse)
  - [ ] `embed(texts: list[str])` → numpy array
  - [ ] `cosine_similarity(a, b)` → float
- [ ] Write `backend/services/search_service.py` — SerpAPI wrapper
  - [ ] `search(query, num_results)` → list[dict]
  - [ ] Result normalization (title, url, snippet, thumbnail)
  - [ ] Handle empty results and API errors
- [ ] Verify: each service can be instantiated and basic methods don't crash

---

## Phase 3: Pipeline — Input Processing
**Depends on**: Phase 2
**Estimated effort**: Medium

- [ ] Write `backend/pipeline/speech.py`
  - [ ] `process_audio(audio_bytes, filename)` → str
  - [ ] Validate audio format (wav, mp3, m4a, webm, ogg)
  - [ ] Validate file size (MAX_AUDIO_SIZE_MB)
  - [ ] Call LLMService.transcribe_audio()
  - [ ] Return transcript string
- [ ] Write `backend/pipeline/vision.py`
  - [ ] `process_image(image_bytes, mime_type)` → str
  - [ ] Validate image format (jpeg, png, webp, gif)
  - [ ] Validate file size (MAX_IMAGE_SIZE_MB)
  - [ ] Base64 encode image
  - [ ] Call LLMService.describe_image() with detailed prompt
  - [ ] Return description string
- [ ] Write `backend/pipeline/fusion.py`
  - [ ] `fuse_modalities(image_desc, transcript, text)` → MultimodalContext
  - [ ] Validate at least one modality is present
  - [ ] Build unified_prompt string combining all available modalities
- [ ] Verify: process a test image and a test audio file through the pipeline modules

---

## Phase 4: Pipeline — Query Generation & Selection
**Depends on**: Phase 3
**Estimated effort**: Medium-Large

- [ ] Write `backend/pipeline/candidate_gen.py`
  - [ ] `generate_candidates(context, count=12)` → list[str]
  - [ ] Build structured prompt from MultimodalContext
  - [ ] Request JSON output from LLM: `{"queries": [...]}`
  - [ ] Parse JSON response
  - [ ] Fallback: regex-based extraction if JSON parsing fails
  - [ ] Deduplicate and filter empty strings
- [ ] Write `backend/pipeline/scoring.py`
  - [ ] `score_candidates(context, queries)` → list[QueryCandidate]
  - [ ] Send all queries + context to LLM in a single batch call
  - [ ] Parse JSON scores: `{"scores": [{"query": "...", "score": 0.91}, ...]}`
  - [ ] Assign UUIDs to each candidate
  - [ ] Filter out candidates below threshold (0.3)
- [ ] Write `backend/pipeline/diversity.py`
  - [ ] `select_diverse(candidates, count=5, lambda_=0.7)` → list[QuerySuggestion]
  - [ ] Embed all candidate queries using EmbeddingService
  - [ ] Implement MMR algorithm: `MMR(q) = λ * intent_score(q) - (1-λ) * max_sim(q, selected)`
  - [ ] Iteratively select `count` queries maximizing MMR
  - [ ] Assign diversity_rank to each suggestion
- [ ] Verify: given a MultimodalContext, the full chain (generate → score → diversify) produces 5 ranked suggestions

---

## Phase 5: Query Suggestions API Route
**Depends on**: Phase 4
**Estimated effort**: Medium

- [ ] Write `backend/api/routes_query.py`
  - [ ] POST `/api/query/suggestions` endpoint
  - [ ] Accept multipart/form-data: optional `image` (UploadFile), `audio` (UploadFile), `text` (Form field)
  - [ ] Validate at least one input is provided
  - [ ] Validate file types and sizes
  - [ ] Wire up full pipeline: speech → vision → fusion → candidate_gen → scoring → diversity
  - [ ] Return SuggestionResponse on success
  - [ ] Return ErrorResponse on failure with meaningful error codes
- [ ] Register router in `app.py`
- [ ] Verify with curl: upload an image → get 5 query suggestions back
- [ ] Verify with Swagger UI at `/docs`: test all input combinations (image only, text only, image + text, etc.)

---

## Phase 6: Search & Reranking
**Depends on**: Phase 2 (services must exist)
**Estimated effort**: Medium

- [ ] Write `backend/pipeline/search.py`
  - [ ] `execute_search(query, top_k=10)` → list[dict]
  - [ ] Call SearchService.search()
  - [ ] Normalize results into consistent format
  - [ ] Handle empty results gracefully
- [ ] Write `backend/pipeline/rerank.py`
  - [ ] `rerank_results(query, results, top_k=5)` → list[SearchResult]
  - [ ] Embed query using EmbeddingService
  - [ ] Embed all result snippets
  - [ ] Compute cosine similarity between query and each snippet
  - [ ] Sort by similarity score descending
  - [ ] Return top_k results as SearchResult objects
- [ ] Write `backend/api/routes_search.py`
  - [ ] POST `/api/search` endpoint
  - [ ] Accept JSON body: `{"query": "..."}`
  - [ ] Validate query is non-empty
  - [ ] Wire up: search → rerank
  - [ ] Return SearchResponse
- [ ] Register router in `app.py`
- [ ] Verify with curl: search a query → get 5 reranked results back

---

## Phase 7: Frontend Foundation
**Depends on**: Nothing (can start in parallel with backend)
**Estimated effort**: Small

- [ ] Scaffold: `npm create vite@latest frontend -- --template react`
- [ ] Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `axios`
- [ ] Configure `tailwind.config.js` and `postcss.config.js`
- [ ] Configure `vite.config.js` with proxy to `http://localhost:8000`
- [ ] Set up `index.css` with Tailwind directives
- [ ] Write `frontend/src/services/api.js` — API client functions
  - [ ] `generateSuggestions(image, audio, text)` — POST multipart to `/api/query/suggestions`
  - [ ] `search(query)` — POST JSON to `/api/search`
- [ ] Write basic `App.jsx` with stage management state (`input` | `suggestions` | `results`)
- [ ] Verify: `npm install && npm run dev` starts dev server

---

## Phase 8: Frontend — Input Stage
**Depends on**: Phase 7
**Estimated effort**: Medium

- [ ] Write `ImageInput.jsx`
  - [ ] Drag-and-drop zone
  - [ ] Click-to-upload fallback
  - [ ] Image preview thumbnail
  - [ ] Client-side file type validation (jpeg, png, webp, gif)
  - [ ] Client-side file size validation (10MB)
  - [ ] Clear/remove uploaded image
- [ ] Write `VoiceInput.jsx`
  - [ ] "Record" button using MediaRecorder API
  - [ ] Recording indicator (pulsing red dot)
  - [ ] "Stop" button
  - [ ] "Upload audio file" fallback option
  - [ ] Audio preview/playback
- [ ] Write `TextInput.jsx`
  - [ ] Textarea with placeholder
  - [ ] Character count indicator
- [ ] Write `LoadingSpinner.jsx`
  - [ ] Spinner animation
  - [ ] Contextual message prop ("Processing image...", "Generating queries...", etc.)
- [ ] Write `Home.jsx` — assembles input components + "Generate Queries" button
  - [ ] Validate at least one input before allowing submission
  - [ ] Show LoadingSpinner during API call
  - [ ] On success: transition to `suggestions` stage with response data
  - [ ] On error: show error message
- [ ] Verify: can upload image, record audio, type text, and click "Generate Queries"

---

## Phase 9: Frontend — Suggestions Stage
**Depends on**: Phase 8
**Estimated effort**: Medium

- [ ] Write `QuerySuggestions.jsx`
  - [ ] Display 3-5 suggestion cards from API response
  - [ ] Each card shows: query text, intent score badge
  - [ ] "Use This" button per card → triggers search with that query
  - [ ] "Edit" button per card → opens inline QueryEditor
  - [ ] "Regenerate" button at bottom → re-calls suggestions API
  - [ ] "Custom Query" text input + submit button at bottom
  - [ ] "Back" button → return to input stage
- [ ] Write `QueryEditor.jsx`
  - [ ] Inline text input replacing suggestion text
  - [ ] Pre-filled with selected suggestion
  - [ ] "Confirm" button → triggers search with edited query
  - [ ] "Cancel" button → reverts to suggestion view
- [ ] Wire up loading states for search calls
- [ ] Verify: see suggestions, edit one, search with it

---

## Phase 10: Frontend — Results Stage
**Depends on**: Phase 9
**Estimated effort**: Small-Medium

- [ ] Write `SearchResults.jsx`
  - [ ] Display confirmed query at top
  - [ ] List of result cards
  - [ ] Each card: title (clickable link), snippet, URL, thumbnail (if available), relevance score bar/badge
  - [ ] "Search Again" button → return to suggestions stage (keep suggestions)
  - [ ] "New Search" button → return to input stage (clear everything)
- [ ] Handle empty results state
- [ ] Handle error state
- [ ] Verify: full flow — upload image → suggestions → pick one → see search results → navigate back

---

## Phase 11: Testing & Polish
**Depends on**: All previous phases
**Estimated effort**: Medium

- [ ] Write `backend/tests/test_fusion.py`
  - [ ] Test all 7 modality combinations (image-only, voice-only, text-only, image+voice, image+text, voice+text, all three)
  - [ ] Test missing-all-modalities error
- [ ] Write `backend/tests/test_candidate_gen.py`
  - [ ] Test valid JSON output parsing
  - [ ] Test malformed JSON fallback extraction
  - [ ] Test deduplication
  - [ ] Mock Groq API calls
- [ ] Write `backend/tests/test_scoring.py`
  - [ ] Test score parsing from JSON
  - [ ] Test threshold filtering
  - [ ] Test missing modality handling
  - [ ] Mock Groq API calls
- [ ] Write `backend/tests/test_diversity.py`
  - [ ] Test MMR selection produces expected count
  - [ ] Test lambda=0 (pure diversity)
  - [ ] Test lambda=1 (pure relevance)
  - [ ] Test with duplicate input candidates
  - [ ] Mock EmbeddingService
- [ ] Write `backend/tests/test_rerank.py`
  - [ ] Test correct ordering by similarity
  - [ ] Test empty results handling
  - [ ] Test missing snippets handling
  - [ ] Mock EmbeddingService
- [ ] Write `backend/tests/test_search.py`
  - [ ] Test result normalization
  - [ ] Test empty results
  - [ ] Test API error handling
  - [ ] Mock SerpAPI
- [ ] Run `pytest tests/ -v` — all tests pass
- [ ] Error handling polish: consistent error messages, no unhandled exceptions
- [ ] Loading state improvements: meaningful progress messages
- [ ] Write `backend/README.md` — setup instructions, API docs, architecture overview
- [ ] Final end-to-end verification with real API keys

---

## Summary

| Phase | Description | Depends On | Files |
|-------|-------------|------------|-------|
| 1 | Backend Foundation | — | app.py, config/, models/, requirements.txt, .env.example, .gitignore |
| 2 | Service Layer | Phase 1 | services/llm_service.py, embedding_service.py, search_service.py |
| 3 | Input Processing Pipeline | Phase 2 | pipeline/speech.py, vision.py, fusion.py |
| 4 | Query Generation & Selection | Phase 3 | pipeline/candidate_gen.py, scoring.py, diversity.py |
| 5 | Suggestions API Route | Phase 4 | api/routes_query.py |
| 6 | Search & Reranking | Phase 2 | pipeline/search.py, rerank.py, api/routes_search.py |
| 7 | Frontend Foundation | — | Vite setup, api.js, App.jsx |
| 8 | Frontend Input Stage | Phase 7 | ImageInput, VoiceInput, TextInput, LoadingSpinner, Home |
| 9 | Frontend Suggestions | Phase 8 | QuerySuggestions, QueryEditor |
| 10 | Frontend Results | Phase 9 | SearchResults |
| 11 | Testing & Polish | All | tests/*, README.md |

**Parallelism**: Phases 1-6 (backend) and Phases 7-10 (frontend) can be built in parallel. Phase 11 requires both to be complete.

**Total files to create**: ~40 files across backend and frontend.
