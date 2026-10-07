# Questra

Questra turns text, images, and voice into search directions. It generates and diversifies query
suggestions, then searches the web and reranks results by semantic similarity so users can explore
relevant sources.

Each **session is a conversation**: you describe what you want, pick or edit a suggestion, and keep
talking to refine the search. Follow-up inputs are appended to the same thread — earlier suggestions
and results stay on screen, and the session is saved in your browser, so you never lose history by
starting another "query".

Questra is a search and information-retrieval prototype. It does not generate a final answer with an
LLM; it presents retrieved results and their source pages.

## How it works

1. Provide text, an image, audio, or a combination.
2. Questra describes images and transcribes audio, then combines the available context.
3. It generates candidate queries, scores them for intent, and selects diverse suggestions.
4. Choose or edit a suggestion to search the web.
5. Results are reranked using Sentence Transformers embeddings and cosine similarity.
6. Keep going — send another description in the same session to add a new branch of suggestions and
   results without losing what came before.

## Features

- **One conversation per session.** Every submitted input adds a turn to the current session; prior
  suggestions and results remain visible and scrollable.
- **Persistent history.** Sessions (and their turns) are saved to browser `localStorage`, so they
  survive a reload; the **Recent** list restores any past session.
- **Always-available composer.** The text / image / voice composer stays pinned so you can refine or
  branch at any point.
- **Human-in-the-loop.** Suggestions can be selected, inline-edited, or replaced with your own query;
  suggestions can be regenerated per turn.
- **Accounts and a free tier.** Anonymous visitors get a small number of suggestion generations, then
  sign in (email + password + emailed OTP) for unlimited use. Search is not rate-limited.

## Technology

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **AI processing:** Groq vision, Whisper transcription, and text generation
- **Web search:** SerpAPI
- **Semantic ranking:** Sentence Transformers (`all-MiniLM-L6-v2`)
- **Authentication and usage storage:** Supabase (Auth + Postgres)

## Requirements

- Python 3.10 or later
- Node.js and npm
- Groq API key
- SerpAPI API key
- Supabase project and keys for authentication and shared usage storage (optional for local
  development)

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

Copy `backend/.env.example` to `backend/.env` and set `GROQ_API_KEY` and `SERPAPI_API_KEY`. The
remaining settings have defaults. Run the API from the `backend` directory:

```bash
uvicorn app:app --reload --port 8000
```

