import os

from config.settings import settings
from errors import FileTooLargeError, InvalidFileTypeError
from services.llm_service import llm_service

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

IMAGE_DESCRIPTION_PROMPT = (
    "Describe this image in detail for search purposes. Focus on: object type, color, "
    "shape, style, brand indicators, material, and any distinguishing features. "
    "Return a single concise descriptive paragraph."
)


def _validate_image(filename: str | None, mime_type: str | None, size: int) -> str:
    if size > settings.max_image_size_mb * 1024 * 1024:
        raise FileTooLargeError(f"Image exceeds the {settings.max_image_size_mb} MB limit.")

    extension = os.path.splitext(filename or "")[1].lower()
    valid_extension = extension in ALLOWED_IMAGE_EXTENSIONS
    valid_mime = bool(mime_type) and mime_type.startswith("image/")
    if not valid_extension and not valid_mime:
        raise InvalidFileTypeError("Unsupported image format.")

    if mime_type and mime_type.startswith("image/"):
        return mime_type
    suffix = extension.lstrip(".") or "jpeg"
    if suffix == "jpg":
        suffix = "jpeg"
    return f"image/{suffix}"


def process_image(image_bytes: bytes, filename: str, mime_type: str | None = None) -> str:
    if not image_bytes:
        raise InvalidFileTypeError("Unsupported image format.")

    resolved_mime = _validate_image(filename, mime_type, len(image_bytes))
    return llm_service.describe_image(image_bytes, resolved_mime, IMAGE_DESCRIPTION_PROMPT)
