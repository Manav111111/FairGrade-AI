"""
FairGrade AI — FastAPI application entry point.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import exam, upload, evaluate, results

# ── Logging ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)

# ── App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FairGrade AI",
    description="AI-powered exam evaluation and marking audit system",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://fairgrade-ai.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────
app.include_router(exam.router)
app.include_router(upload.router)
app.include_router(evaluate.router)
app.include_router(results.router)


@app.get("/")
async def root():
    return {
        "app": "FairGrade AI",
        "version": "1.0.0",
        "docs": "/docs",
        "modes": {
            "AI_ONLY": "Full AI evaluation (no teacher input required)",
            "AUDIT": "Compare AI marks against teacher marks to detect bias",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
