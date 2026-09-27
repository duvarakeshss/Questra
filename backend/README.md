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
| POST | `/api/query/suggestions` | `multipart/form-data` with any of `image`, `audio`, `text` → scored, diverse query suggestions |
| POST | `/api/search` | JSON `{ "query": "..." }` → reranked search results |

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

## Configuration

All configuration is environment-driven (see `.env.example`): Groq/SerpAPI keys, model names, candidate/suggestion counts, MMR lambda, top-k values, upload size limits, and CORS origins.
