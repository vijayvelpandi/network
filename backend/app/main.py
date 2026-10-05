"""
FastAPI application entry point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGIN
from app.database import init_db
from app.routers import dashboard, alerts, datasets, predict, traffic, model


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    init_db()
    # Seed sample data if database is empty
    from app.utils.seed_data import seed_sample_data
    seed_sample_data()
    yield


app = FastAPI(
    title="NetGuard IDS API",
    description="Network Intrusion Detection System — REST API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration — allow the frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Client-Info", "Apikey"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(datasets.router)
app.include_router(predict.router)
app.include_router(traffic.router)
app.include_router(model.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "NetGuard IDS API", "version": "1.0.0"}
