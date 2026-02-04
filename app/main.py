from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import get_settings
from app.api.endpoints import router as api_router
from app.core.database import engine, Base

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads (for Audio playback)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include API Router
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Nao Medical Translation API is running"}
