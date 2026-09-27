from evaluation.harness import BenchmarkCase

# A small illustrative benchmark (idea.md §22: a large dataset is not required).
# Intentionality and diversity are label-free, so these cases compare the systems
# out of the box. To also score search quality, attach ground-truth `relevant_urls`
# (and optionally `relevance_grades`) gathered from a live run.
SAMPLE_BENCHMARK: list[BenchmarkCase] = [
    BenchmarkCase(
        id="sample-running-shoe",
        image_description="Black athletic running shoe with a white sole, low-top design and mesh upper.",
        voice_transcript="I want something similar but suitable for daily running.",
        text_input="budget under 5000 rupees",
    ),
    BenchmarkCase(
        id="sample-desk-lamp",
        image_description="Brushed brass desk lamp with an adjustable articulated arm and a matte black shade.",
        text_input="under 80 dollars, warm white light",
    ),
]
