from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import albums, artists, auth, library, purchases, ratings
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="A marketplace for buying and rating music albums.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(artists.router)
app.include_router(albums.router)
app.include_router(purchases.router)
app.include_router(ratings.router)
app.include_router(library.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": settings.app_name}
