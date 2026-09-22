# Questra — Multimodal Intent-Aware Query Discovery

## 1. Project Overview

Questra is a multimodal information retrieval system that helps users formulate better search queries using image, voice, and text.

The system is inspired by the research problem of multimodal query suggestion, particularly the two important objectives:

- Intentionality — how well a generated query represents the user's actual information need.
- Diversity — how different and complementary the generated queries are.

Questra extends this idea into a practical end-to-end search application.

The user can provide:

- an image
- voice input
- text input
- image + voice
- image + text
- voice + text
- image + voice + text

The system understands the available modalities, generates multiple possible search queries, scores them for relevance, selects diverse suggestions, and asks the user to confirm or modify a query before performing the search.

---

# 2. Core Idea

The primary pipeline is:

Image + Voice + Text
        |
        v
Multimodal Fusion
        |
        v
Candidate Query Generation
        |
        v
Intentionality / Relevance Scoring
        |
        v
Semantic Diversity Selection
        |
        v
Query Suggestions
        |
        v
User Confirmation / Edit
        |
        v
Final Search Query
        |
        v
Search
        |
        v
Result Retrieval
        |
        v
Semantic Reranking
        |
        v
Final Search Results


The main research idea is to generate queries that are both:

1. Relevant to the user's multimodal input.
2. Diverse enough to represent different plausible search intents.

---

# 3. Problem Statement

Traditional search systems primarily depend on users manually constructing textual queries.

However, users may have useful information that is difficult to express precisely using text alone.

For example, a user may upload an image of a shoe and say:

"I want something like this for running."

The image provides visual information such as:

- object category
- color
- shape
- appearance
- style

The voice provides additional information such as:

- intended use
- preferences
- constraints
- context

A conventional text-only search system may fail to capture all this information.

Questra combines multiple modalities and automatically generates useful search queries.

---

# 4. Main Objectives

Questra should satisfy the following objectives.

## 4.1 Multimodal Input

Support:

- Image
- Voice
- Text
- Image + Voice
- Image + Text
- Voice + Text
- Image + Voice + Text

The system should work even when some modalities are missing.

At least one modality must be provided.

---

## 4.2 Multimodal Understanding

The system should extract meaningful information from each modality.

For example:

Image:

"Black athletic running shoe with white sole."

Voice:

"I want something similar but suitable for daily running."

Text:

"Budget under 5000."

The system should combine these into a unified context:

Visual Context:
Black athletic running shoe with white sole.

User Intent:
Similar shoe suitable for daily running.

Constraint:
Budget under 5000.

---

## 4.3 Candidate Query Generation

Generate approximately 10–15 candidate search queries from the multimodal context.

The queries should represent different meaningful search intents rather than simple grammatical variations.

Example:

1. Affordable black running shoes similar to this design
2. Lightweight running shoes with a similar black and white style
3. Comfortable daily running shoes similar to this model
4. Budget running shoes with a minimalist black design
5. Sports shoes similar to this pair under 5000 rupees

The exact number of candidates should be configurable.

---

## 4.4 Intentionality

Each candidate query should be evaluated according to how well it represents the information contained in the original multimodal input.

The intentionality score should consider factors such as:

- visual relevance
- semantic relevance
- user-provided text
- transcribed voice
- constraints
- consistency with the multimodal input

The system should produce a normalized relevance/intentionality score where practical.

Example:

Query:
"Affordable black running shoes similar to this design"

Score:
0.91

Query:
"Black shoes similar to uploaded image"

Score:
0.88

Query:
"Black casual sneakers"

Score:
0.61

Query:
"White formal shoes"

Score:
0.13

The exact scoring implementation should be decided during planning.

---

## 4.5 Diversity

High-scoring queries may still be very similar.

For example:

- Black running shoes
- Affordable black running shoes
- Budget black running shoes
- Cheap black running shoes

These queries provide little additional information.

Questra should therefore select queries that are:

1. Relevant to the user's intent.
2. Semantically different from one another.

The preferred approach is:

Sentence Transformer embeddings
+
Maximal Marginal Relevance (MMR)

The final suggestions should represent different useful aspects of the user's possible intent.

---

## 4.6 Human-in-the-Loop Query Confirmation

The system should not automatically search using the first generated query.

Instead, it should display the final query suggestions to the user.

The user should be able to:

- select a suggestion
- edit a suggestion
- enter a custom query
- regenerate suggestions
- confirm the final query

This creates a human-in-the-loop query formulation stage.

Generated queries are suggestions and should not override the user's decision.

---

## 4.7 Search

After the user confirms a query, Questra should perform information retrieval.

The search layer should be abstracted so that the underlying search provider can be changed without modifying the rest of the pipeline.

