from serpapi import GoogleSearch

from config.settings import settings
from errors import SearchError


class SearchService:
    def search(self, query: str, num_results: int) -> list[dict]:
        if not settings.serpapi_api_key:
            raise SearchError("SERPAPI_API_KEY is not configured")

        params = {
            "engine": "google",
            "q": query,
            "num": num_results,
            "api_key": settings.serpapi_api_key,
        }

        try:
            payload = GoogleSearch(params).get_dict()
        except Exception as error:  # noqa: BLE001 - normalize to SearchError
            raise SearchError(f"SerpAPI request failed: {error}") from error

        if payload.get("error"):
            raise SearchError(f"SerpAPI error: {payload['error']}")
        if payload.get("error_code"):
            raise SearchError(f"SerpAPI error: {payload.get('error', payload['error_code'])}")

        results: list[dict] = []
        for item in payload.get("organic_results", []):
            link = item.get("link")
            if not link:
                continue
            thumbnail = None
            thumbnail_info = item.get("thumbnail")
            if isinstance(thumbnail_info, str):
                thumbnail = thumbnail_info
            results.append(
                {
                    "title": item.get("title", ""),
                    "url": link,
                    "snippet": item.get("snippet", ""),
                    "thumbnail": thumbnail,
                }
            )
        return results


search_service = SearchService()
