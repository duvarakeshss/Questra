# Questra — Task Breakdown

Structured task list for building the Questra prototype from scratch.
Each phase must be completed before its dependents can begin (see dependency column).

---

## Phase 1: Backend Foundation
**Depends on**: Nothing (start here)
**Estimated effort**: Small

- [x] Create `backend/` directory structure (`api/`, `pipeline/`, `services/`, `models/`, `config/`, `tests/`)
- [x] Create all `__init__.py` files
- [x] Write `backend/requirements.txt` with all dependencies (fastapi, uvicorn, groq, sentence-transformers, google-search-results, etc.)
- [x] Write `backend/.env.example` with placeholder values for all config keys
- [x] Write `backend/config/settings.py` — Pydantic Settings class loading from `.env`
- [x] Write `backend/models/schemas.py` — all Pydantic models (MultimodalContext, QueryCandidate, QuerySuggestion, SuggestionResponse, SearchResult, SearchResponse, ErrorDetail, ErrorResponse)
- [x] Write `backend/app.py` — FastAPI app with CORS middleware, router includes, startup event
- [x] Write `backend/api/routes_health.py` — GET `/api/health` endpoint
- [x] Create root `.gitignore` (Python + Node + .env + __pycache__ + node_modules + venv)
- [x] Verify: `pip install -r requirements.txt` succeeds
- [x] Verify: `uvicorn app:app --reload --port 8000` starts and `/api/health` returns `{"status": "ok"}`

---

## Phase 2: Service Layer
**Depends on**: Phase 1
**Estimated effort**: Medium

- [x] Write `backend/services/llm_service.py` — Groq client wrapper
  - [x] `__init__` — initialize Groq client with API key from settings
  - [x] `transcribe_audio(audio_bytes, filename)` → str — Groq Whisper API
  - [x] `describe_image(image_bytes, mime_type)` → str — Groq vision (`qwen/qwen3.8-27b`)
  - [x] `generate_candidates(context, count)` → list[str] — Groq LLM with JSON output
  - [x] `score_intentionality(context, queries)` → list[float] — Groq LLM judge
  - [x] Error handling: retries with backoff, meaningful error messages
- [x] Write `backend/services/embedding_service.py` — Sentence Transformer wrapper
  - [x] Lazy singleton pattern (load model once, reuse)
  - [x] `embed(texts: list[str])` → numpy array
  - [x] `cosine_similarity(a, b)` → float
- [x] Write `backend/services/search_service.py` — SerpAPI wrapper
  - [x] `search(query, num_results)` → list[dict]
  - [x] Result normalization (title, url, snippet, thumbnail)
  - [x] Handle empty results and API errors
- [x] Verify: each service can be instantiated and basic methods don't crash

---

## Phase 3: Pipeline — Input Processing
**Depends on**: Phase 2
**Estimated effort**: Medium

- [x] Write `backend/pipeline/speech.py`
  - [x] `process_audio(audio_bytes, filename)` → str
  - [x] Validate audio format (wav, mp3, m4a, webm, ogg)
  - [x] Validate file size (MAX_AUDIO_SIZE_MB)
  - [x] Call LLMService.transcribe_audio()
  - [x] Return transcript string
- [x] Write `backend/pipeline/vision.py`
  - [x] `process_image(image_bytes, mime_type)` → str
  - [x] Validate image format (jpeg, png, webp, gif)
  - [x] Validate file size (MAX_IMAGE_SIZE_MB)
  - [x] Base64 encode image
  - [x] Call LLMService.describe_image() with detailed prompt
  - [x] Return description string
- [x] Write `backend/pipeline/fusion.py`
  - [x] `fuse_modalities(image_desc, transcript, text)` → MultimodalContext
  - [x] Validate at least one modality is present
  - [x] Build unified_prompt string combining all available modalities
- [x] Verify: process a test image and a test audio file through the pipeline modules

---

## Phase 4: Pipeline — Query Generation & Selection
**Depends on**: Phase 3
**Estimated effort**: Medium-Large

- [x] Write `backend/pipeline/candidate_gen.py`
  - [x] `generate_candidates(context, count=12)` → list[str]
  - [x] Build structured prompt from MultimodalContext
  - [x] Request JSON output from LLM: `{"queries": [...]}`
  - [x] Parse JSON response
  - [x] Fallback: regex-based extraction if JSON parsing fails
  - [x] Deduplicate and filter empty strings