Possible search implementations include:

- SerpAPI
- another web search API
- local document search
- FAISS-based retrieval

The first implementation should use the simplest practical option.

---

## 4.8 Result Reranking

The initial search results should be reranked according to semantic relevance to the final user query.

Pipeline:

Final Query
    |
    v
Initial Search
    |
    v
Top N Results
    |
    v
Embedding Generation
    |
    v
Semantic Similarity
    |
    v
Reranking
    |
    v
Final Top-K Results

---

# 5. Research Inspiration

Questra is inspired by the research problem addressed in:

"Multimodal Query Suggestion with Multi-Agent Reinforcement Learning from Human Feedback"

The research focuses on multimodal query suggestion while optimizing two important objectives:

- intentionality
- diversity

The original approach uses reinforcement-learning-based agents to optimize these objectives.

Questra does NOT attempt to reproduce the complete reinforcement learning training system.

In particular, Version 1 does not require implementing:

- PPO training
- PolicyNet training
- RewardNet training
- REINFORCE training
- large-scale RLHF data collection

Instead, Questra implements a practical inference-oriented architecture using pretrained models and optimization techniques.

Conceptually:

Original Research
        |
        +-- Multimodal Query Suggestion
        +-- Intentionality
        +-- Diversity
        +-- Agent-based optimization
        +-- RLHF
        |
        v
Questra
        |
        +-- Multimodal Input
        +-- Candidate Query Generation
        +-- Intentionality Scoring
        +-- Semantic Diversity
        +-- MMR
        +-- Human Confirmation
        +-- Search
        +-- Result Reranking

The project should clearly distinguish the original research approach from the implemented Questra architecture.

---

# 6. Technology Stack

## Backend

Python + FastAPI

Responsibilities:

- API endpoints
- image processing
- voice processing
- multimodal fusion
- candidate query generation
- intentionality scoring
- diversity selection
- search
- result reranking
- evaluation

---

## Frontend

React + Vite

Responsibilities:

- image upload
- voice recording/upload
- text input
- displaying uploaded image
- displaying generated query suggestions
- query editing
- query confirmation
- displaying search results
- loading states
- error states

---

## AI / ML Components

Use pretrained models rather than training large models from scratch.

Potential components:

### Speech-to-Text

Possible options:

- Whisper
- Groq Whisper API
- local Whisper

The final choice should be made during planning based on:

- accuracy
- cost
- latency
- deployment requirements
- ease of implementation

---

### Vision-Language Model

Use a vision-language model to understand the uploaded image and generate useful visual context.

Possible options include:

- Llama vision models available through Groq
- another suitable multimodal LLM
- a local vision-language model if practical

The final model should be selected after evaluating current availability, API requirements, cost, and performance.

---

### Embeddings

Use Sentence Transformers.

A lightweight model such as:

all-MiniLM-L6-v2

can be used for:

- query embeddings
- semantic similarity
- diversity selection
- result reranking

---

### Vision-Text Similarity

A CLIP-style model may be used for image-text relevance scoring.

Conceptually:

Image
  |
  v
CLIP Image Encoder
  |
  v
Image Embedding
  |
  +-------------------+
                      |
Query --> Text Encoder
                      |
                      v
              Cosine Similarity
                      |
                      v
              Intentionality Score

If a VLM/LLM-based scoring approach provides a simpler or more reliable implementation, evaluate that option during planning.

---

# 7. Proposed Backend Architecture

Suggested structure:

backend/
|
+-- app.py
|
+-- api/
|   +-- routes_input.py
|   +-- routes_query.py
|   +-- routes_search.py
|   +-- routes_health.py
|
+-- pipeline/
|   +-- fusion.py
|   +-- speech.py
|   +-- vision.py
|   +-- candidate_gen.py
|   +-- scoring.py
|   +-- diversity.py
|   +-- search.py
|   +-- rerank.py
|   +-- run.py
|
+-- models/
|   +-- schemas.py
|
+-- services/
|   +-- llm_service.py
|   +-- embedding_service.py
|   +-- search_service.py
|
+-- evaluation/
|   +-- intentionality.py
|   +-- diversity.py
|   +-- metrics.py
|
+-- config/
|   +-- settings.py
|
+-- tests/
|
+-- requirements.txt
|
+-- .env.example

Claude Code may modify this structure if a better architecture is identified.

Do not introduce unnecessary abstractions.

---

# 8. Proposed Frontend Architecture

Suggested structure:

