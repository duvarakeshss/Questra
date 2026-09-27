# Questra — Backend

FastAPI backend for Questra, the multimodal intent-aware query discovery system.

## Setup

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then fill in GROQ_API_KEY and SERPAPI_API_KEY
```

## Run

```bash
uvicorn app:app --reload --port 8000
```

- Interactive docs: http://localhost:8000/docs
- Health check: `GET http://localhost:8000/api/health`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status + whether the embedding model is loaded |
| GET | `/api/me` | Current quota + signed-in email (for the header badge) |
| POST | `/api/query/suggestions` | `multipart/form-data` with any of `image`, `audio`, `text` → scored, diverse query suggestions (quota-gated) |
| POST | `/api/search` | JSON `{ "query": "..." }` → reranked search results |

## Auth & quota

Auth and the database run on **Supabase** (see [../plan/supabase-setup.md](../plan/supabase-setup.md)).

- A logged-out visitor gets `ANONYMOUS_FREE_QUERIES` (default **2**) suggestion generations.
  The 3rd returns `429 QUOTA_EXCEEDED` and the frontend opens the login popup.
- Signed-in users are unlimited. The frontend authenticates with Supabase (email + password +
  emailed OTP) and sends the access token as `Authorization: Bearer <token>`.
- Anonymous usage is keyed by the `X-Anon-Id` header, falling back to the client IP.
- The service-role (secret) key is **backend-only** — never expose it to the browser.

Usage is stored in `public.query_usage`. If that table is missing, or Supabase is not configured,
the quota transparently falls back to a local SQLite file (`QUOTA_DB_PATH`) so the limit **always
holds** — the app never silently runs unmetered. Create the table (see the setup guide) to store
usage in Supabase instead.

## Architecture

Three layers with a strict one-way dependency: **API → Pipeline → Services**.

- `api/` — HTTP routes; validation and error mapping only.
- `pipeline/` — `speech`, `vision`, `fusion`, `candidate_gen`, `scoring`, `diversity`, `search`, `rerank`.
- `services/` — thin wrappers over Groq, SerpAPI, and the local Sentence Transformer model.

See [../plan/architecture.md](../plan/architecture.md) for the full picture.

## Tests

```bash
pytest tests/ -v
```

External services (Groq, SerpAPI) are mocked — no API keys required to run the suite.

## Evaluation

`evaluation/` scores the pipeline against the objectives in `idea.md` (§20) and the four
baselines (§21):

- `metrics.py` — precision@k, recall@k, MRR, DCG/nDCG.
- `intentionality.py` — mean intent score + embedding alignment of queries to the multimodal context.
- `diversity.py` — average pairwise similarity/distance across a suggestion set.
- `baselines.py` — text-only, image-caption, single-generated-query, relevance-only, and full Questra selectors.
- `harness.py` — runs every system over a benchmark and aggregates the metrics into a comparison table.

Run the sample comparison (requires `GROQ_API_KEY` and `SERPAPI_API_KEY`):

```bash
python -m evaluation.run
```

Intentionality and diversity are label-free, so the sample runs without ground truth. Attach
`relevant_urls` (and optionally `relevance_grades`) to benchmark cases to also score search quality.

## Configuration

All configuration is environment-driven (see `.env.example`): Groq/SerpAPI keys, Supabase URL +
keys, anonymous free-query limit and window, model names, candidate/suggestion counts, MMR lambda,
top-k values, upload size limits, and CORS origins.

Supabase accepts either naming scheme: `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, or the
newer `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`.
