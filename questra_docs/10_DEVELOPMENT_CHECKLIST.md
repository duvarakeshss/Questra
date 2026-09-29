# Questra --- Development Checklist

## Foundation

-   [ ] Backend created
-   [ ] Frontend created
-   [ ] `.env.example`
-   [ ] FastAPI health endpoint
-   [ ] React application

## Query pipeline

-   [ ] Text input
-   [ ] Image input
-   [ ] Voice input
-   [ ] Vision description
-   [ ] Whisper transcript
-   [ ] Multimodal fusion
-   [ ] Candidate generation
-   [ ] Intent scoring
-   [ ] MMR
-   [ ] Suggestion UI

## IR

-   [ ] SerpAPI integration
-   [ ] Result normalization
-   [ ] Sentence Transformer
-   [ ] Query embedding
-   [ ] Snippet embedding
-   [ ] Cosine similarity
-   [ ] Semantic reranking
-   [ ] Source reader

## UX

-   [ ] Search canvas
-   [ ] Query suggestion cards
-   [ ] Query editing
-   [ ] Search results
-   [ ] Related searches
-   [ ] Search path
-   [ ] Loading states
-   [ ] Error states
-   [ ] Accessibility

## Testing

-   [ ] Unit tests
-   [ ] Mock external services
-   [ ] Integration tests
-   [ ] Manual multimodal tests
-   [ ] Latency measurement
-   [ ] Optional relevance evaluation

## Final demo

### Image

Upload image → suggestions → select → search → ranked sources.

### Image + voice

Upload image + voice constraint → fused intent → suggestions → search.

### Text

Enter text → suggestions → search → semantic reranking.

## Final success criterion

The project should demonstrate:

> Given ambiguous multimodal input, Questra produces useful,
> intentional, diverse search queries and retrieves relevant web
> information.

The objective is not to generate an impressive AI answer. The objective
is to improve the search process.