frontend/
|
+-- src/
    |
    +-- components/
    |   +-- ImageInput.jsx
    |   +-- VoiceInput.jsx
    |   +-- TextInput.jsx
    |   +-- QuerySuggestions.jsx
    |   +-- QueryEditor.jsx
    |   +-- SearchResults.jsx
    |   +-- LoadingState.jsx
    |
    +-- pages/
    |   +-- Home.jsx
    |
    +-- services/
    |   +-- api.js
    |
    +-- hooks/
    |
    +-- App.jsx
    |
    +-- main.jsx
|
+-- package.json

Claude Code may restructure this if required.

---

# 9. Detailed Processing Pipeline

## Step 1 — User Input

The frontend allows the user to provide one or more:

- Image
- Voice
- Text

At least one input must be provided.

---

## Step 2 — Image Processing

If an image is provided:

1. Validate file type.
2. Validate file size.
3. Process or resize if required.
4. Send the image to the vision-language component.
5. Extract useful visual information.

Example:

Input image:

Black athletic running shoe with white sole.

Vision output:

"Black athletic running shoe with white sole, low-top design and mesh upper."

---

## Step 3 — Voice Processing

If voice is provided:

Audio
  |
  v
Speech-to-Text
  |
  v
Transcribed Text

Example:

Voice:

"I want something similar for running under 5000 rupees."

Transcript:

"I want something similar for running under 5000 rupees."

The transcript becomes part of the unified multimodal context.

---

## Step 4 — Text Processing

If text is provided, preserve the user's original text.

Do not unnecessarily rewrite or change the user's intent before candidate generation.

---

## Step 5 — Multimodal Fusion

Combine all available information.

Example:

IMAGE DESCRIPTION:
Black athletic running shoe with white sole.

VOICE:
I want something similar for daily running.

TEXT:
Budget under 5000.

Create a structured multimodal context:

Visual Context:
Black athletic running shoe with white sole.

User Intent:
Similar shoe suitable for daily running.

Constraint:
Budget under 5000.

This context is passed to candidate generation.

---

# 10. Candidate Query Generation

The candidate generation model should produce approximately 10–15 candidate queries.

The generation prompt should explicitly request:

- relevance
- meaningful variation
- different search intents
- concise search-friendly queries
- no duplicate queries
- no unsupported facts
- preservation of user constraints

Example output:

{
  "queries": [
    "Affordable black running shoes similar to this design",
    "Lightweight running shoes with a similar black and white style",
    "Comfortable daily running shoes similar to this model",
    "Budget running shoes with a minimalist black design",
    "Sports shoes similar to this pair under 5000 rupees"
  ]
}

The number of generated candidates should be configurable.

---

# 11. Intentionality Scoring

Each candidate query should receive an intentionality/relevance score.

A possible hybrid scoring function is:

Intent Score =
    w1 * Visual Similarity
  + w2 * Text Similarity
  + w3 * Voice/Intent Similarity
  + w4 * Constraint Matching

The exact weights should not be arbitrarily chosen.

The planning phase should determine an appropriate scoring architecture.

Possible approaches:

## Approach A — CLIP + Text Embeddings

Use:

- CLIP for image-query relevance
- Sentence Transformers for textual relevance

## Approach B — VLM/LLM Judge

Ask a multimodal model to score:

"How well does this query represent the user's multimodal input?"

with a score between 0 and 1.

## Approach C — Hybrid

Combine:

- image-text similarity
- text semantic similarity
- explicit constraint matching
- optional model-based scoring

Claude Code should evaluate these approaches and select a practical implementation.

The chosen approach should be:

- reproducible
- explainable
- reasonably lightweight
- suitable for an academic project
- practical to run

---

# 12. Diversity Selection

After intentionality scoring, the system should select a smaller set of high-quality queries.

Example:

15 candidate queries
        |
        v
Intentionality filtering
        |
        v
10 relevant queries
        |
        v
MMR diversity selection
        |
        v
5 final suggestions

Use Maximal Marginal Relevance.

Conceptually:

MMR(q) =
    lambda * relevance(q)
    -
    (1 - lambda) * similarity(q, selected_queries)

The goal is to balance:

- relevance
- diversity

The lambda parameter should be configurable.

For example:

MMR_LAMBDA=0.7

should be configurable rather than hardcoded throughout the codebase.

The exact value should be evaluated experimentally.

---

# 13. Query Suggestion UI

The frontend should display the final suggestions clearly.

Example:

Questra

Suggested Queries

--------------------------------------------------

1. Affordable black running shoes similar to this design

[Use Query] [Edit]

--------------------------------------------------

2. Lightweight running shoes with a similar black-and-white style

[Use Query] [Edit]

--------------------------------------------------

3. Comfortable daily running shoes similar to this model

[Use Query] [Edit]

--------------------------------------------------

4. Budget running shoes with a minimalist black design

[Use Query] [Edit]

--------------------------------------------------

