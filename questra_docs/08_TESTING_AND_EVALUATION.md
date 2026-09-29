# Questra --- Testing and Evaluation

## Unit testing

Mock Groq and SerpAPI.

### Fusion

Test all seven valid modality combinations plus the no-input case.

### Candidate generation

Test:

-   valid output
-   malformed output
-   duplicate queries
-   empty output

### Scoring

Test:

-   valid 0--1 scores
-   malformed scores
-   missing candidates

### MMR

Test:

-   lambda = 0
-   lambda = 1
-   lambda = 0.7
-   duplicates
-   fewer candidates than requested

### Reranking

Test:

-   correct ordering
-   empty results
-   missing snippets

### Search normalization

Test:

-   normal results
-   empty results
-   provider failure

## Integration test

Mock all external services and test:

``` text
input
 ↓
fusion
 ↓
generation
 ↓
scoring
 ↓
MMR
 ↓
search
 ↓
reranking
 ↓
response
```

## Manual evaluation

Use realistic examples:

-   product image + budget
-   screenshot + question
-   travel image + preference
-   technical diagram + constraint
-   clothing image + voice requirement

Check:

1.  Does the query preserve the input intent?
2.  Are suggestions diverse?
3.  Are search results relevant?
4.  Does reranking improve ordering?

## Optional formal IR evaluation

A training dataset is not required.

If formal evaluation is needed later, create a small query-result
relevance set:

``` text
2 = highly relevant
1 = partially relevant
0 = irrelevant
```

Calculate:

-   Precision@K
-   Recall@K
-   MRR
-   NDCG@K

Compare provider ranking against Questra semantic reranking.

## Ablation studies

Useful comparisons:

A. text-only search

B. query generation without MMR

C. query generation + MMR

D. provider ranking

E. provider ranking + semantic reranking

## Performance

Measure:

-   image-processing latency
-   speech latency
-   query-generation latency
-   scoring latency
-   search latency
-   reranking latency
-   total latency