- [x] Write `backend/pipeline/scoring.py`
  - [x] `score_candidates(context, queries)` → list[QueryCandidate]
  - [x] Send all queries + context to LLM in a single batch call
  - [x] Parse JSON scores: `{"scores": [{"query": "...", "score": 0.91}, ...]}`
  - [x] Assign UUIDs to each candidate
  - [x] Filter out candidates below threshold (0.3)
- [x] Write `backend/pipeline/diversity.py`
  - [x] `select_diverse(candidates, count=5, lambda_=0.7)` → list[QuerySuggestion]
  - [x] Embed all candidate queries using EmbeddingService
  - [x] Implement MMR algorithm: `MMR(q) = λ * intent_score(q) - (1-λ) * max_sim(q, selected)`
  - [x] Iteratively select `count` queries maximizing MMR
  - [x] Assign diversity_rank to each suggestion
- [x] Verify: given a MultimodalContext, the full chain (generate → score → diversify) produces 5 ranked suggestions

---

## Phase 5: Query Suggestions API Route
**Depends on**: Phase 4
**Estimated effort**: Medium

- [x] Write `backend/api/routes_query.py`
  - [x] POST `/api/query/suggestions` endpoint
  - [x] Accept multipart/form-data: optional `image` (UploadFile), `audio` (UploadFile), `text` (Form field)
  - [x] Validate at least one input is provided
  - [x] Validate file types and sizes
  - [x] Wire up full pipeline: speech → vision → fusion → candidate_gen → scoring → diversity
  - [x] Return SuggestionResponse on success
  - [x] Return ErrorResponse on failure with meaningful error codes
- [x] Register router in `app.py`
- [x] Verify with curl / test client: upload an image / text → get 5 query suggestions back
- [x] Verify with Swagger UI at `/docs`: test all input combinations (image only, text only, image + text, etc.)

---

## Phase 6: Search & Reranking
**Depends on**: Phase 2 (services must exist)
**Estimated effort**: Medium

- [x] Write `backend/pipeline/search.py`
  - [x] `execute_search(query, top_k=10)` → list[dict]
  - [x] Call SearchService.search()
  - [x] Normalize results into consistent format
  - [x] Handle empty results gracefully
- [x] Write `backend/pipeline/rerank.py`
  - [x] `rerank_results(query, results, top_k=5)` → list[SearchResult]
  - [x] Embed query using EmbeddingService
  - [x] Embed all result snippets
  - [x] Compute cosine similarity between query and each snippet
  - [x] Sort by similarity score descending
  - [x] Return top_k results as SearchResult objects
- [x] Write `backend/api/routes_search.py`
  - [x] POST `/api/search` endpoint
  - [x] Accept JSON body: `{"query": "..."}`
  - [x] Validate query is non-empty
  - [x] Wire up: search → rerank
  - [x] Return SearchResponse
- [x] Register router in `app.py`
- [x] Verify with curl / test client: search a query → get reranked results back

---

## Phase 7: Frontend Foundation
**Depends on**: Nothing (can start in parallel with backend)
**Estimated effort**: Small

- [x] Scaffold: `npm create vite@latest frontend -- --template react`
- [x] Install dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `axios`
- [x] Configure `tailwind.config.js` and `postcss.config.js`
- [x] Configure `vite.config.js` with proxy to `http://localhost:8000`
- [x] Set up `index.css` with Tailwind directives and Stitch design system tokens
- [x] Write `frontend/src/services/api.js` — API client functions
  - [x] `generateSuggestions(image, audio, text)` — POST multipart to `/api/query/suggestions`
  - [x] `search(query)` — POST JSON to `/api/search`
- [x] Write basic `App.jsx` with stage and conversation management state
- [x] Verify: `npm install && npm run build` starts/builds successfully

---

## Phase 8: Frontend — Input Stage (Multimodal Command Console)
**Depends on**: Phase 7
**Estimated effort**: Medium

- [x] Write `Composer.jsx` & input handlers
  - [x] Drag-and-drop zone
  - [x] Click-to-upload fallback
  - [x] Image preview thumbnail and removal
  - [x] Client-side file type validation (jpeg, png, webp, gif)
  - [x] Client-side file size validation (10MB)
  - [x] Clear/remove uploaded image
- [x] Write Voice Recording Integration
  - [x] "Record" button using MediaRecorder API
  - [x] Recording indicator (pulsing dot)
  - [x] "Stop" button
  - [x] "Upload audio file" fallback option
  - [x] Audio preview/playback
- [x] Write Text / Command Bar
  - [x] Textarea with `ir://query>` prompt and placeholder
  - [x] Clean keyboard shortcuts (Enter to send, Shift+Enter for newline)
