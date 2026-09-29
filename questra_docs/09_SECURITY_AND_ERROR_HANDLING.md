# Questra --- Security and Error Handling

## API keys

Never hardcode API keys.

Use `.env` and Pydantic Settings.

Create `.env.example` with placeholders.

Never expose keys to the React frontend.

## Uploaded media

-   validate MIME type
-   validate size
-   process temporarily
-   do not permanently store media
-   clean temporary resources

## Prompt safety

User input must be inserted into structured prompts. Do not allow raw
user content to replace system instructions.

## Logging

Never log:

-   API keys
-   raw uploaded media
-   unnecessary private transcripts
-   sensitive user data

Log useful diagnostics such as request ID, stage, latency, and error
code.

## Provider failures

Map external failures to controlled application errors.

Example:

``` text
Groq timeout → LLM_ERROR → HTTP 502
SerpAPI failure → SEARCH_ERROR → HTTP 502
```

Do not expose stack traces.

## Retry policy

Retry only transient failures, with bounded backoff.

Do not retry invalid input or authentication errors.

## Limits

``` text
MAX_IMAGE_SIZE_MB = 10
MAX_AUDIO_SIZE_MB = 25
```

Also use reasonable request and provider timeouts.

## Data storage

The approved prototype has no persistent user data, accounts, or
database requirement.
