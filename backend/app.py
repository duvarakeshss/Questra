from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routes_health import router as health_router
from api.routes_me import router as me_router
from api.routes_query import router as query_router
from api.routes_search import router as search_router
from config.settings import settings
from errors import QuestraError
from models.schemas import ErrorDetail, ErrorResponse

app = FastAPI(title="Questra API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(QuestraError)
async def questra_error_handler(request: Request, exc: QuestraError) -> JSONResponse:
    payload = ErrorResponse(error=ErrorDetail(code=exc.code, message=exc.message))
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


app.include_router(health_router, prefix="/api", tags=["health"])
app.include_router(query_router, prefix="/api", tags=["query"])
app.include_router(search_router, prefix="/api", tags=["search"])
app.include_router(me_router, prefix="/api", tags=["auth"])
