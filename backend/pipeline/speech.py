import os

from config.settings import settings
from errors import FileTooLargeError, InvalidFileTypeError
from services.llm_service import llm_service

ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".webm", ".ogg", ".mpga", ".mpeg", ".mp4"}


def _validate_audio(filename: str | None, mime_type: str | None, size: int) -> None:
    if size > settings.max_audio_size_mb * 1024 * 1024:
        raise FileTooLargeError(f"Audio exceeds the {settings.max_audio_size_mb} MB limit.")

    extension = os.path.splitext(filename or "")[1].lower()
    valid_extension = extension in ALLOWED_AUDIO_EXTENSIONS
    valid_mime = bool(mime_type) and mime_type.startswith("audio/")
    if not valid_extension and not valid_mime:
        raise InvalidFileTypeError("Unsupported audio format.")


def process_audio(audio_bytes: bytes, filename: str, mime_type: str | None = None) -> str:
    if not audio_bytes:
        raise InvalidFileTypeError("Unsupported audio format.")

    _validate_audio(filename, mime_type, len(audio_bytes))
    return llm_service.transcribe_audio(audio_bytes, filename)
