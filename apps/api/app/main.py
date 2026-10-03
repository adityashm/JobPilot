from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup (for dev/sqlite quickstart)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        # Non-fatal during test override or when DB is waiting to boot
        pass
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI-powered job search & application assistant API.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS middleware configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register API routes (supporting both /api/v1 and /api aliases)
app.include_router(api_router, prefix=settings.API_V1_STR)
if settings.API_V1_STR != "/api":
    app.include_router(api_router, prefix="/api")


@app.get("/", include_in_schema=False)
def root():
    """Redirect root path to interactive OpenAPI documentation."""
    return RedirectResponse(url="/docs")
