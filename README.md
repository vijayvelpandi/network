# NetGuard IDS — Network Intrusion Detection System Using Machine Learning

A full-stack cybersecurity dashboard that monitors network traffic, analyzes network-flow features, uses a Random Forest machine-learning model to classify traffic as normal or suspicious, stores alerts, and displays security analytics.

> **Academic Project Notice:** This application is designed for **defensive monitoring and testing in an authorized/controlled environment only**. It does not perform unauthorized network scanning, attacks, credential theft, malware deployment, or exploitation. All traffic data in the simulation is **synthetically generated** and labeled as DEMO/SIMULATED.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement](#problem-statement)
3. [Objectives](#objectives)
4. [Features](#features)
5. [Architecture](#architecture)
6. [Technology Stack](#technology-stack)
7. [Folder Structure](#folder-structure)
8. [Installation Instructions](#installation-instructions)
9. [Frontend Setup](#frontend-setup)
10. [Backend Setup](#backend-setup)
11. [Database Setup](#database-setup)
12. [ML Model Setup](#ml-model-setup)
13. [How to Run the Application](#how-to-run-the-application)
14. [API Documentation](#api-documentation)
15. [Dataset Format](#dataset-format)
16. [Testing Instructions](#testing-instructions)
17. [Limitations](#limitations)
18. [Future Enhancements](#future-enhancements)
19. [Cybersecurity Ethics / Safety Note](#cybersecurity-ethics--safety-note)
20. [Major Module Explanations](#major-module-explanations)

---

## Project Overview

NetGuard IDS is a Security Operations Center (SOC) style web application that simulates a network intrusion detection pipeline. It generates synthetic network-flow records, feeds them through a Random Forest classifier, displays real-time classification results, generates alerts for suspicious traffic, and provides comprehensive analytics and reporting.

The frontend is a React + TypeScript single-page application with a dark cybersecurity theme. The backend is a Python FastAPI REST API backed by SQLite and SQLAlchemy. The ML component uses scikit-learn's Random Forest classifier.

The frontend runs independently with an in-browser data layer that mirrors the backend API, so the dashboard is fully functional without the Python backend running. When the backend is connected, the same UI maps to the REST API endpoints.

---

## Problem Statement

Traditional network intrusion detection systems rely on signature-based matching, which fails to detect novel or zero-day attacks. Machine-learning-based IDS can learn normal traffic patterns and flag anomalous behavior without requiring pre-defined attack signatures. This project demonstrates how a supervised ML model (Random Forest) can classify network flows as normal or suspicious based on flow-level features such as packet rates, byte counts, port numbers, and protocol.

---

## Objectives

- Build a professional SOC-style dashboard for network traffic monitoring
- Implement a machine-learning pipeline that classifies network flows
- Generate and manage security alerts from suspicious traffic detection
- Provide real-time traffic simulation for demonstration purposes
- Support CSV dataset upload and batch prediction
- Display model evaluation metrics (accuracy, precision, recall, F1, confusion matrix)
- Generate exportable security reports
- Follow secure coding practices (input validation, file limits, parameterized queries, CORS)

---

## Features

### 1. Dashboard
- Total network flows, normal/suspicious counts, alert count, high-severity alerts, detection rate
- Traffic over time area chart (6-hour window, 15-minute intervals)
- Normal vs suspicious pie chart
- Attack category distribution bar chart
- Protocol distribution pie chart
- Severity distribution bar chart
- Recent network flows table
- Recent security alerts list

### 2. Live Monitoring Simulation
- Start/stop monitoring controls
- Real-time synthetic flow generation
- Live event stream with classification results
- Current traffic rate display
- Rate chart (flows per second)
- Clearly labeled as SIMULATION MODE
- Generates alerts for suspicious flows automatically

### 3. Traffic Analysis
- CSV file upload with drag-and-drop support
- File type and size validation (10 MB max, .csv only)
- Automatic column detection with flexible header matching
- Data preview table
- Run ML model on uploaded data
- Prediction results with confidence scores
- Export results as CSV
- Load sample data button for instant demo

### 4. Alert Management
- Full alert list with pagination
- Filter by severity, status, detection type
- Search by IP, detection type, or alert ID
- Sort by timestamp, severity, or confidence
- Acknowledge alerts
- Resolve alerts
- Detailed alert modal with all fields

### 5. ML Model Performance
- Accuracy, precision, recall, F1 score
- Confusion matrix (TN, FP, FN, TP) with bar chart and grid
- Performance overview radial chart
- Feature list display
- Classification categories with descriptions
- ML pipeline visualization (6 steps)

### 6. Dataset Management
- Upload CSV datasets
- View dataset metadata (row count, columns, missing values)
- Column listing with missing value indicators
- Sample row preview
- Run preprocessing
- Export datasets as CSV
- Pre-loaded sample dataset (DEMO data)

### 7. Reports
- Summary statistics table
- Detection trends chart (24-hour)
- Attack category distribution
- Severity statistics
- ML performance summary
- Export complete report as CSV

### 8. Settings
- Detection confidence threshold slider
- Model confidence threshold
- Auto-acknowledge toggle
- Simulation interval control
- Max flows stored
- Notification preferences
- System information

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │Live Mon. │  │Traffic   │  │ Alerts  │ │
│  │          │  │          │  │Analysis  │  │         │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │              │       │
│  ┌────┴─────────────┴─────────────┴──────────────┴────┐ │
│  │              Data Layer (TypeScript)                │ │
│  │  dataStore.ts · mlModel.ts · dataGenerator.ts       │ │
│  └────────────────────┬────────────────────────────────┘ │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │  REST API (HTTP/JSON)
┌───────────────────────┼──────────────────────────────────┐
│                       ▼     BACKEND (Python)              │
│  ┌────────────────────────────────────────────────────┐  │
│  │              FastAPI REST API                       │  │
│  │  /api/dashboard · /api/alerts · /api/predict       │  │
│  │  /api/datasets · /api/traffic · /api/model         │  │
│  └────────────┬───────────────────────┬───────────────┘  │
│               │                       │                  │
│  ┌────────────▼──────────┐  ┌─────────▼──────────────┐  │
│  │   SQLAlchemy ORM      │  │   ML Inference Module   │  │
│  │   (SQLite database)   │  │   (scikit-learn RF)     │  │
│  └───────────────────────┘  └────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Frontend → Backend communication:**
- The frontend's `dataStore.ts` layer simulates the REST API in-browser using session storage, so the app works standalone.
- When the FastAPI backend is running, the same data operations map to the REST endpoints listed below.

---

## Technology Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 18, TypeScript, Vite         |
| Styling        | Tailwind CSS 3                     |
| Charts         | Recharts                            |
| Icons          | Lucide React                        |
| Backend        | Python 3.11+, FastAPI              |
| ORM            | SQLAlchemy 2.0                     |
| Database       | SQLite                              |
| ML             | scikit-learn, pandas, numpy        |
| Model          | Random Forest Classifier            |
| Model Storage  | joblib (serialized model files)    |

---

## Folder Structure

```
project/
├── src/                              # Frontend source
│   ├── components/                   # Shared UI components
│   │   ├── AppLayout.tsx            # Main layout with sidebar + header
│   │   ├── Sidebar.tsx              # Navigation sidebar
│   │   └── ui/
│   │       └── Badges.tsx           # Severity, status, prediction badges
│   ├── context/
│   │   └── ToastContext.tsx         # Toast notification system
│   ├── lib/                          # Data layer & utilities
│   │   ├── csvUtils.ts              # CSV parsing, validation, export
│   │   ├── dataGenerator.ts         # Synthetic flow generator
│   │   ├── dataStore.ts             # In-memory data store (simulates API)
│   │   ├── format.ts                # Display formatting utilities
│   │   ├── mlModel.ts               # ML classification logic (frontend)
│   │   └── sampleDataset.ts         # Sample dataset generation
│   ├── pages/                        # Application pages
│   │   ├── DashboardPage.tsx        # SOC dashboard with stats & charts
│   │   ├── LiveMonitoringPage.tsx   # Real-time simulation
│   │   ├── TrafficAnalysisPage.tsx  # CSV upload + prediction
│   │   ├── AlertsPage.tsx           # Alert management with filters
│   │   ├── DatasetsPage.tsx         # Dataset upload & inspection
│   │   ├── MLModelPage.tsx          # Model performance metrics
│   │   ├── ReportsPage.tsx          # Analytics report + CSV export
│   │   └── SettingsPage.tsx         # Application configuration
│   ├── types/
│   │   └── index.ts                 # TypeScript type definitions
│   ├── App.tsx                       # Root component with routing
│   ├── main.tsx                      # React entry point
│   └── index.css                     # Tailwind + custom styles
│
├── backend/                          # Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Environment configuration
│   │   ├── database.py               # SQLAlchemy engine & session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── database.py           # SQLAlchemy ORM models
│   │   │   └── schemas.py            # Pydantic request/response schemas
│   │   ├── routers/                   # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── dashboard.py          # GET /api/dashboard/stats
│   │   │   ├── alerts.py             # GET/PATCH /api/alerts
│   │   │   ├── datasets.py           # POST/GET /api/datasets
│   │   │   ├── predict.py            # POST /api/predict
│   │   │   ├── traffic.py            # GET /api/traffic
│   │   │   └── model.py              # GET /api/model/metrics
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── seed_data.py          # Database seeder
│   ├── ml/                            # Machine learning module
│   │   ├── train_model.py            # Training pipeline
│   │   └── inference.py              # Model loading & prediction
│   ├── data/
│   │   ├── sample_network_flows.csv  # Sample training dataset
│   │   └── uploads/                  # Uploaded CSV files
│   ├── requirements.txt              # Python dependencies
│   └── .env.example                  # Environment variable template
│
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Installation Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ and pip
- **Git** (optional)

### Frontend Setup

```bash
# From the project root
npm install
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
```

---

## Database Setup

The backend uses SQLite, which requires no separate installation. The database file is created automatically at `backend/data/intrusion_detection.db` when the server starts.

Tables are created automatically via SQLAlchemy's `metadata.create_all()`. Sample data (200 synthetic flows + alerts) is seeded on first launch if the database is empty.

**Database tables:**

| Table           | Description                              |
|-----------------|------------------------------------------|
| users           | Demo user accounts (optional auth)       |
| datasets        | Uploaded CSV dataset metadata            |
| network_flows   | Analyzed network traffic flow records    |
| predictions     | ML prediction results                    |
| alerts          | Security alerts from suspicious traffic  |

**Alert model fields:** id, timestamp, source_ip, destination_ip, source_port, destination_port, protocol, detection_type, severity, confidence, status

---

## ML Model Setup

### Training the Model

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Train using the sample dataset
python ml/train_model.py --dataset data/sample_network_flows.csv

# Or train with your own dataset
python ml/train_model.py --dataset path/to/your_dataset.csv
```

This will:
1. Load the CSV dataset
2. Clean missing values
3. Encode categorical features (protocol, tcp_flags)
4. Scale numeric features using StandardScaler
5. Split into 70% training / 30% testing
6. Train a Random Forest (100 trees, max depth 15)
7. Evaluate and print metrics
8. Save model artifacts to `ml/model/`

**Model artifacts saved:**
- `random_forest_model.joblib` — trained classifier
- `scaler.joblib` — fitted StandardScaler
- `encoders.joblib` — label encoders for categorical features
- `label_encoder.joblib` — label encoder for target
- `metrics.json` — evaluation metrics

If no trained model is found, the backend falls back to a heuristic classifier so the API remains functional.

---

## How to Run the Application

### Option 1: Frontend Only (Standalone Mode)

The frontend works independently with an in-browser data layer. This is the simplest way to demo the project.

```bash
# From project root
npm install
npm run dev
```

Open http://localhost:5173 in your browser. The dashboard will be populated with 200 sample flows and corresponding alerts.

### Option 2: Full Stack (Frontend + Backend)

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and the API on http://localhost:8000.

### API Health Check

```bash
curl http://localhost:8000/api/health
# {"status":"healthy","service":"NetGuard IDS API","version":"1.0.0"}
```

### Interactive API Docs

FastAPI provides automatic interactive documentation at:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## API Documentation

### Health Check
| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| GET    | `/api/health`     | Service health check     |

### Dashboard
| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | `/api/dashboard/stats`    | Aggregated security statistics       |

**Response:**
```json
{
  "total_flows": 200,
  "normal_traffic": 140,
  "suspicious_traffic": 60,
  "alert_count": 60,
  "high_severity_alerts": 15,
  "detection_rate": 30.0
}
```

### Alerts
| Method | Endpoint                | Description                              |
|--------|-------------------------|------------------------------------------|
| GET    | `/api/alerts`           | List alerts (supports query filters)     |
| GET    | `/api/alerts/{id}`      | Get a single alert by ID                 |
| PATCH  | `/api/alerts/{id}`      | Update alert status                      |

**Query parameters for GET /api/alerts:**
- `search` — search by IP, detection type, or ID
- `severity` — LOW, MEDIUM, HIGH, CRITICAL
- `status` — OPEN, ACKNOWLEDGED, RESOLVED
- `detection_type` — Port Scan, DoS-like Traffic, Brute Force, etc.
- `sort_by` — timestamp, severity, confidence
- `sort_order` — asc, desc
- `limit` — max results (default 100, max 500)

**PATCH request body:**
```json
{ "status": "ACKNOWLEDGED" }
```

### Datasets
| Method | Endpoint                | Description                    |
|--------|-------------------------|--------------------------------|
| POST   | `/api/datasets/upload`  | Upload a CSV file              |
| GET    | `/api/datasets`         | List all datasets              |
| GET    | `/api/datasets/{id}`    | Get dataset details            |

### Predictions
| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| POST   | `/api/predict`          | Classify a single network flow      |
| POST   | `/api/predict/batch`    | Classify multiple flows             |

**POST /api/predict request body:**
```json
{
  "source_ip": "192.168.1.10",
  "destination_ip": "10.0.0.15",
  "source_port": 45612,
  "destination_port": 443,
  "protocol": "TCP",
  "flow_duration": 12000,
  "packet_count": 85,
  "byte_count": 45000,
  "packets_per_second": 7.1,
  "bytes_per_second": 3750,
  "tcp_flags": "SYN-ACK"
}
```

**Response:**
```json
{
  "label": "NORMAL",
  "detection_type": "Normal Traffic",
  "confidence": 92.5,
  "severity": "LOW",
  "flow": { ... }
}
```

### Traffic
| Method | Endpoint          | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/api/traffic`    | List recent network flows      |

### Model Metrics
| Method | Endpoint                | Description                     |
|--------|-------------------------|---------------------------------|
| GET    | `/api/model/metrics`    | ML model evaluation metrics     |

---

## Dataset Format

The system accepts CSV files with the following columns. Not all columns are required — the model uses defaults for missing features.

| Column                | Type    | Required | Description                        |
|-----------------------|---------|----------|------------------------------------|
| source_ip             | string  | Yes      | Source IP address                  |
| destination_ip        | string  | Yes      | Destination IP address             |
| source_port           | integer | No       | Source port (1-65535)              |
| destination_port      | integer | No       | Destination port                   |
| protocol              | string  | Yes      | TCP, UDP, or ICMP                  |
| flow_duration         | float   | No       | Flow duration in milliseconds      |
| packet_count          | integer | No       | Total packets in flow              |
| byte_count            | integer | No       | Total bytes in flow                |
| packets_per_second    | float   | No       | Packet rate                        |
| bytes_per_second      | float   | No       | Byte rate                          |
| tcp_flags             | string  | No       | TCP flags (SYN, ACK, FIN, etc.)    |
| label                 | string  | Training | NORMAL or SUSPICIOUS (training only)|

**Flexible header matching:** The system accepts various header name formats (e.g., `src_ip`, `Source IP`, `sourceip` all map to `source_ip`).

**Sample dataset:** A sample CSV file is included at `backend/data/sample_network_flows.csv` with 25 rows of mixed normal and suspicious traffic. The frontend also has a built-in sample dataset generator that produces 150 records on demand.

---

## Testing Instructions

### Frontend
```bash
npm run build       # Verify production build
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
```

### Backend
```bash
cd backend
source venv/bin/activate

# Start the server and test endpoints
uvicorn app.main:app --reload --port 8000

# In another terminal:
curl http://localhost:8000/api/health
curl http://localhost:8000/api/dashboard/stats
curl http://localhost:8000/api/alerts?severity=HIGH
curl http://localhost:8000/api/model/metrics
```

### Manual Testing Flow
1. Open the dashboard — verify stats and charts are populated
2. Go to Live Monitoring — click Start, observe real-time events
3. Go to Traffic Analysis — click "Load Sample Data", then "Run ML Model"
4. Go to Alerts — filter by severity, search by IP, click an alert for details
5. Go to Datasets — review the sample dataset, upload a CSV
6. Go to ML Model — review metrics and confusion matrix
7. Go to Reports — click "Export Report as CSV"
8. Go to Settings — adjust thresholds

---

## Limitations

1. **Simulation only:** The live monitoring page generates synthetic data, not real packet captures. Real network monitoring would require tools like Wireshark, Zeek, or nDPI.
2. **Heuristic fallback:** If no trained model is saved, the system uses a rule-based heuristic classifier instead of the actual Random Forest.
3. **SQLite:** Suitable for development and demonstration; production would use PostgreSQL or similar.
4. **No authentication:** The current version does not implement login. The user model exists but auth endpoints are not wired.
5. **Sample dataset size:** The included sample CSV has 25 rows. For meaningful training, use a larger labeled dataset.
6. **Attack categories:** The model only detects categories present in the training data (Port Scan, DoS-like, Brute Force, Other Suspicious). It cannot detect attack types it was not trained on.

---

## Future Enhancements

1. **Real packet capture:** Integrate with Zeek/Suricata logs or PCAP files for real network monitoring
2. **Deep learning models:** Add LSTM or Autoencoder models for anomaly detection
3. **User authentication:** Implement JWT-based login with role-based access control
4. **Real-time WebSocket updates:** Replace polling with WebSocket push for live alerts
5. **Email/SMS notifications:** Send alerts to security analysts via email or Slack
6. **Threat intelligence integration:** Cross-reference source IPs with threat feeds
7. **Multi-model comparison:** Compare Random Forest with SVM, XGBoost, and neural networks
8. **GeoIP mapping:** Visualize attack origins on a world map
9. **PostgreSQL migration:** Move from SQLite to PostgreSQL for production scale
10. **Docker deployment:** Containerize frontend and backend for easy deployment

---

## Cybersecurity Ethics / Safety Note

This project is intended **solely for educational and defensive security purposes**.

- **No real attacks:** The application does not generate, send, or facilitate any real network attacks.
- **Synthetic data only:** All network-flow data is synthetically generated for demonstration.
- **Defensive purpose:** The system is designed to detect and alert on suspicious patterns, not to exploit them.
- **Authorized use only:** Any real network monitoring must be conducted in an authorized, controlled environment with proper permissions.
- **No credential storage:** The application does not store or transmit passwords or sensitive credentials in plaintext.
- **Responsible disclosure:** If real vulnerabilities are discovered during testing, they should be reported through proper responsible disclosure channels.

**Users of this software are responsible for complying with all applicable laws and regulations regarding network monitoring and data privacy.**

---

## Major Module Explanations

### 1. Frontend Data Layer (`src/lib/`)
- **`dataStore.ts`** — Central in-memory store that simulates the backend API. Manages flows, alerts, datasets, and predictions. Uses `sessionStorage` for persistence across page reloads within a browser session.
- **`mlModel.ts`** — Frontend classification engine. Uses heuristic scoring that mimics a trained Random Forest model's decision boundaries. Maps flow features to detection types and confidence scores.
- **`dataGenerator.ts`** — Generates realistic synthetic network flows with characteristics matching different attack types (port scans, DoS, brute force).
- **`csvUtils.ts`** — Safe CSV parsing with quoted-field support, file validation (type + size), and CSV export.

### 2. Frontend Pages (`src/pages/`)
- Each page is a self-contained component following the Single Responsibility Principle.
- All pages share the `AppLayout` wrapper which provides the sidebar, header, and navigation.
- Charts use Recharts with a consistent dark theme color palette.

### 3. Backend API (`backend/app/`)
- **`main.py`** — FastAPI application with CORS middleware, lifespan-based DB initialization, and router registration.
- **`routers/`** — Each router handles one resource domain (dashboard, alerts, datasets, predict, traffic, model).
- **`models/database.py`** — SQLAlchemy ORM models defining all 5 database tables.
- **`models/schemas.py`** — Pydantic models for request validation and response serialization.

### 4. ML Pipeline (`backend/ml/`)
- **`train_model.py`** — End-to-end training script: load CSV → clean → encode → scale → split → train → evaluate → save.
- **`inference.py`** — Model loading with lazy initialization and heuristic fallback. Provides `classify_flow()` and `classify_dataframe()` functions used by the prediction API.

### 5. Database (`backend/data/`)
- SQLite database auto-created on startup.
- Sample data seeded on first launch via `utils/seed_data.py`.
- All queries use SQLAlchemy ORM (parameterized, SQL-injection-safe).

---

## Sample Login / Demo Credentials

Authentication is **not implemented** in the current version. The application runs without login. The `users` table exists in the database schema for future implementation.

When auth is added, demo credentials would be:
- Username: `admin` / Password: `admin123` (hashed, not plaintext)
- Username: `analyst` / Password: `analyst123`

---

## Commands Summary

```bash
# Frontend
npm install              # Install frontend dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Production build
npm run typecheck        # TypeScript type check

# Backend
cd backend
pip install -r requirements.txt    # Install Python dependencies
uvicorn app.main:app --reload --port 8000   # Start API server

# ML Training
python ml/train_model.py --dataset data/sample_network_flows.csv
```
