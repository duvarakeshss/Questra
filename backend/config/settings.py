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

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_publishable_key: str = ""
    supabase_secret_key: str = ""
    supabase_usage_table: str = "query_usage"
    database_url: str = ""

    vision_model: str = "qwen/qwen3.8-27b"
    generation_model: str = "openai/gpt-oss-120b"
    whisper_model: str = "whisper-large-v3"
    embedding_model: str = "all-MiniLM-L6-v2"

    candidate_count: int = 12
    suggestion_count: int = 5
    mmr_lambda: float = 0.7
    search_top_k: int = 10
    rerank_top_k: int = 5

    max_image_size_mb: int = 10
    max_audio_size_mb: int = 25

    anonymous_free_queries: int = 2
    quota_window_hours: int = 24

    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def supabase_public_key(self) -> str:
        """Public (browser-safe) key. New projects call it the publishable key."""
        return self.supabase_anon_key or self.supabase_publishable_key

    @property
    def supabase_admin_key(self) -> str:
        """Service-role key. Backend only. New projects call it the secret key."""
        return self.supabase_service_role_key or self.supabase_secret_key


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
