"""
ML Training Pipeline — Network Intrusion Detection System

This script:
  1. Loads a network-flow dataset (CSV)
  2. Cleans missing values
  3. Encodes categorical features
  4. Scales numeric features
  5. Splits into train/test sets
  6. Trains a Random Forest classifier
  7. Evaluates the model
  8. Saves the model, scaler, and encoder

Usage:
    python ml/train_model.py --dataset data/sample_network_flows.csv

The dataset CSV should contain columns like:
    source_ip, destination_ip, source_port, destination_port,
    protocol, flow_duration, packet_count, byte_count,
    packets_per_second, bytes_per_second, tcp_flags, label

The 'label' column should be 'NORMAL' or 'SUSPICIOUS'.
"""
import argparse
import os
import json
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix,
)
import joblib

# Feature columns used for training
NUMERIC_FEATURES = [
    "source_port", "destination_port", "flow_duration",
    "packet_count", "byte_count", "packets_per_second",
    "bytes_per_second",
]
CATEGORICAL_FEATURES = ["protocol", "tcp_flags"]
LABEL_COLUMN = "label"


def load_dataset(path: str) -> pd.DataFrame:
    """Load CSV dataset and validate required columns."""
    df = pd.read_csv(path)
    print(f"Loaded dataset: {len(df)} rows, {len(df.columns)} columns")
    print(f"Columns: {list(df.columns)}")

    if LABEL_COLUMN not in df.columns:
        raise ValueError(f"Dataset must contain a '{LABEL_COLUMN}' column")

    return df


def preprocess(df: pd.DataFrame):
    """Clean, encode, and scale features. Returns X, y, encoders."""
    # Handle missing values
    for col in NUMERIC_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            df[col] = df[col].fillna("UNKNOWN")

    # Encode categorical features
    encoders = {}
    for col in CATEGORICAL_FEATURES:
        if col in df.columns:
            le = LabelEncoder()
            df[col + "_encoded"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

    # Build feature matrix
    feature_cols = NUMERIC_FEATURES + [f"{c}_encoded" for c in CATEGORICAL_FEATURES if c in df.columns]
    X = df[feature_cols].values

    # Scale numeric features
    scaler = StandardScaler()
    X = scaler.fit_transform(X)

    # Encode labels
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(df[LABEL_COLUMN])

    return X, y, scaler, encoders, label_encoder, feature_cols


def train(X, y):
    """Train Random Forest classifier."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    # Evaluate
    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred) * 100
    prec = precision_score(y_test, y_pred, average="binary") * 100
    rec = recall_score(y_test, y_pred, average="binary") * 100
    f1 = f1_score(y_test, y_pred, average="binary") * 100
    cm = confusion_matrix(y_test, y_pred)

    print("\n── Model Evaluation ──")
    print(f"  Accuracy:  {acc:.1f}%")
    print(f"  Precision: {prec:.1f}%")
    print(f"  Recall:    {rec:.1f}%")
    print(f"  F1 Score:  {f1:.1f}%")
    print(f"  Confusion Matrix:")
    print(f"    TN={cm[0][0]}  FP={cm[0][1]}")
    print(f"    FN={cm[1][0]}  TP={cm[1][1]}")
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples:     {len(X_test)}")

    metrics = {
        "accuracy": round(acc, 1),
        "precision": round(prec, 1),
        "recall": round(rec, 1),
        "f1_score": round(f1, 1),
        "confusion_matrix": {
            "true_negatives": int(cm[0][0]),
            "false_positives": int(cm[0][1]),
            "false_negatives": int(cm[1][0]),
            "true_positives": int(cm[1][1]),
        },
        "training_samples": len(X_train),
        "test_samples": len(X_test),
    }

    return rf, metrics


def save_model(rf, scaler, encoders, label_encoder, feature_cols, metrics, output_dir="ml/model"):
    """Save model artifacts to disk."""
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(rf, os.path.join(output_dir, "random_forest_model.joblib"))
    joblib.dump(scaler, os.path.join(output_dir, "scaler.joblib"))
    joblib.dump(encoders, os.path.join(output_dir, "encoders.joblib"))
    joblib.dump(label_encoder, os.path.join(output_dir, "label_encoder.joblib"))

    metrics["features"] = feature_cols
    metrics["model_type"] = "Random Forest Classifier (n_estimators=100, max_depth=15)"
    metrics["trained_at"] = datetime.utcnow().isoformat() + "Z"
    with open(os.path.join(output_dir, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel saved to {output_dir}/")


def main():
    parser = argparse.ArgumentParser(description="Train Random Forest IDS model")
    parser.add_argument("--dataset", default="data/sample_network_flows.csv",
                        help="Path to training CSV dataset")
    parser.add_argument("--output", default="ml/model",
                        help="Output directory for model artifacts")
    args = parser.parse_args()

    print("── Loading dataset ──")
    df = load_dataset(args.dataset)

    print("\n── Preprocessing ──")
    X, y, scaler, encoders, label_encoder, feature_cols = preprocess(df)

    print("\n── Training Random Forest ──")
    rf, metrics = train(X, y)

    save_model(rf, scaler, encoders, label_encoder, feature_cols, metrics, args.output)
    print("\nDone! Model is ready for inference.")


if __name__ == "__main__":
    main()
