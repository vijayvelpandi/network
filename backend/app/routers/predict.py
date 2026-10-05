"""
Prediction API routes.

POST /api/predict        — predict a single flow
POST /api/predict/batch  — predict multiple flows from a dataset
"""
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.database import NetworkFlow, Alert, Prediction
from app.models.schemas import (
    PredictionRequest, PredictionResult, BatchPredictionResponse,
)
from ml.inference import classify_flow, classify_dataframe

router = APIRouter(prefix="/api/predict", tags=["predict"])


@router.post("", response_model=PredictionResult)
async def predict_single(request: PredictionRequest, db: Session = Depends(get_db)):
    result = classify_flow(request.model_dump())

    # Store the analyzed flow
    flow = NetworkFlow(
        source_ip=request.source_ip or "",
        destination_ip=request.destination_ip or "",
        source_port=request.source_port or 0,
        destination_port=request.destination_port or 0,
        protocol=request.protocol or "TCP",
        flow_duration=request.flow_duration or 0,
        packet_count=request.packet_count or 0,
        byte_count=request.byte_count or 0,
        packets_per_second=request.packets_per_second or 0,
        bytes_per_second=request.bytes_per_second or 0,
        tcp_flags=request.tcp_flags or "",
        label=result["label"],
        detection_type=result["detection_type"],
        confidence=result["confidence"],
    )
    db.add(flow)

    if result["label"] == "SUSPICIOUS":
        alert = Alert(
            source_ip=request.source_ip or "",
            destination_ip=request.destination_ip or "",
            source_port=request.source_port or 0,
            destination_port=request.destination_port or 0,
            protocol=request.protocol or "TCP",
            detection_type=result["detection_type"],
            severity=result["severity"],
            confidence=result["confidence"],
            status="OPEN",
        )
        db.add(alert)

    db.commit()
    return PredictionResult(
        label=result["label"],
        detection_type=result["detection_type"],
        confidence=result["confidence"],
        severity=result["severity"],
        flow=request.model_dump(),
    )


@router.post("/batch", response_model=BatchPredictionResponse)
async def predict_batch(
    rows: list[dict],
    db: Session = Depends(get_db),
):
    if not rows:
        raise HTTPException(status_code=400, detail="No rows provided.")

    df = pd.DataFrame(rows)
    results = classify_dataframe(df)

    normal_count = 0
    suspicious_count = 0
    alerts_generated = 0
    prediction_results = []

    for i, result in enumerate(results):
        row = rows[i]
        prediction_results.append(PredictionResult(
            label=result["label"],
            detection_type=result["detection_type"],
            confidence=result["confidence"],
            severity=result["severity"],
            flow=row,
        ))

        # Store flow
        flow = NetworkFlow(
            source_ip=str(row.get("source_ip", "")),
            destination_ip=str(row.get("destination_ip", "")),
            source_port=int(row.get("source_port", 0) or 0),
            destination_port=int(row.get("destination_port", 0) or 0),
            protocol=str(row.get("protocol", "TCP")),
            flow_duration=float(row.get("flow_duration", 0) or 0),
            packet_count=int(row.get("packet_count", 0) or 0),
            byte_count=int(row.get("byte_count", 0) or 0),
            packets_per_second=float(row.get("packets_per_second", 0) or 0),
            bytes_per_second=float(row.get("bytes_per_second", 0) or 0),
            tcp_flags=str(row.get("tcp_flags", "")),
            label=result["label"],
            detection_type=result["detection_type"],
            confidence=result["confidence"],
        )
        db.add(flow)

        if result["label"] == "NORMAL":
            normal_count += 1
        else:
            suspicious_count += 1
            alert = Alert(
                source_ip=str(row.get("source_ip", "")),
                destination_ip=str(row.get("destination_ip", "")),
                source_port=int(row.get("source_port", 0) or 0),
                destination_port=int(row.get("destination_port", 0) or 0),
                protocol=str(row.get("protocol", "TCP")),
                detection_type=result["detection_type"],
                severity=result["severity"],
                confidence=result["confidence"],
                status="OPEN",
            )
            db.add(alert)
            alerts_generated += 1

    db.commit()

    return BatchPredictionResponse(
        results=prediction_results,
        total_flows=len(rows),
        normal_count=normal_count,
        suspicious_count=suspicious_count,
        alerts_generated=alerts_generated,
    )
