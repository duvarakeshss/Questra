# Questra --- Implementation Documentation

Questra is a multimodal Information Retrieval and Web Search prototype.

## Core workflow

Image / Voice / Text → Multimodal Understanding → Query Suggestions →
User Selection → Web Search → Semantic Reranking → Sources.

The project does **not** use an LLM to generate the final answer. The
LLM is used only for image understanding, speech-to-text, candidate
query generation, and intentionality scoring. The final experience
displays retrieved web information and source pages.

## Stack

-   Frontend: React, Vite, TypeScript, Tailwind CSS
-   Backend: Python, FastAPI, Pydantic
-   AI services: Groq vision, Whisper, text generation
-   Embeddings: Sentence Transformers
-   Search: SerpAPI
-   Ranking: cosine-similarity semantic reranking

## Dataset

No training dataset is required for the approved prototype. The system
uses pretrained models and live web search. A small relevance-judgment
set can be added later only if formal IR evaluation is required.

## Documents

1.  `01_IMPLEMENTATION_PLAN.md` --- implementation phases
2.  `02_SYSTEM_ARCHITECTURE.md` --- architecture and data flow
3.  `03_BACKEND_IMPLEMENTATION.md` --- FastAPI implementation
4.  `04_MULTIMODAL_QUERY_PIPELINE.md` --- multimodal processing
5.  `05_IR_SEARCH_AND_RERANKING.md` --- retrieval and ranking
6.  `06_FRONTEND_IMPLEMENTATION.md` --- React implementation
7.  `07_API_SPECIFICATION.md` --- API contracts
8.  `08_TESTING_AND_EVALUATION.md` --- testing and evaluation
9.  `09_SECURITY_AND_ERROR_HANDLING.md` --- security
10. `10_DEVELOPMENT_CHECKLIST.md` --- build checklist
