"""
Dashboard API routes.
GET /api/dashboard/stats — aggregated security statistics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.database import NetworkFlow, Alert
from app.models.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    total_flows = db.query(func.count(NetworkFlow.id)).scalar() or 0
    normal_traffic = db.query(func.count(NetworkFlow.id)).filter(
        NetworkFlow.label == "NORMAL"
    ).scalar() or 0
    suspicious_traffic = db.query(func.count(NetworkFlow.id)).filter(
        NetworkFlow.label == "SUSPICIOUS"
    ).scalar() or 0
    alert_count = db.query(func.count(Alert.id)).scalar() or 0
    high_severity = db.query(func.count(Alert.id)).filter(
        Alert.severity.in_(["HIGH", "CRITICAL"])
    ).scalar() or 0
    detection_rate = round((suspicious_traffic / total_flows * 100), 1) if total_flows > 0 else 0

    return DashboardStats(
        total_flows=total_flows,
        normal_traffic=normal_traffic,
        suspicious_traffic=suspicious_traffic,
        alert_count=alert_count,
        high_severity_alerts=high_severity,
        detection_rate=detection_rate,
    )