The API docs are available at [localhost:8000/docs](http://localhost:8000/docs), and the health
endpoint is `GET /api/health`.

### Frontend

In another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open [localhost:5173](http://localhost:5173). API calls go to `VITE_BACKEND_URL` when it is set;
otherwise Vite proxies `/api` requests to `http://localhost:8000`.

Copy `frontend/.env.example` to `frontend/.env` and set `VITE_BACKEND_URL` to the backend origin
(for example `http://localhost:8000`). To enable Supabase sign-in, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`. Configure the corresponding Supabase settings in
`backend/.env` as well. See the [Supabase setup guide](plan/supabase-setup.md). Without Supabase, the
backend runs unmetered and frontend sign-in is unavailable.

## Configuration

Backend settings are read from `backend/.env`; frontend settings use Vite variables in
`frontend/.env`.

| Setting | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq image understanding, transcription, and query generation services |
| `SERPAPI_API_KEY` | Web search |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public key used for token verification; newer Supabase projects may use `SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only key for usage storage; newer projects may use `SUPABASE_SECRET_KEY` |
| `ANONYMOUS_FREE_QUERIES` | Anonymous suggestion generations allowed per quota window (default: `2`) |
| `QUOTA_WINDOW_HOURS` | Anonymous quota window (default: `24`) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins (default: `http://localhost:5173`) |
| `VITE_BACKEND_URL` | Backend origin the browser calls (`<url>/api`); falls back to the Vite dev proxy when unset |
| `VITE_SUPABASE_URL` | Supabase URL for the browser client |
| `VITE_SUPABASE_ANON_KEY` | Public Supabase key for the browser client |

Model names, candidate and result counts, MMR weighting, and upload limits can also be configured;
defaults are listed in `backend/.env.example`.

## API

All endpoints use the `/api` prefix.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API status and embedding model readiness |
| `GET` | `/api/me` | Authentication and current quota information |
| `POST` | `/api/query/suggestions` | Multipart `image`, `audio`, and/or `text` input; returns query suggestions and context |
| `POST` | `/api/search` | JSON `{ "query": "..." }`; returns reranked search results |

The HTTP API is stateless: a "session" is a frontend concept, and each turn makes one
`/api/query/suggestions` call (when you submit input) and zero or more `/api/search` calls (when you
run a suggestion). Anonymous visitors have a configurable suggestion-generation limit; signed-in
users are unlimited. Search requests are not charged against this quota. Image and audio upload size
limits default to 10 MB and 25 MB, respectively.

## Project layout

```text
backend/       FastAPI routes, multimodal and search pipelines, services, tests, evaluation
frontend/      React application and API/Supabase clients
questra_docs/  Architecture, implementation, API, security, and evaluation documentation
plan/          Product and architecture notes, tasks, and Supabase setup
```

Key frontend files:

```text
frontend/src/
  App.jsx                        session + turn state, API calls, persistence
  components/
    SuggestionsPanel.jsx         empty-state hero (composer, examples, pipeline strip)
    Conversation.jsx             renders the session thread + pinned composer
    Turn.jsx                     one turn: user input, suggestions, inline results
    ComposerBar.jsx              text/image/voice composer and recording hook
    Sidebar.jsx  TopBar.jsx      recent sessions, quota, new search
    AuthModal.jsx  QueryEditor.jsx  Icons.jsx  Aurora.jsx
  services/api.js                axios client (Bearer token + X-Anon-Id)
  hooks/useAuth.js               Supabase session state
```

## Development

Install the test tooling and run the backend tests from the `backend` directory:

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
```

The evaluation harness is also in `backend/evaluation/`. Run its sample comparison from the
`backend` directory with the Groq and SerpAPI keys configured:

```bash
python -m evaluation.run
```

Build the frontend from the `frontend` directory:

```bash
npm run build
```

## Deploy

Both apps ship as Docker images; `docker-compose.yml` runs them together.

```bash
docker compose up --build
```

- **Backend** (`backend/Dockerfile`) reads configuration from environment variables first, with
  `.env` as a fallback (`ENV_FILE` overrides its path), and binds `$PORT`.
- **Frontend** (`frontend/Dockerfile`) builds the Vite app and serves it with nginx. `VITE_*`
  values are baked in at build time, so pass `VITE_BACKEND_URL`, `VITE_SUPABASE_URL`, and
  `VITE_SUPABASE_ANON_KEY` as build args.

Set `CORS_ORIGINS` on the backend to the deployed frontend origin.

## Security notes

- Keep Groq, SerpAPI, and Supabase service-role/secret keys in the backend environment. Never put
  them in frontend variables.
- Only the Supabase URL and public anon/publishable keys belong in the browser configuration.
- Uploaded media is processed for the request and is not intended for permanent storage.
- Session history is stored only in the browser's `localStorage`; it is not sent to the backend.

## Documentation

Start with the [Questra documentation index](questra_docs/README.md). It links to the
[system architecture](questra_docs/02_SYSTEM_ARCHITECTURE.md),
[multimodal pipeline](questra_docs/04_MULTIMODAL_QUERY_PIPELINE.md),
[search and reranking](questra_docs/05_IR_SEARCH_AND_RERANKING.md),
[API specification](questra_docs/07_API_SPECIFICATION.md),
[testing and evaluation](questra_docs/08_TESTING_AND_EVALUATION.md), and
[security guidance](questra_docs/09_SECURITY_AND_ERROR_HANDLING.md).

For the implementation-level architecture and the operating guide, see
[plan/architecture.md](plan/architecture.md) and [plan/agent.md](plan/agent.md). The backend also has
its own [README](backend/README.md).
