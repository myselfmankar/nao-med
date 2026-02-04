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

import os
from fastapi.responses import FileResponse

# ... existing code ...

# Include API Router
app.include_router(api_router, prefix="/api")

# Serve React App (SPA)
# Mount static assets (JS/CSS/Images)
if os.path.exists("ui/dist"):
    app.mount("/assets", StaticFiles(directory="ui/dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    # Allow API calls to pass through (handled by include_router above, but just in case)
    if full_path.startswith("api") or full_path.startswith("uploads"):
        return {"error": "Not Found"}
    
    # Serve index.html for any other route (Client-side routing)
    if os.path.exists("ui/dist/index.html"):
        return FileResponse("ui/dist/index.html")
    return {"message": "UI not built. Run 'npm run build' in /ui"}
