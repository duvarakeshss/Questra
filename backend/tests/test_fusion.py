import pytest

from errors import NoInputError
from pipeline.fusion import build_context_prompt, fuse_modalities


def test_all_seven_combinations():
    image = "black running shoe"
    voice = "something for running"
    text = "under 5000 rupees"

    assert fuse_modalities(image_description=image).image_description == image
    assert fuse_modalities(voice_transcript=voice).voice_transcript == voice
    assert fuse_modalities(text_input=text).text_input == text

    both_iv = fuse_modalities(image_description=image, voice_transcript=voice)
    assert both_iv.image_description == image and both_iv.voice_transcript == voice

    both_it = fuse_modalities(image_description=image, text_input=text)
    assert both_it.image_description == image and both_it.text_input == text

    both_vt = fuse_modalities(voice_transcript=voice, text_input=text)
    assert both_vt.voice_transcript == voice and both_vt.text_input == text

    all_three = fuse_modalities(image, voice, text)
    assert all_three.image_description == image
    assert all_three.voice_transcript == voice
    assert all_three.text_input == text


def test_missing_all_modalities_raises():
    with pytest.raises(NoInputError):
        fuse_modalities()


def test_blank_strings_are_treated_as_missing():
    with pytest.raises(NoInputError):
        fuse_modalities(image_description="   ", voice_transcript="", text_input=None)


def test_build_context_prompt_includes_available_modalities():
    context = fuse_modalities(image_description="a red bag", text_input="under $50")
    prompt = build_context_prompt(context)
    assert "a red bag" in prompt
    assert "under $50" in prompt
