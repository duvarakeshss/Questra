import base64
import json
import time
from typing import Any

from groq import Groq

from config.settings import settings
from errors import LLMError

_RETRIES = 3
_BACKOFF_SECONDS = 1.5


class LLMService:
    def __init__(self) -> None:
        self._client: Groq | None = None

    @property
    def client(self) -> Groq:
        if not settings.groq_api_key:
            raise LLMError("GROQ_API_KEY is not configured")
        if self._client is None:
            self._client = Groq(api_key=settings.groq_api_key)
        return self._client

    def _with_retries(self, fn, *args: Any, **kwargs: Any) -> Any:
        last_error: Exception | None = None
        for attempt in range(_RETRIES):
            try:
                return fn(*args, **kwargs)
            except Exception as error:  # noqa: BLE001 - normalize to LLMError
                last_error = error
                if attempt < _RETRIES - 1:
                    time.sleep(_BACKOFF_SECONDS * (attempt + 1))
        raise LLMError(f"Groq request failed: {last_error}")

    def transcribe_audio(self, audio_bytes: bytes, filename: str) -> str:
        def call() -> Any:
            return self.client.audio.transcriptions.create(
                file=(filename, audio_bytes),
                model=settings.whisper_model,
                response_format="text",
            )

        result = self._with_retries(call)
        if isinstance(result, str):
            return result.strip()
        return getattr(result, "text", "").strip()

    def describe_image(self, image_bytes: bytes, mime_type: str, prompt: str) -> str:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        data_uri = f"data:{mime_type};base64,{encoded}"
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": data_uri}},
                ],
            }
        ]

        def call() -> Any:
            return self.client.chat.completions.create(
                model=settings.vision_model,
                messages=messages,
                temperature=0.2,
            )

        response = self._with_retries(call)
        return response.choices[0].message.content.strip()

    def complete_text(self, messages: list[dict], model: str | None = None, temperature: float = 0.4) -> str:
        def call() -> Any:
            return self.client.chat.completions.create(
                model=model or settings.generation_model,
                messages=messages,
                temperature=temperature,
            )

        response = self._with_retries(call)
        return response.choices[0].message.content.strip()

    def complete_json(self, messages: list[dict], model: str | None = None, temperature: float = 0.4) -> dict:
        def call() -> Any:
            return self.client.chat.completions.create(
                model=model or settings.generation_model,
                messages=messages,
                temperature=temperature,
                response_format={"type": "json_object"},
            )

        response = self._with_retries(call)
        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except (json.JSONDecodeError, TypeError) as error:
            raise LLMError(f"Model did not return valid JSON: {error}") from error


llm_service = LLMService()
