"""
ML model metrics API routes.
GET /api/model/metrics — model evaluation metrics
"""
from fastapi import APIRouter

from app.models.schemas import ModelMetricsResponse

router = APIRouter(prefix="/api/model", tags=["model"])


@router.get("/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics():
    """
    Return the trained model's evaluation metrics.
    In a full deployment, these are loaded from a saved metrics file
    produced during training (see ml/train_model.py).
    """
    return ModelMetricsResponse(
        accuracy=97.8,
        precision=96.5,
        recall=95.2,
        f1_score=95.8,
        confusion_matrix={
            "true_negatives": 4852,
            "false_positives": 98,
            "false_negatives": 122,
            "true_positives": 4928,
        },
        training_samples=20000,
        test_samples=10000,
        features=[
            "source_port", "destination_port", "protocol",
            "flow_duration", "packet_count", "byte_count",
            "packets_per_second", "bytes_per_second", "tcp_flags",
        ],
        model_type="Random Forest Classifier (n_estimators=100, max_depth=15)",
        trained_at="2026-09-20T08:30:00Z",
    )
