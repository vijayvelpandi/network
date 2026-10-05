"""
Pydantic schemas for API request/response validation.
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field


# ── Alert schemas ──────────────────────────────

class AlertBase(BaseModel):
    source_ip: str
    destination_ip: str
    source_port: int
    destination_port: int
    protocol: str
    detection_type: str
    severity: str
    confidence: float
    status: str = "OPEN"


class AlertResponse(AlertBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|ACKNOWLEDGED|RESOLVED)$")


# ── Prediction schemas ─────────────────────────

class PredictionRequest(BaseModel):
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    protocol: Optional[str] = "TCP"
    flow_duration: Optional[float] = 0
    packet_count: Optional[int] = 0
    byte_count: Optional[int] = 0
    packets_per_second: Optional[float] = 0
    bytes_per_second: Optional[float] = 0
    tcp_flags: Optional[str] = ""


class PredictionResult(BaseModel):
    label: str
    detection_type: str
    confidence: float
    severity: str
    flow: dict[str, Any]


class BatchPredictionResponse(BaseModel):
    results: List[PredictionResult]
    total_flows: int
    normal_count: int
    suspicious_count: int
    alerts_generated: int


# ── Dashboard schemas ──────────────────────────

class DashboardStats(BaseModel):
    total_flows: int
    normal_traffic: int
    suspicious_traffic: int
    alert_count: int
    high_severity_alerts: int
    detection_rate: float


# ── Dataset schemas ────────────────────────────

class DatasetResponse(BaseModel):
    id: int
    name: str
    row_count: int
    column_count: int
    columns: List[str]
    missing_values: int
    is_sample: bool
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ── Model metrics schema ───────────────────────

class ModelMetricsResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: dict
    training_samples: int
    test_samples: int
    features: List[str]
    model_type: str
    trained_at: str
