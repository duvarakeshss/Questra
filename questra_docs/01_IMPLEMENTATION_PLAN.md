# Questra --- Implementation Plan

## Objective

Build a working multimodal search system where users can provide image,
voice, text, or combinations of these inputs. Questra transforms the
input into intentional and diverse search queries and then retrieves and
ranks web information.

## End-to-end flow

``` text
User
 ↓
Image / Voice / Text
 ↓
Input Validation
 ↓
Image Description + Speech Transcript
 ↓
Multimodal Context Fusion
 ↓
Candidate Query Generation
 ↓
Intentionality Scoring
 ↓
MMR Diversity Selection
 ↓
3–5 Query Suggestions
 ↓
User Selects or Edits Query
 ↓
Web Search
 ↓
Raw Results
 ↓
Semantic Reranking
 ↓
Top Results + Sources
```

## Implementation order

### Phase 1 --- Foundation

-   Create FastAPI backend.
-   Create React/Vite frontend.
-   Add `.env.example`.
-   Implement `/api/health`.

### Phase 2 --- Text baseline

-   Text input.
-   Candidate generation.
-   Intent scoring.
-   MMR.
-   Suggestion UI.

### Phase 3 --- Search

-   SerpAPI integration.
-   Result normalization.
-   Sentence Transformer embeddings.
-   Cosine-similarity reranking.
-   Search result UI.

### Phase 4 --- Image

-   Image upload and validation.
-   Vision processing.
-   Image preview.
-   Multimodal fusion.

### Phase 5 --- Voice

-   Browser `MediaRecorder`.
-   Audio validation.
-   Whisper transcription.
-   Voice + text/image fusion.

### Phase 6 --- UX

-   Search canvas.
-   Intent suggestion cards.
-   Query editor.
-   Results workspace.
-   Source reader.
-   Related search/path visualization.

### Phase 7 --- Quality

-   Unit tests.
-   Integration tests.
-   Mock external services.
-   Manual relevance testing.
-   Latency measurements.

## Development principle

Build the text → search → reranking path first. Then add image and
voice. This ensures there is always a working IR pipeline while
multimodal features are added.
