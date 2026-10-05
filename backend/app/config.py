"""
Application configuration.
Values are read from environment variables with sensible defaults.
No secrets are hardcoded.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/intrusion_detection.db")

# CORS — in production, set FRONTEND_ORIGIN to your deployed URL
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

# File upload limits
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024)))  # 10 MB
ALLOWED_EXTENSIONS = {".csv", ".txt"}

# ML model path
MODEL_PATH = os.getenv("MODEL_PATH", "ml/model/random_forest_model.joblib")
SCALER_PATH = os.getenv("SCALER_PATH", "ml/model/scaler.joblib")
ENCODER_PATH = os.getenv("ENCODER_PATH", "ml/model/label_encoder.joblib")

# Simulation
SIMULATION_INTERVAL_MS = int(os.getenv("SIMULATION_INTERVAL_MS", "500"))
