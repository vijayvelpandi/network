"""
SQLAlchemy database models for the Network Intrusion Detection System.

Tables:
  - users         (optional auth, demo only)
  - datasets      (uploaded CSV metadata)
  - network_flows (analyzed traffic flows)
  - predictions   (ML prediction results)
  - alerts        (security alerts from suspicious traffic)
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON,
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class User(Base):
    """Demo user model — authentication is optional in this project."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)  # never store plaintext
    role = Column(String(50), default="analyst")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Dataset(Base):
    """Metadata for uploaded CSV datasets."""
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    columns = Column(JSON)  # list of column names
    missing_values = Column(Integer, default=0)
    is_sample = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="dataset")


class NetworkFlow(Base):
    """A network traffic flow record that has been analyzed."""
    __tablename__ = "network_flows"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String(45), index=True)
    destination_ip = Column(String(45), index=True)
    source_port = Column(Integer)
    destination_port = Column(Integer, index=True)
    protocol = Column(String(10), index=True)
    flow_duration = Column(Float)
    packet_count = Column(Integer)
    byte_count = Column(Integer)
    packets_per_second = Column(Float)
    bytes_per_second = Column(Float)
    tcp_flags = Column(String(20))
    label = Column(String(20), index=True)  # NORMAL or SUSPICIOUS
    detection_type = Column(String(50))
    confidence = Column(Float)


class Prediction(Base):
    """An ML model prediction result."""
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    input_features = Column(JSON)
    predicted_label = Column(String(20))
    detection_type = Column(String(50))
    confidence = Column(Float)
    severity = Column(String(20))

    dataset = relationship("Dataset", back_populates="predictions")


class Alert(Base):
    """A security alert generated from suspicious traffic."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String(45), index=True)
    destination_ip = Column(String(45), index=True)
    source_port = Column(Integer)
    destination_port = Column(Integer, index=True)
    protocol = Column(String(10))
    detection_type = Column(String(50), index=True)
    severity = Column(String(20), index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float)
    status = Column(String(20), default="OPEN", index=True)  # OPEN, ACKNOWLEDGED, RESOLVED
