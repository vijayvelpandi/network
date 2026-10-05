"""
Traffic API routes.
GET /api/traffic — list recent network flows
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import NetworkFlow

router = APIRouter(prefix="/api/traffic", tags=["traffic"])


@router.get("")
async def list_traffic(
    limit: int = Query(50, le=500),
    label: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(NetworkFlow)
    if label and label != "ALL":
        query = query.filter(NetworkFlow.label == label)
    flows = query.order_by(NetworkFlow.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": f.id,
            "timestamp": f.timestamp.isoformat(),
            "source_ip": f.source_ip,
            "destination_ip": f.destination_ip,
            "source_port": f.source_port,
            "destination_port": f.destination_port,
            "protocol": f.protocol,
            "flow_duration": f.flow_duration,
            "packet_count": f.packet_count,
            "byte_count": f.byte_count,
            "packets_per_second": f.packets_per_second,
            "bytes_per_second": f.bytes_per_second,
            "tcp_flags": f.tcp_flags,
            "label": f.label,
            "detection_type": f.detection_type,
            "confidence": f.confidence,
        }
        for f in flows
    ]
