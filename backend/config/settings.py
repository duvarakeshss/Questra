from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    groq_api_key: str = ""
    serpapi_api_key: str = ""

    vision_model: str = "llama-4-scout-17b-16e-instruct"
    generation_model: str = "llama-3.3-70b-versatile"
    whisper_model: str = "whisper-large-v3"
    embedding_model: str = "all-MiniLM-L6-v2"

    candidate_count: int = 12
    suggestion_count: int = 5
    mmr_lambda: float = 0.7
    search_top_k: int = 10
    rerank_top_k: int = 5

    max_image_size_mb: int = 10
    max_audio_size_mb: int = 25

    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