5. Sports shoes similar to this pair

[Use Query] [Edit]


Actions:

[Regenerate Suggestions]

[Enter Custom Query]

[Search]

---

# 14. User Feedback

The initial version does not need to train a reinforcement-learning model from user feedback.

However, user interactions should be structured so that they can potentially be collected for future research.

Possible events:

- suggestion_generated
- suggestion_selected
- suggestion_edited
- suggestion_rejected
- suggestion_regenerated
- search_confirmed

Example:

{
  "suggestion_id": "q_003",
  "selected": true,
  "edited": true,
  "final_query": "Affordable black running shoes for daily running",
  "timestamp": "..."
}

This creates a foundation for future reward-model or RL research.

Do not implement RL training unless explicitly requested later.

---

# 15. Search Layer

The search layer should be abstracted behind a provider interface.

Conceptually:

class SearchProvider:
    def search(self, query):
        pass

Possible implementations:

- SerpAPI
- Web Search API
- FAISS
- local document search

The first implementation should use the simplest practical search provider.

The rest of the Questra pipeline should not depend directly on one specific search provider.

---

# 16. Result Reranking

The search provider may return results that are not perfectly ordered.

Use semantic similarity to rerank them.

Pipeline:

Final Query
    |
    v
Sentence Transformer
    |
    v
Query Embedding
    |
    +-------------------+
    |                   |
    v                   v
Result 1             Result N
Embedding            Embedding
    |                   |
    +---------+---------+
              |
              v
      Cosine Similarity
              |
              v
          Reranking
              |
              v
        Final Results

The frontend should display:

- title
- URL/source
- snippet/description
- image if available
- relevance score if useful

---

# 17. API Design

The backend should expose clean REST APIs.

## Health Check

GET /api/health

Response:

{
  "status": "ok"
}

---

## Generate Query Suggestions

POST /api/query/suggestions

Input:

multipart/form-data

Possible fields:

- image
- audio
- text

At least one field must be present.

Example response:

{
  "suggestions": [
    {
      "id": "q1",
      "query": "Affordable black running shoes similar to this design",
      "intent_score": 0.91
    },
    {
      "id": "q2",
      "query": "Lightweight running shoes with a similar style",
      "intent_score": 0.87
    }
  ]
}

Whether internal scoring values should be exposed to the frontend should be decided during implementation.

---

## Search

POST /api/search

Input:

{
  "query": "Affordable black running shoes similar to this design"
}

Response:

{
  "query": "Affordable black running shoes similar to this design",
  "results": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "score": 0.94
    }
  ]
}

---

# 18. Error Handling

The system should handle errors gracefully.

## No Input

Return:

"Please provide an image, voice input, or text."

---

## Invalid Image

Return:

"Unsupported image format."

---

## Invalid Audio

Return:

"Unsupported audio format."

---

## Speech Recognition Failure

If speech recognition fails:

- show a meaningful error
- allow the user to enter text manually
- do not crash the application

---

## Model/API Failure

Return a useful error response instead of exposing internal stack traces.

---

## Search Failure

Display an appropriate message and allow the user to retry.

---

# 19. Configuration

Use environment variables.

Example .env:

GROQ_API_KEY=
SERPAPI_API_KEY=
SEARCH_PROVIDER=
MODEL_NAME=
EMBEDDING_MODEL=
MMR_LAMBDA=
CANDIDATE_COUNT=
SUGGESTION_COUNT=
TOP_K=

Never hardcode API keys.

Create:

.env.example

with placeholder values.

---

# 20. Evaluation

The project should include an evaluation module.

The evaluation should measure at least:

## 20.1 Intentionality

Measure how well generated queries represent the user's intended information need.

Possible metrics:

- relevance score
- human evaluation
- semantic similarity
- DCG if suitable relevance labels are available

---

## 20.2 Diversity

Measure how semantically different the final suggestions are.

Possible metrics:

- average pairwise cosine distance
- pairwise semantic similarity
- diversity score

The final metric should be selected during implementation based on the available evaluation data.

---

## 20.3 Search Quality

Possible metrics:

- Precision@K
- Recall@K
- MRR
- NDCG@K

The final evaluation methodology should be selected based on the available dataset/search environment.

---

# 21. Baselines

Questra should be evaluated against simpler baselines where practical.

## Baseline 1 — Text-only Search

User text
    |
    v
Search

---

## Baseline 2 — Image Caption Search

Image
    |
    v
Image Caption
    |
    v
Search

---

## Baseline 3 — Single Generated Query

Multimodal Input
    |
    v
Query Generation
    |
    v
Single Query
    |
    v
Search

---

## Baseline 4 — Relevance Only

Multimodal Input
    |
    v
