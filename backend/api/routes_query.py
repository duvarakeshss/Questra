from fastapi import APIRouter, File, Form, UploadFile

from errors import NoInputError, ScoringFailedError
from models.schemas import SuggestionResponse
from pipeline.candidate_gen import generate_candidates
from pipeline.diversity import select_diverse
from pipeline.fusion import fuse_modalities
from pipeline.scoring import score_candidates
from pipeline.speech import process_audio
from pipeline.vision import process_image

router = APIRouter()


@router.post("/query/suggestions", response_model=SuggestionResponse)
async def query_suggestions(
    image: UploadFile | None = File(default=None),
    audio: UploadFile | None = File(default=None),
    text: str | None = Form(default=None),
) -> SuggestionResponse:
    if image is None and audio is None and not (text and text.strip()):
        raise NoInputError("At least one input (image, audio, or text) is required.")

    image_description = None
    voice_transcript = None

    if image is not None:
        image_bytes = await image.read()
        image_description = process_image(image_bytes, image.filename or "", image.content_type)

    if audio is not None:
        audio_bytes = await audio.read()
        voice_transcript = process_audio(audio_bytes, audio.filename or "", audio.content_type)

    context = fuse_modalities(
        image_description=image_description,
        voice_transcript=voice_transcript,
        text_input=text,
    )

    queries = generate_candidates(context)
    candidates = score_candidates(context, queries)
    if not candidates:
        raise ScoringFailedError("No candidate queries met the relevance threshold.")

    suggestions = select_diverse(candidates)
    return SuggestionResponse(success=True, suggestions=suggestions, context=context)
