# Questra --- Backend Implementation

## Structure

``` text
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── models/
│   ├── routes/
│   ├── pipeline/
│   └── services/
├── tests/
├── .env
├── .env.example
└── requirements.txt
```

## Pipeline modules

``` text
pipeline/
├── speech.py
├── vision.py
├── fusion.py
├── candidate_gen.py
├── scoring.py
├── diversity.py
├── search.py
└── rerank.py
```

## Service modules

``` text
services/
├── llm_service.py
├── embedding_service.py
└── search_service.py
```

## Responsibilities

### `speech.py`

Audio bytes → Whisper transcript.

### `vision.py`

Image bytes → visual description.

### `fusion.py`

Combines available modalities into `MultimodalContext`.

### `candidate_gen.py`

Generates approximately 12 candidate search queries.

### `scoring.py`

Scores candidates from 0.0 to 1.0 for intentionality.

### `diversity.py`

Uses MMR to select 3--5 diverse candidates.

### `search.py`

Calls SerpAPI and normalizes results.

### `rerank.py`

Embeds query and snippets, calculates cosine similarity, and sorts
results.

## Service abstraction

Routes should never call provider SDKs directly.

Use:

``` python
class LLMService:
    def describe_image(...)
    def transcribe_audio(...)
    def generate_queries(...)
    def score_queries(...)

class EmbeddingService:
    def encode(...)

class SearchService:
    def search(...)
```

This makes provider replacement and mocking straightforward.
