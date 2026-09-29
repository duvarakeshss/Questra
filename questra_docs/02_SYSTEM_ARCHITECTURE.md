# Questra --- System Architecture

## High-level architecture

``` text
┌──────────────────────────────────────────────────────────────┐
│ Frontend: React + Vite + Tailwind                            │
│                                                              │
│ Image Input | Voice Input | Text Input                       │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP
                               ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend: FastAPI                                             │
│                                                              │
│ API Layer                                                    │
│  /api/query/suggestions                                      │
│  /api/search                                                 │
│  /api/health                                                 │
│                                                              │
│ Pipeline Layer                                               │
│  speech → vision → fusion → generation                       │
│  scoring → diversity → search → rerank                       │
│                                                              │
│ Services Layer                                               │
│  Groq | Sentence Transformers | SerpAPI                      │
└──────────────────────────────────────────────────────────────┘
```

## Three backend layers

### API layer

Handles HTTP, validation, serialization, status codes, and error
mapping.

### Pipeline layer

Orchestrates the actual workflow. Each module performs one
responsibility.

### Services layer

Contains thin wrappers around external providers and local models.

## Query suggestion data flow

``` text
Image bytes ──→ Vision ──→ Image description ─┐
                                               │
Audio bytes ──→ Whisper ──→ Transcript ────────┼→ MultimodalContext
                                               │
Text ──────────────────────────────────────────┘
                                                        ↓
                                               Candidate generation
                                                        ↓
                                                Intent scoring
                                                        ↓
                                                       MMR
                                                        ↓
                                                 Suggestions
```

## Search data flow

``` text
Selected query
     ↓
SerpAPI
     ↓
10 raw results
     ↓
Sentence Transformer
     ↓
Query/snippet cosine similarity
     ↓
Sort descending
     ↓
Top 5 results
```

## Storage

The approved prototype has no persistent database, user accounts, or
saved history. Uploaded media is processed temporarily and should not be
permanently stored.
