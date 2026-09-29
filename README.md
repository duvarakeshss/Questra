# Questra

Questra turns text, images, and voice into search directions. It generates and diversifies query suggestions, then searches the web and reranks results by semantic similarity so users can explore relevant sources.

Questra is a search and information retrieval prototype. It does not generate a final answer with an LLM; it presents retrieved results and their source pages.

## How it works

1. Provide text, an image, audio, or a combination.
2. Questra describes images and transcribes audio, then combines the available context.
3. It generates candidate queries, scores them for intent, and selects diverse suggestions.
4. Choose or edit a suggestion to search the web.
5. Results are reranked using Sentence Transformers embeddings and cosine similarity.

## Technology

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **AI processing:** Groq vision, Whisper transcription, and text generation
- **Web search:** SerpAPI
- **Semantic ranking:** Sentence Transformers (`all-MiniLM-L6-v2`)
- **Authentication and usage storage:** Supabase, with local SQLite quota fallback

## Requirements

- Python 3.10 or later
- Node.js and npm
- Groq API key
- SerpAPI API key
- Supabase project and keys for authentication and shared usage storage (optional for local development)

## Run locally

### Backend

In a terminal from the repository root:

```bash
cd backend
python -m venv .venv
```

Activate the environment, install dependencies, and configure the backend:

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set `GROQ_API_KEY` and `SERPAPI_API_KEY`. The remaining settings have defaults. Run the API from the `backend` directory:

```bash
uvicorn app:app --reload --port 8000
```

The API docs are available at [localhost:8000/docs](http://localhost:8000/docs), and the health endpoint is `GET /api/health`.

### Frontend

In another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173). Vite proxies `/api` requests to `http://localhost:8000`.

To enable Supabase sign-in, copy `frontend/.env.example` to `frontend/.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Configure the corresponding Supabase settings in `backend/.env` as well. See the [Supabase setup guide](plan/supabase-setup.md). Without Supabase, the backend uses local SQLite for anonymous query usage; frontend sign-in is unavailable.

## Configuration

Backend settings are read from `backend/.env`; frontend settings use Vite variables in `frontend/.env`.

| Setting | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq image understanding, transcription, and query generation services |
| `SERPAPI_API_KEY` | Web search |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public key used for token verification; newer Supabase projects may use `SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only key for usage storage; newer projects may use `SUPABASE_SECRET_KEY` |
| `ANONYMOUS_FREE_QUERIES` | Anonymous suggestion generations allowed per quota window (default: `2`) |
| `QUOTA_WINDOW_HOURS` | Anonymous quota window (default: `24`) |
| `QUOTA_DB_PATH` | Local SQLite usage database path when Supabase usage storage is unavailable |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (default: `http://localhost:5173`) |
| `VITE_SUPABASE_URL` | Supabase URL for the browser client |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key for the browser client |

Model names, candidate and result counts, MMR weighting, and upload limits can also be configured; defaults are listed in `backend/.env.example`.

## API

All endpoints use the `/api` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API status and embedding model readiness |
| `GET` | `/api/me` | Authentication and current quota information |
| `POST` | `/api/query/suggestions` | Multipart `image`, `audio`, and/or `text` input; returns query suggestions and context |
| `POST` | `/api/search` | JSON `{ "query": "..." }`; returns reranked search results |

Anonymous visitors have a configurable suggestion-generation limit. Signed-in users are unlimited. Search requests are not charged against this quota. Image and audio upload size limits default to 10 MB and 25 MB, respectively.

## Development

Run backend tests from the `backend` directory:

```bash
pytest tests/ -v
```

The evaluation harness is also in `backend/evaluation/`. Run its sample comparison from the `backend` directory with the Groq and SerpAPI keys configured:

```bash
python -m evaluation.run
```

Build the frontend from the `frontend` directory:

```bash
npm run build
```

## Project layout

```text
backend/       FastAPI routes, multimodal and search pipelines, services, tests, evaluation
frontend/      React application and API/Supabase clients
questra_docs/  Architecture, implementation, API, security, and evaluation documentation
plan/          Product and architecture notes, tasks, and Supabase setup
```

## Security notes

- Keep Groq, SerpAPI, and Supabase service-role/secret keys in the backend environment. Never put them in frontend variables.
- Only Supabase URL and public anon/publishable keys belong in the browser configuration.
- Uploaded media is processed for the request and is not intended for permanent storage.

## Documentation

Start with the [Questra documentation index](questra_docs/README.md). It links to the [system architecture](questra_docs/02_SYSTEM_ARCHITECTURE.md), [multimodal pipeline](questra_docs/04_MULTIMODAL_QUERY_PIPELINE.md), [search and reranking](questra_docs/05_IR_SEARCH_AND_RERANKING.md), [API specification](questra_docs/07_API_SPECIFICATION.md), [testing and evaluation](questra_docs/08_TESTING_AND_EVALUATION.md), and [security guidance](questra_docs/09_SECURITY_AND_ERROR_HANDLING.md).
