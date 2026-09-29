# Questra --- API Specification

Base path:

``` text
/api
```

## GET `/api/health`

Response:

``` json
{
  "status": "ok",
  "models_loaded": true
}
```

## POST `/api/query/suggestions`

Content type:

``` text
multipart/form-data
```

Fields:

``` text
image  optional
audio  optional
text   optional
```

At least one must be present.

### Image

Allowed:

``` text
jpeg, png, webp, gif
```

Maximum:

``` text
10 MB
```

### Audio

Allowed:

``` text
wav, mp3, m4a, webm, ogg
```

Maximum:

``` text
25 MB
```

### Response

``` json
{
  "success": true,
  "suggestions": [
    {
      "id": "uuid",
      "query": "bicycle chain repair guide",
      "intent_score": 0.94,
      "diversity_rank": 1
    }
  ],
  "context": {
    "image_description": "...",
    "voice_transcript": "...",
    "text_input": "..."
  }
}
```

## POST `/api/search`

Request:

``` json
{
  "query": "bicycle chain repair guide"
}
```

Response:

``` json
{
  "success": true,
  "query": "bicycle chain repair guide",
  "results": [
    {
      "title": "Example",
      "url": "https://example.com",
      "snippet": "Relevant information...",
      "score": 0.89,
      "thumbnail": null
    }
  ]
}
```

## Error format

``` json
{
  "success": false,
  "error": {
    "code": "NO_INPUT",
    "message": "At least one input is required"
  }
}
```

## Error codes

-   `NO_INPUT` --- 400
-   `INVALID_FILE_TYPE` --- 400
-   `FILE_TOO_LARGE` --- 400
-   `EMPTY_QUERY` --- 400
-   `LLM_ERROR` --- 502
-   `SEARCH_ERROR` --- 502
-   `GENERATION_FAILED` --- 500
-   `SCORING_FAILED` --- 500