- [x] Write `LoadingSpinner.jsx`
  - [x] Spinner / pulsing dot animation
  - [x] Contextual message prop ("Reading your input...", "Searching corpus...", etc.)
- [x] Write Console view in `App.jsx`
  - [x] Validate at least one input before allowing submission
  - [x] Show loading indicator during API call
  - [x] On success: transition to `suggestions` stage with response data
  - [x] On error: show error message
- [x] Verify: can upload image, record audio, type text, and generate queries

---

## Phase 9: Frontend — Suggestions Stage (Intent Divergence Matrix)
**Depends on**: Phase 8
**Estimated effort**: Medium

- [x] Write `QuerySuggestions.jsx`
  - [x] Display 3-5 suggestion cards from API response with pathway styling
  - [x] Each card shows: query text, intent score badge, confidence progress bar
  - [x] "Use This" button per card → triggers search with that query
  - [x] "Edit" button per card → opens inline QueryEditor
  - [x] "Regenerate" button at bottom → re-calls suggestions API
  - [x] "Custom Query" text input + submit button at bottom
  - [x] Ingestion summary showing image/audio/text inputs
- [x] Write `QueryEditor.jsx`
  - [x] Inline text input replacing suggestion text
  - [x] Pre-filled with selected suggestion
  - [x] "Confirm" button → triggers search with edited query
  - [x] "Cancel" button → reverts to suggestion view
- [x] Wire up loading states for search calls
- [x] Verify: see suggestions, edit one, search with it

---

## Phase 10: Frontend — Results Stage (IR Workspace)
**Depends on**: Phase 9
**Estimated effort**: Small-Medium

- [x] Write `SearchResults.jsx`
  - [x] Display confirmed active query at top with stats
  - [x] List of result cards with `REF_XXXX` identifiers
  - [x] Each card: title (clickable link), snippet, URL hostname, match percentage badge
  - [x] "Retry search" / refine actions
  - [x] New investigation / session actions
- [x] Handle empty results state (`CORPUS_RECALL: 0 RESULTS`)
- [x] Handle error state
- [x] Verify: full flow — upload image/audio/text → suggestions → pick/edit → see search results

---

## Phase 11: Testing & Polish
**Depends on**: All previous phases
**Estimated effort**: Medium

- [x] Write `backend/tests/test_fusion.py`
  - [x] Test all 7 modality combinations (image-only, voice-only, text-only, image+voice, image+text, voice+text, all three)
  - [x] Test missing-all-modalities error
- [x] Write `backend/tests/test_candidate_gen.py`
  - [x] Test valid JSON output parsing
  - [x] Test malformed JSON fallback extraction
  - [x] Test deduplication
  - [x] Mock Groq API calls
- [x] Write `backend/tests/test_scoring.py`
  - [x] Test score parsing from JSON
  - [x] Test threshold filtering
  - [x] Test missing modality handling
  - [x] Mock Groq API calls
- [x] Write `backend/tests/test_diversity.py`
  - [x] Test MMR selection produces expected count
  - [x] Test lambda=0 (pure diversity)
  - [x] Test lambda=1 (pure relevance)
  - [x] Test with duplicate input candidates
  - [x] Mock EmbeddingService
- [x] Write `backend/tests/test_rerank.py`
  - [x] Test correct ordering by similarity
  - [x] Test empty results handling
  - [x] Test missing snippets handling
  - [x] Mock EmbeddingService
- [x] Write `backend/tests/test_search.py`
  - [x] Test result normalization
  - [x] Test empty results
  - [x] Test API error handling
  - [x] Mock SerpAPI
- [x] Write `backend/tests/test_api.py`
  - [x] Test health endpoint
  - [x] Test query suggestions endpoint validation and success
  - [x] Test search endpoint validation and success
- [x] Run `pytest tests/ -v` — all 36 tests pass
- [x] Error handling polish: consistent error messages, no unhandled exceptions
- [x] Loading state improvements: meaningful progress messages
- [x] Write `backend/README.md` — setup instructions, API docs, architecture overview
- [x] Frontend production build verification: `npm run build` succeeds cleanly

---

## Phase 12: Evaluation
**Depends on**: Phase 11
**Estimated effort**: Medium

