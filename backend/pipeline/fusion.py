from errors import NoInputError
from models.schemas import MultimodalContext


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    return value or None


def fuse_modalities(
    image_description: str | None = None,
    voice_transcript: str | None = None,
    text_input: str | None = None,
) -> MultimodalContext:
    context = MultimodalContext(
        image_description=_clean(image_description),
        voice_transcript=_clean(voice_transcript),
        text_input=_clean(text_input),
    )
    if not any([context.image_description, context.voice_transcript, context.text_input]):
        raise NoInputError("At least one input (image, audio, or text) is required.")
    return context


def build_context_prompt(context: MultimodalContext) -> str:
    lines = []
    if context.image_description:
        lines.append(f"Visual context: {context.image_description}")
    if context.voice_transcript:
        lines.append(f"Voice input: {context.voice_transcript}")
    if context.text_input:
        lines.append(f"Text input: {context.text_input}")
    return "\n".join(lines)