Candidate Generation
    |
    v
Intentionality Scoring
    |
    v
Top Queries
    |
    v
Search

No diversity selection.

---

## Proposed Questra

Multimodal Input
    |
    v
Candidate Generation
    |
    v
Intentionality Scoring
    |
    v
MMR Diversity
    |
    v
User Confirmation
    |
    v
Search
    |
    v
Reranking

The comparison should help demonstrate the effect of intentionality and diversity.

---

# 22. Dataset / Evaluation Data

A large dataset is NOT mandatory for the initial working prototype.

For the prototype:

- user-provided images can be used
- manually created test cases can be used
- a small benchmark can be created
- public datasets can be considered for formal evaluation

If a dataset is required for formal evaluation, identify suitable publicly available datasets and document:

- dataset name
- source
- license
- size
- modalities
- relevance to Questra
- preprocessing requirements

Do not download a large dataset automatically without first determining whether it is necessary.

---

# 23. Performance Considerations

The system should avoid unnecessary model/API calls.

Potential optimizations:

- cache embeddings
- reuse image representations
- avoid repeated transcription
- batch embedding computation
- limit candidate generation count
- perform diversity selection locally
- perform reranking locally where possible
- cache repeated search requests where appropriate

Separate:

Expensive operations:

- vision-language model
- speech recognition
- external APIs

from:

Cheap operations:

- cosine similarity
- MMR
- filtering
- sorting
- validation

---

# 24. Security

The backend should:

- validate uploaded files
- restrict file size
- validate MIME types
- avoid storing uploaded files unnecessarily
- never expose API keys
- sanitize user input
- protect endpoints against malformed requests
- clean temporary files after processing

Uploaded images and audio should not be permanently stored unless the application explicitly requires it.

---

# 25. User Experience

The application should have a simple three-stage workflow.

## Stage 1 — Input

Questra

What are you looking for?

[ Upload Image ]

[ Record Voice ]

[ Enter text... ]

[ Generate Queries ]


---

## Stage 2 — Suggestions

Questra

Suggested Queries

1. Affordable black running shoes similar to this design

2. Lightweight running shoes with a similar style

3. Comfortable daily running shoes similar to this model

4. Budget running shoes with a minimalist design

5. Sports shoes similar to this pair

[Edit] [Use Query]

[Regenerate Suggestions]

[Enter Custom Query]

---

## Stage 3 — Search Results

Questra

Search Results

Query:
Affordable black running shoes similar to this design

--------------------------------------------------

Result 1

Title

Description

Source

--------------------------------------------------

Result 2

Title

Description

Source

--------------------------------------------------

Result 3

Title

Description

Source

---

# 26. Important Design Principles

## Principle 1 — Modular Architecture

Each major operation should be independently testable.

Modules should include:

- speech
- vision
- fusion
- candidate generation
- scoring
- diversity
- search
- reranking

Avoid tightly coupling these modules.

---

## Principle 2 — Provider Independence

Do not tightly couple the application to one LLM or search provider.

Use service interfaces where appropriate.

---

## Principle 3 — No Unnecessary Reinforcement Learning

Do not implement reinforcement learning simply because the inspiration paper uses RL.

The initial Questra implementation is inference-oriented.

Future RL training can be added later.

---

## Principle 4 — Human-in-the-Loop

Generated queries are suggestions.

The user must be able to:

- inspect
- modify
- reject
- select
- confirm

a query.

The system should not silently decide the final query on behalf of the user.

---

## Principle 5 — Explainability

Where practical, provide information about why a query was selected.

For example:

- high visual relevance
- matches user's stated intent
- satisfies constraints
- sufficiently different from other suggestions

This explanation should not clutter the primary UI.

---

## Principle 6 — Reproducibility

Important parameters should be configurable.

For example:

- candidate count
- final suggestion count
- MMR lambda
- embedding model
- search provider
- model name

Do not bury these values inside unrelated source files.

---

# 27. Future Extensions

## 27.1 Reinforcement Learning

User interaction data can eventually be used to train:

- reward models
- policy models
- query ranking policies

Possible future flow:

Generated Query
      |
      v
User Selection
      |
      v
Reward Signal
      |
      v
Future Query Ranking

---

## 27.2 Personalized Query Suggestions

Future versions can learn from:

- previous searches
- selected queries
- edited queries
- user preferences

---

## 27.3 Multimodal Retrieval

The initial system may convert multimodal input into textual queries.

Future versions could support direct multimodal retrieval:

Image
    |
    v
Multimodal Embedding
    |
    v
Multimodal Search

instead of:

Image
    |
    v
Text Generation
    |
    v
Text Search

---

## 27.4 Conversational Search

Future versions can support iterative search refinement.