- [x] Write `backend/evaluation/metrics.py` — ranking metrics (precision@k, recall@k, MRR, DCG/nDCG)
- [x] Write `backend/evaluation/intentionality.py` — mean intent score + embedding alignment of queries to the multimodal context
- [x] Write `backend/evaluation/diversity.py` — average pairwise similarity/distance across a suggestion set
- [x] Write `backend/evaluation/baselines.py` — the four baselines (text-only, image-caption, single-generated, relevance-only) + full Questra selector
- [x] Write `backend/evaluation/harness.py` — `BenchmarkCase`, `evaluate_case`, `run_benchmark` system comparison
- [x] Write `backend/evaluation/dataset.py` — small illustrative benchmark (idea.md §22)
- [x] Write `backend/evaluation/run.py` — CLI comparison table (`python -m evaluation.run`)
- [x] Write `backend/tests/test_evaluation.py` — metrics, intentionality, diversity, baselines, harness
- [x] Verify: `pytest tests/ -v` — all 52 tests pass

---

## Phase 13: Supabase Auth & Free-Query Quota
**Depends on**: Phase 12
**Estimated effort**: Medium-Large

- [x] `backend/services/supabase_client.py` — lazy admin (secret) + public (publishable) clients
- [x] `backend/supabase/schema.sql` — `query_usage` table + index + RLS
- [x] `backend/services/auth_service.py` — validate Supabase access tokens
- [x] `backend/services/quota_service.py` — windowed usage count + check-and-consume (fails open if unconfigured)
- [x] `backend/api/deps.py` — `current_user` + `client_subject` (user / `X-Anon-Id` / IP)
- [x] `backend/api/routes_me.py` — `GET /api/me`
- [x] Quota-gate `POST /api/query/suggestions`; `QuotaExceededError` → 429; add `quota` to `SuggestionResponse`
- [x] `UNAUTHORIZED` (401) + `QUOTA_EXCEEDED` (429) error codes
- [x] `backend/tests/{test_quota_service,test_auth_deps,test_api_auth_quota}.py` + hermetic conftest (68 passing)
- [x] `plan/supabase-setup.md` — project, email OTP template, custom SMTP, schema
- [ ] Verify live: create `query_usage`, then 2 anon queries → 429 → signup/OTP → unlimited

## Phase 14: UI Redesign (modern chat product)
**Depends on**: Phase 13
**Estimated effort**: Large

- [x] New tokens in `tailwind.config.js` + `index.css` (violet-indigo brand, mint accent, Space Grotesk/Inter)
- [x] `services/supabase.js` + `hooks/useAuth.js` (session, signUp, verifyOtp, signIn, signOut)
- [x] `services/api.js` — Bearer token + `X-Anon-Id`, quota-aware error helpers, `getMe`
- [x] `components/AuthModal.jsx` (signup → OTP → verify, sign in) and `components/QuotaBadge.jsx`
- [x] Rebuilt `App.jsx` shell, `Sidebar`, `ChatMessage` (incl. quota gate), `Composer`, `QuerySuggestions`, `SearchResults`, `LoadingSpinner`
- [x] Removed fake telemetry; deleted dead `pages/Home.jsx` + `ImageInput/VoiceInput/TextInput`
- [x] Verify: `npm run build` clean; empty state, modal, suggestions and results screenshotted

---

## Summary

| Phase | Description | Status | Files |
|-------|-------------|--------|-------|
| 1 | Backend Foundation | Completed | app.py, config/, models/, requirements.txt, .env.example, .gitignore |
| 2 | Service Layer | Completed | services/llm_service.py, embedding_service.py, search_service.py |
| 3 | Input Processing Pipeline | Completed | pipeline/speech.py, vision.py, fusion.py |
| 4 | Query Generation & Selection | Completed | pipeline/candidate_gen.py, scoring.py, diversity.py |
| 5 | Suggestions API Route | Completed | api/routes_query.py |
| 6 | Search & Reranking | Completed | pipeline/search.py, rerank.py, api/routes_search.py |
| 7 | Frontend Foundation | Completed | Vite setup, api.js, App.jsx, index.css |
| 8 | Frontend Input Stage | Completed | Composer.jsx, LoadingSpinner.jsx, App.jsx |
| 9 | Frontend Suggestions | Completed | QuerySuggestions.jsx, QueryEditor.jsx |
| 10 | Frontend Results | Completed | SearchResults.jsx |
| 11 | Testing & Polish | Completed | tests/* (36 tests), README.md |
| 12 | Evaluation | Completed | evaluation/*, tests/test_evaluation.py |
| 13 | Supabase Auth & Quota | Completed (live table pending) | services/{supabase_client,auth_service,quota_service}.py, api/{deps,routes_me}.py, supabase/schema.sql |
| 14 | UI Redesign | Completed | App.jsx, components/*, services/supabase.js, hooks/useAuth.js |
