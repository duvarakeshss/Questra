# Questra --- Frontend Implementation

## Stack

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

## Main stages

``` text
input → suggestions → results
```

## Suggested component tree

``` text
src/
├── components/
│   ├── QuestraLogo.tsx
│   ├── SearchCanvas.tsx
│   ├── ImageUploader.tsx
│   ├── VoiceRecorder.tsx
│   ├── SuggestionCard.tsx
│   ├── SuggestionList.tsx
│   ├── QueryEditor.tsx
│   ├── SearchResult.tsx
│   ├── SearchResultList.tsx
│   ├── SourceReader.tsx
│   └── RelevanceIndicator.tsx
├── pages/
│   └── SearchPage.tsx
├── services/
│   └── api.ts
└── types/
    └── api.ts
```

## Search canvas

The homepage should feel like a multimodal search workspace rather than
a chatbot.

Support:

-   drag-and-drop image
-   image preview
-   voice recording
-   text
-   remove input
-   search action

## Suggestions

Use an "Explore your intent" section.

Each card should contain:

-   intent category
-   query
-   short explanation
-   explore action

Suggestions should feel like branching search directions.

## Results

Desktop layout:

``` text
┌─────────────┬─────────────────────────┬─────────────────┐
│ Query       │ Ranked Results          │ Explore         │
│ Context     │                         │ Further         │
│ Filters     │ Result 1                │ Related topics  │
│             │ Result 2                │ Search path     │
└─────────────┴─────────────────────────┴─────────────────┘
```

## State

Use React `useState`:

``` text
stage: input | suggestions | results
suggestions
results
loading
loadingMessage
error
```

No external state library is necessary.

## Voice

Use the browser `MediaRecorder`.

Show:

-   recording state
-   timer
-   stop
-   retry/remove
-   upload-audio fallback

## Loading messages

Prefer meaningful progress:

``` text
Understanding your image...
Listening to your voice...
Combining your search context...
Exploring possible search directions...
Ranking search results...
```

## Accessibility

Include:

-   keyboard navigation
-   visible focus
-   labels
-   image alt text
-   adequate contrast
-   non-color-only status indicators