Example:

User:
"Show me shoes like this."

Questra:
"Here are some query suggestions."

User:
"Make them more affordable."

Questra:
"Here are refined suggestions."

User:
"Only running shoes."

Questra:
"Here are further refined suggestions."

---

## 27.5 Feedback-Based Learning

User selections and edits can eventually become reward signals.

This could enable future research into:

- RLHF
- preference learning
- query ranking
- personalized search

---

# 28. Non-Goals for Version 1

Version 1 should NOT attempt to:

- reproduce the complete research paper
- train a multimodal foundation model
- train PPO from scratch
- train RewardNet from scratch
- train PolicyNet from scratch
- train REINFORCE from scratch
- perform large-scale RLHF
- build a large-scale search engine
- crawl the entire web
- build a custom vector database unless actually required
- introduce unnecessary microservices
- introduce Kubernetes unless deployment requires it
- build a large distributed system

The priority is a working, explainable, research-oriented prototype.

---

# 29. Suggested Development Phases

## Phase 1 — Project Setup

Set up:

- FastAPI backend
- React/Vite frontend
- environment configuration
- project structure
- API communication
- basic health check

---

## Phase 2 — Input Layer

Implement:

- image upload
- text input
- voice recording/upload
- input validation

---

## Phase 3 — Speech Processing

Implement:

- speech-to-text
- transcript handling
- error handling

---

## Phase 4 — Vision Processing

Implement:

- image validation
- image processing
- vision-language model integration
- visual description generation

---

## Phase 5 — Multimodal Fusion

Implement:

- modality normalization
- structured multimodal context
- fusion pipeline

---

## Phase 6 — Candidate Generation

Implement:

- candidate query generation
- configurable candidate count
- structured JSON output
- duplicate filtering

---

## Phase 7 — Intentionality Scoring

Implement the selected relevance/intentionality architecture.

Evaluate:

- image-query relevance
- text-query relevance
- constraint matching
- multimodal consistency

---

## Phase 8 — Diversity Selection

Implement:

- Sentence Transformer embeddings
- cosine similarity
- MMR
- configurable lambda
- final suggestion selection

---

## Phase 9 — Suggestion UI

Implement:

- query suggestion cards
- query selection
- query editing
- regeneration
- custom query input
- confirmation

---

## Phase 10 — Search

Implement:

- search provider abstraction
- first search provider
- result normalization

---

## Phase 11 — Reranking

Implement:

- result embeddings
- query embedding
- semantic similarity
- result reranking
- top-K selection

---

## Phase 12 — Evaluation

Implement:

- intentionality metrics
- diversity metrics
- search metrics
- baseline comparisons

---

## Phase 13 — Testing

Create:

- unit tests
- API tests
- pipeline tests
- frontend tests where practical
- end-to-end tests

---

## Phase 14 — Deployment

Prepare:

- production configuration
- environment variables
- backend deployment
- frontend deployment
- CORS configuration
- API URL configuration
- error logging

---

# 30. Testing Requirements

The project should contain tests for each major component.

Examples:

## Fusion

Test:

- image only
- voice only
- text only
- image + voice
- image + text
- voice + text
- image + voice + text

---

## Candidate Generation

Test:

- valid model output
- malformed model output
- duplicate queries
- empty queries
- unsupported claims

---

## Intentionality

Test:

- high relevance query
- low relevance query
- missing modality
- constraint matching

---

## Diversity

Test:

- duplicate queries
- highly similar queries
- unrelated queries
- different MMR lambda values

---

## Search

Test:

- successful search
- empty results
- API failure
- timeout
- invalid query

---

## Reranking

Test:

- correct similarity ordering
- empty result set
- malformed result
- missing description

---

# 31. Logging

The backend should provide useful structured logs.

Log events such as:

- request received
- modalities detected
- speech transcription completed
- vision processing completed
- candidate generation completed
- scoring completed
- diversity selection completed
- search completed
- reranking completed
- errors

Do not log:

- API keys
- sensitive user data
- unnecessary raw uploaded files

---

# 32. API Response Design

API responses should be consistent.

Success example:

{
  "success": true,
  "data": {
    "suggestions": []
  }
}

Error example:

{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please provide an image, voice input, or text."
  }
}

Claude Code should decide whether a different response envelope is more appropriate, but the API should remain consistent.

---

# 33. Model Abstraction

AI models should be accessed through service classes/interfaces rather than directly from API routes.

For example:

VisionService
    |
    +-- GroqVisionService
    +-- LocalVisionService

SpeechService
    |
    +-- WhisperService
    +-- GroqWhisperService

EmbeddingService
    |
    +-- SentenceTransformerService

This should make it possible to change models without rewriting the API layer.

