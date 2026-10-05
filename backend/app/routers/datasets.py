"""
Dataset management API routes.

POST /api/datasets/upload — upload a CSV file
GET  /api/datasets        — list datasets
GET  /api/datasets/{id}   — get dataset details
"""
import os
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.config import MAX_UPLOAD_SIZE, ALLOWED_EXTENSIONS
from app.database import get_db
from app.models.database import Dataset
from app.models.schemas import DatasetResponse

router = APIRouter(prefix="/api/datasets", tags=["datasets"])

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 10 MB.")

    # Save file
    file_path = os.path.join(UPLOAD_DIR, file.filename or "uploaded.csv")
    with open(file_path, "wb") as f:
        f.write(content)

    # Parse with pandas
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    missing = int(df.isnull().sum().sum())

    dataset = Dataset(
        name=file.filename,
        file_path=file_path,
        row_count=len(df),
        column_count=len(df.columns),
        columns=list(df.columns),
        missing_values=missing,
        is_sample=False,
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    return dataset


@router.get("", response_model=list[DatasetResponse])
async def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).order_by(Dataset.uploaded_at.desc()).all()


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset
