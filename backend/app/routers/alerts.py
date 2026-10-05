"""
Alert management API routes.

GET    /api/alerts          — list alerts (with filters)
GET    /api/alerts/{id}     — get a single alert
PATCH  /api/alerts/{id}     — update alert status
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import Alert
from app.models.schemas import AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    search: str | None = Query(None),
    severity: str | None = Query(None),
    status: str | None = Query(None),
    detection_type: str | None = Query(None),
    sort_by: str = Query("timestamp"),
    sort_order: str = Query("desc"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

    if search:
        query = query.filter(
            (Alert.source_ip.contains(search))
            | (Alert.destination_ip.contains(search))
            | (Alert.detection_type.contains(search))
        )
    if severity and severity != "ALL":
        query = query.filter(Alert.severity == severity)
    if status and status != "ALL":
        query = query.filter(Alert.status == status)
    if detection_type and detection_type != "ALL":
        query = query.filter(Alert.detection_type == detection_type)

    sort_column = getattr(Alert, sort_by, Alert.timestamp)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    return query.limit(limit).all()


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    update: AlertUpdate,
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = update.status
    db.commit()
    db.refresh(alert)
    return alert
