# Questra --- Multimodal Query Pipeline

## Purpose

The pipeline turns ambiguous multimodal input into intentional, diverse
search queries that the user can inspect before searching.

## Supported inputs

-   Image
-   Voice
-   Text

Any combination is allowed, but at least one input is required.

## Example

``` text
Image:
red leather crossbody bag

Voice:
I want something similar but cheaper

Text:
under 5000 rupees
```

The fused context should preserve all three pieces of information.

## Candidate generation

Generate around 12 candidates.

The candidates should cover different intents rather than being simple
paraphrases.

Example:

``` text
red leather crossbody bags under 5000 rupees
similar affordable red leather crossbody bags
red leather sling bags under 5000
best alternatives to red leather crossbody bags
where to buy red leather crossbody bags under 5000
```

## Intentionality scoring

Score each candidate between 0 and 1 based on:

-   visual object
-   visible attributes
-   spoken constraints
-   typed constraints
-   requested action
-   specificity

## MMR

Use:

``` text
MMR(q) = λ × intent_score(q)
         - (1 - λ) × max_similarity(q, selected)
```

Default:

``` text
λ = 0.7
```

Similarity is computed using Sentence Transformer embeddings.

## Selection

1.  Select the candidate with the highest intent score.
2.  Calculate MMR for all remaining candidates.
3.  Select the highest MMR candidate.
4.  Repeat until 3--5 suggestions exist.

## User control

The user can:

-   click a suggestion
-   edit it
-   type a custom query
-   return to the previous stage

The selected query becomes the search request.

## Important

The suggestion model does not directly answer the user's question. Its
job is query understanding and query formulation.