Do not over-engineer this abstraction if only one implementation is needed.

---

# 34. Data Flow

Complete data flow:

User
 |
 +---- Image
 |
 +---- Voice
 |
 +---- Text
 |
 v
Frontend
 |
 v
FastAPI
 |
 +----------------+
 |                |
 v                v
Image          Voice
Processing     Processing
 |                |
 v                v
Vision         Transcript
Context           |
 |                |
 +-------+--------+
         |
         v
    Text Input
         |
         v
Multimodal Fusion
         |
         v
Unified Context
         |
         v
Candidate Generation
         |
         v
10–15 Candidate Queries
         |
         v
Intentionality Scoring
         |
         v
Relevant Candidate Set
         |
         v
Sentence Embeddings
         |
         v
MMR Diversity Selection
         |
         v
Final Query Suggestions
         |
         v
User Selection / Editing
         |
         v
Final Query
         |
         v
Search Provider
         |
         v
Initial Results
         |
         v
Result Embeddings
         |
         v
Semantic Reranking
         |
         v
Top-K Results
         |
         v
Frontend
         |
         v
User

---

# 35. Example End-to-End Scenario

User uploads:

An image of a black running shoe.

Voice:

"I want something similar for daily running."

Text:

"Under 5000 rupees."

---

## Vision Processing

Output:

"Black athletic running shoe with white sole and mesh upper."

---

## Speech Processing

Output:

"I want something similar for daily running."

---

## Fusion

Unified context:

Visual:
Black athletic running shoe with white sole and mesh upper.

Intent:
Find a similar shoe suitable for daily running.

Constraint:
Budget under 5000 rupees.

---

## Candidate Generation

Generate:

1. Affordable black running shoes similar to this design
2. Lightweight running shoes with a similar black and white style
3. Comfortable daily running shoes similar to this model
4. Budget running shoes with a minimalist black design
5. Sports shoes similar to this pair under 5000 rupees
6. Black running shoes for everyday training under 5000
7. Affordable athletic shoes with a similar mesh upper
8. Daily running shoes with a similar low-top design
9. Budget-friendly black sports shoes with white soles
10. Comfortable running shoes similar to this style

---

## Intentionality Scoring

Score each candidate according to its relevance to:

- image
- running intent
- budget
- visual characteristics

---

## Diversity Selection

MMR removes redundant candidates and selects diverse suggestions.

Final suggestions may include:

1. Affordable black running shoes similar to this design
2. Lightweight running shoes with a similar black and white style
3. Comfortable daily running shoes under 5000 rupees
4. Running shoes with a similar mesh upper
5. Budget-friendly sports shoes with a similar design

---

## User Confirmation

User selects:

"Comfortable daily running shoes under 5000 rupees"

The user can edit it to:

"Comfortable black daily running shoes under 5000 rupees"

---

## Search

The final query is sent to the search provider.

---

## Reranking

Search results are semantically compared with the final query.

The highest-relevance results are placed first.

---

# 36. Research Contribution

The project should clearly explain its contribution as an engineering/research prototype rather than claiming to reproduce the original paper.

Potential contribution:

Questra demonstrates a practical multimodal query discovery pipeline that combines:

- multimodal input
- intent-aware candidate generation
- semantic intentionality scoring
- diversity-aware query selection using MMR
- human-in-the-loop query refinement
- semantic result reranking

The system provides a practical alternative to implementing the complete RL-based architecture from the inspiration paper.

---

# 37. Expected Final Architecture

The final architecture should approximately follow:

                    QUESTRA

        +---------------------------+
        |       USER INPUT          |
        +---------------------------+
             |       |       |
             v       v       v
          IMAGE    VOICE    TEXT
             |       |       |
             v       v       |
          Vision   Speech    |
          Model    to Text   |
             |       |       |
             +-------+-------+
                     |
                     v
             MULTIMODAL FUSION
                     |
                     v
             UNIFIED INTENT
                     |
                     v
          CANDIDATE GENERATION
                     |
                     v
              10–15 QUERIES
                     |
                     v
          INTENTIONALITY SCORING
                     |
                     v
          SEMANTIC EMBEDDINGS
                     |
                     v
             MMR DIVERSITY
                     |
                     v
          3–5 QUERY SUGGESTIONS
                     |
                     v
             USER CONFIRMATION
                /    |    \
               /     |     \
            Select  Edit   Custom
               \      |      /
                \     |     /
                 v    v    v
                  FINAL QUERY
                       |
                       v
                     SEARCH
                       |
                       v
               INITIAL RESULTS
                       |
                       v
               SEMANTIC RERANKING
                       |
                       v
                  TOP-K RESULTS
                       |
                       v
                  USER INTERFACE

