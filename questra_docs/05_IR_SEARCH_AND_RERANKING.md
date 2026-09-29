# Questra --- IR Search and Reranking

## Search objective

After the user selects or edits a query, Questra retrieves web
information and reorders the returned results using semantic similarity.

There is no LLM-generated final answer.

## Pipeline

``` text
Confirmed query
 ↓
SerpAPI
 ↓
Raw search results
 ↓
Normalize
 ↓
Embed query
 ↓
Embed snippets
 ↓
Cosine similarity
 ↓
Sort
 ↓
Top 5 results
```

## Retrieval

SerpAPI provides structured Google search results.

The provider-specific response must be converted into the Questra
`SearchResult` model:

``` python
class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    score: float
    thumbnail: str | None = None
```

## Semantic reranking

Use:

``` text
sentence-transformers/all-MiniLM-L6-v2
```

Calculate:

``` text
similarity =
cosine_similarity(query_embedding, snippet_embedding)
```

Then sort by descending similarity.

## Example

Query:

``` text
Why does a bicycle chain frequently break?
```

The reranker should move highly relevant maintenance/repair pages above
pages that only mention bicycles generally.

## UI output

Each result should show:

-   source/domain
-   title
-   relevant snippet
-   semantic relevance score
-   open-source action

A source reader can show the retrieved passage without fabricating an
answer.

## Optional future IR improvements

-   BM25 on a local corpus
-   hybrid BM25 + dense retrieval
-   rank fusion
-   query expansion
-   learning-to-rank
-   formal relevance judgments

These are extensions, not prerequisites for the first prototype.
