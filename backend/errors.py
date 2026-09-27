class QuestraError(Exception):
    code = "ERROR"
    status_code = 500

    def __init__(self, message: str | None = None) -> None:
        self.message = message or self.code
        super().__init__(self.message)


class NoInputError(QuestraError):
    code = "NO_INPUT"
    status_code = 400


class InvalidFileTypeError(QuestraError):
    code = "INVALID_FILE_TYPE"
    status_code = 400


class FileTooLargeError(QuestraError):
    code = "FILE_TOO_LARGE"
    status_code = 400


class EmptyQueryError(QuestraError):
    code = "EMPTY_QUERY"
    status_code = 400


class LLMError(QuestraError):
    code = "LLM_ERROR"
    status_code = 502


class SearchError(QuestraError):
    code = "SEARCH_ERROR"
    status_code = 502


class GenerationFailedError(QuestraError):
    code = "GENERATION_FAILED"
    status_code = 500


class ScoringFailedError(QuestraError):
    code = "SCORING_FAILED"
    status_code = 500