---

# 38. Definition of Done

Questra Version 1 is considered complete when:

- [ ] React/Vite frontend runs successfully.
- [ ] FastAPI backend runs successfully.
- [ ] User can upload an image.
- [ ] User can provide voice input.
- [ ] User can provide text.
- [ ] Multiple modalities can be used together.
- [ ] Voice can be converted to text.
- [ ] Image information can be extracted.
- [ ] Multimodal context is constructed.
- [ ] Candidate queries are generated.
- [ ] Candidate queries receive relevance/intentionality scores.
- [ ] Redundant queries are removed.
- [ ] MMR/diversity selection works.
- [ ] Final suggestions are displayed.
- [ ] User can edit a suggestion.
- [ ] User can select a suggestion.
- [ ] User can enter a custom query.
- [ ] User can regenerate suggestions.
- [ ] User can confirm the final query.
- [ ] Search is performed.
- [ ] Search results are retrieved.
- [ ] Results are semantically reranked.
- [ ] Results are displayed in the frontend.
- [ ] Errors are handled gracefully.
- [ ] API keys are stored securely.
- [ ] Basic unit tests exist.
- [ ] API tests exist.
- [ ] Pipeline tests exist.
- [ ] Evaluation metrics are implemented.
- [ ] Baseline comparison is possible.
- [ ] Project documentation explains the architecture.
- [ ] The implementation clearly distinguishes Questra from the original RL-based research approach.

---

# 39. Instructions for Claude Code

IMPORTANT:

Do NOT immediately start implementing the entire project.

First study this idea.md and understand the complete system.

Before writing major implementation code, Claude Code should produce a detailed implementation plan.

The plan must contain:

1. Final architecture
2. Technology choices
3. Model choices
4. Directory structure
5. Backend implementation plan
6. Frontend implementation plan
7. AI/ML pipeline
8. Multimodal fusion strategy
9. Candidate generation strategy
10. Intentionality scoring strategy
11. Diversity/MMR strategy
12. Search architecture
13. Reranking architecture
14. API contracts
15. Configuration
16. Evaluation strategy
17. Dataset requirements
18. Testing strategy
19. Deployment strategy
20. Potential risks
21. Fallback implementations
22. Development phases

For every major technology/model choice, explain:

- why it is needed
- alternatives
- advantages
- disadvantages
- expected computational requirements
- whether it requires an external API
- whether it can run locally

Do not introduce technologies simply because they are popular.

Prefer a simple, modular architecture.

---

# 40. Claude Code Planning Rules

Follow these rules while planning the implementation.

## Rule 1

Do not reproduce the original paper's RL training pipeline unless explicitly requested.

---

## Rule 2

Do not assume a large dataset is required.

First determine what can be implemented without a dataset.

---

## Rule 3

Do not build a custom vector database unless there is a demonstrated requirement.

---

## Rule 4

Do not create unnecessary microservices.

A modular FastAPI backend is sufficient.

---

## Rule 5

Keep AI providers replaceable.

Avoid tightly coupling business logic to one provider.

---

## Rule 6

Keep model/API calls centralized.

Do not call external AI APIs directly from multiple unrelated modules.

---

## Rule 7

Do not expose API keys to the frontend.

---

## Rule 8

Do not store user-uploaded media permanently unless required.

---

## Rule 9

Do not automatically implement every future extension.

Focus on Version 1.

---

## Rule 10

Prioritize a working end-to-end pipeline before optimization.

---

# 41. First Claude Code Task

The first task is ONLY to analyze and plan the project.

Claude Code should:

1. Read this entire file.
2. Understand the project objectives.
3. Identify the major technical components.
4. Identify dependencies.
5. Evaluate model options.
6. Evaluate search options.
7. Evaluate intentionality scoring approaches.
8. Evaluate MMR implementation.
9. Design the backend.
10. Design the frontend.
11. Design API contracts.
12. Design evaluation.
13. Identify risks.
14. Produce a detailed implementation plan.

Do not make large-scale code changes until the plan is reviewed.

---

# 42. Final Project Definition

Questra is a multimodal query discovery and information retrieval system.

It accepts:

Image + Voice + Text

and transforms them into:

Multimodal Intent
        |
        v
Candidate Queries
        |
        v
Intentionality
        +
Diversity
        |
        v
Query Suggestions
        |
        v
Human Confirmation
        |
        v
Search
        |
        v
Semantic Reranking
        |
        v
Relevant Results

The central idea is:

"Help users discover better search queries from multimodal inputs by balancing relevance, intentionality, and diversity before retrieval."

Questra is inspired by multimodal query suggestion research but implements a practical inference-based architecture rather than reproducing the original reinforcement learning system.