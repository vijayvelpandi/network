"""
ML Inference module — loads the trained model and classifies network flows.

If no trained model is found on disk, falls back to a heuristic classifier
so the API remains functional for demonstration.
"""
import os
import joblib
import pandas as pd
import numpy as np
from typing import Optional

from app.config import MODEL_PATH, SCALER_PATH, ENCODER_PATH

NUMERIC_FEATURES = [
    "source_port", "destination_port", "flow_duration",
    "packet_count", "byte_count", "packets_per_second",
    "bytes_per_second",
]

# Lazy-loaded model artifacts
_model = None
_scaler = None
_encoders = None
_label_encoder = None


def _load_model():
    """Attempt to load the trained model from disk."""
    global _model, _scaler, _encoders, _label_encoder

    if _model is not None:
        return True

    try:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
            _scaler = joblib.load(SCALER_PATH)
            _encoders = joblib.load(ENCODER_PATH)

            encoder_path = os.path.join(os.path.dirname(MODEL_PATH), "label_encoder.joblib")
            if os.path.exists(encoder_path):
                _label_encoder = joblib.load(encoder_path)
            return True
    except Exception:
        pass

    return False


def _heuristic_classify(flow: dict) -> dict:
    """
    Fallback heuristic classifier (used when no trained model is saved).
    Mirrors the frontend classification logic.
    """
    pps = float(flow.get("packets_per_second", 0) or 0)
    bps = float(flow.get("bytes_per_second", 0) or 0)
    duration = float(flow.get("flow_duration", 0) or 0)
    pkt_count = int(flow.get("packet_count", 0) or 0)
    byte_count = int(flow.get("byte_count", 0) or 0)
    dst_port = int(flow.get("destination_port", 0) or 0)
    tcp_flags = str(flow.get("tcp_flags", "")).upper()
    protocol = str(flow.get("protocol", "TCP")).upper()

    scores = {
        "Normal Traffic": 0.5,
        "Port Scan": 0.0,
        "DoS-like Traffic": 0.0,
        "Brute Force": 0.0,
        "Other Suspicious Traffic": 0.0,
    }

    # Port Scan
    if 0 < duration < 500 and byte_count < 200 and pkt_count <= 3:
        scores["Port Scan"] += 0.4
    if dst_port > 1024 and pkt_count <= 2 and byte_count < 100:
        scores["Port Scan"] += 0.25
    if "SYN" in tcp_flags and "ACK" not in tcp_flags:
        scores["Port Scan"] += 0.2

    # DoS-like
    if pps > 500:
        scores["DoS-like Traffic"] += 0.35
    if bps > 500000:
        scores["DoS-like Traffic"] += 0.25

    # Brute Force
    if dst_port in (22, 3389, 23, 21):
        scores["Brute Force"] += 0.3
    if 5 <= pps <= 50 and 3 <= pkt_count <= 20 and byte_count < 5000:
        scores["Brute Force"] += 0.25

    # Other suspicious
    if 50 < pps <= 500 and byte_count > 50000 and duration < 2000:
        scores["Other Suspicious Traffic"] += 0.3

    # Normal
    if duration >= 1000 and 1 <= pps <= 100 and byte_count > 1000:
        scores["Normal Traffic"] += 0.35
    if dst_port in (80, 443, 53):
        scores["Normal Traffic"] += 0.2

    best = max(scores, key=scores.get)
    is_normal = best == "Normal Traffic"
    confidence = round(min(0.99, 0.7 + scores[best] * 0.3) * 100, 1) if is_normal else round(min(0.99, 0.6 + scores[best] * 0.35) * 100, 1)

    severity = _compute_severity(best, confidence)
    return {
        "label": "NORMAL" if is_normal else "SUSPICIOUS",
        "detection_type": best,
        "confidence": confidence,
        "severity": severity,
    }


def _compute_severity(detection_type: str, confidence: float) -> str:
    if detection_type == "DoS-like Traffic" and confidence >= 85:
        return "CRITICAL"
    if detection_type in ("DoS-like Traffic",) and confidence >= 70:
        return "HIGH"
    if detection_type in ("Brute Force", "Port Scan") and confidence >= 80:
        return "HIGH"
    if detection_type in ("Brute Force", "Port Scan", "Other Suspicious Traffic"):
        return "MEDIUM"
    return "LOW"


def classify_flow(flow: dict) -> dict:
    """Classify a single network flow."""
    if _load_model():
        # Use trained model
        features = []
        for col in NUMERIC_FEATURES:
            features.append(float(flow.get(col, 0) or 0))

        # Encode categorical
        for cat_col in ["protocol", "tcp_flags"]:
            val = str(flow.get(cat_col, "UNKNOWN"))
            if _encoders and cat_col in _encoders:
                le = _encoders[cat_col]
                try:
                    val_encoded = le.transform([val])[0]
                except ValueError:
                    val_encoded = 0
            else:
                val_encoded = 0
            features.append(val_encoded)

        X = np.array([features])
        if _scaler:
            X = _scaler.transform(X)

        pred = _model.predict(X)[0]
        proba = _model.predict_proba(X)[0]
        confidence = round(max(proba) * 100, 1)

        label = "SUSPICIOUS" if pred == 1 else "NORMAL"
        detection_type = "Suspicious Traffic" if pred == 1 else "Normal Traffic"
        severity = _compute_severity(detection_type, confidence)

        return {
            "label": label,
            "detection_type": detection_type,
            "confidence": confidence,
            "severity": severity,
        }
    else:
        # Fallback to heuristic
        return _heuristic_classify(flow)


def classify_dataframe(df: pd.DataFrame) -> list[dict]:
    """Classify multiple flows from a DataFrame."""
    results = []
    for _, row in df.iterrows():
        flow = row.to_dict()
        results.append(classify_flow(flow))
    return results
