# xIDS — Explainable Post-Flow Intrusion Detection

xIDS is a lab-grade, post-flow intrusion detection prototype built for learning and portfolio use. It scores network flows with machine learning (Isolation Forest + XGBoost), explains decisions with SHAP, enriches alerts with IP reputation, and presents everything in a small SOC-style dashboard.

> This is a demo / research system, not a production NDR or UEBA product.

---

## What xIDS Does

- Ingests network flow records (CICIDS/UNSW-style features) via a FastAPI endpoint
- Runs a tiered detection pipeline:
  - **Tier 1:** Isolation Forest anomaly detection on benign-trained data
  - **Tier 2:** XGBoost multi-class attack classification on flagged flows
  - **Tier 3:** TreeSHAP feature attribution for explainable alerts
- Optionally generates short natural-language explanations from SHAP output using an LLM
- Enriches alerts with AbuseIPDB IP reputation (with PostgreSQL caching)
- Deduplicates noisy alerts into incidents (same source IP in a time window)
- Lets analysts review alerts, see explanations, and submit feedback (TP / FP / suspicious)
- Exposes a React + Tailwind dashboard for alert triage and simple stats

---

## Architecture

**Data in:**
Flows are exported from pcap or a lab dataset (e.g. CICIDS2017, UNSW-NB15) and POSTed as JSON to `/ingest`.

**Backend (FastAPI + PostgreSQL):**

- **Tier 1 - Isolation Forest**
  Scores every flow using a model trained on benign traffic from a public IDS dataset.

- **Tier 2 - XGBoost**
  Classifies flows flagged by Tier 1 into attack types with a confidence score.

- **Tier 3 - SHAP (and optional LLM)**
  Uses TreeSHAP on the XGBoost model to extract top contributing features per alert.
  Optionally, an LLM turns those features into a short human-readable explanation.

- **Enrichment & Deduplication**
  Looks up public source IPs in AbuseIPDB with a 24-hour cache.
  Groups repeated alerts from the same source IP within a time window under a single `incident_id`.

- **Storage**
  PostgreSQL tables for:
  - `users` (auth + roles)
  - `alerts` (scores, labels, SHAP features, enrichment, feedback, incident_id)
  - `flows` and `ip_reputation` cache (optional)

**API & IAM:**

- JWT authentication (`/auth/token`)
- Roles: `admin`, `analyst`, `viewer` — enforced via FastAPI dependencies
- Core routes:
  - `POST /ingest` — ingest flows
  - `GET /alerts`, `GET /alerts/{id}` — alert listing and details
  - `POST /alerts/{id}/feedback` — analyst feedback
  - `GET /alerts/incidents` — grouped incidents
  - `GET /stats` — basic metrics

**Frontend (React + Vite + Tailwind):**

- Login screen (JWT)
- Main dashboard:
  - Alert table (filterable, clickable)
  - Incident groups view
  - Alert detail panel with SHAP bar chart, enrichment, and explanation
  - Stats panel (alerts today, top attack types, tier distribution)

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Backend | FastAPI, Pydantic, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL |
| ML | scikit-learn (Isolation Forest), XGBoost, SHAP TreeSHAP |
| LLM (optional) | Anthropic Claude API |
| Threat Intel | AbuseIPDB API (with caching) |
| Frontend | React, Vite, TailwindCSS, Recharts |
| Deployment | Docker, Docker Compose |
| Traffic Source | Flow replayer (lab CSV replay) or CICFlowMeter |

---

## Repository Layout

```
xids/
├── docker-compose.yml
├── .env.example
├── README.md
├── offline_training.ipynb
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── auth.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── models/
│   │   ├── xgb_model.pkl
│   │   └── isolation_forest.pkl
│   ├── routes/
│   │   ├── alerts.py
│   │   ├── auth.py
│   │   ├── flows.py
│   │   ├── ingest.py
│   │   └── stats.py
│   └── services/
│       ├── detection.py
│       ├── shap_service.py
│       ├── llm_service.py
│       ├── threat_intel.py
│       └── deduplication.py
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── AlertCard.jsx
│       │   ├── AlertFeed.jsx
│       │   ├── AlertHistory.jsx
│       │   ├── ExplanationCard.jsx
│       │   ├── IncidentGroup.jsx
│       │   ├── ShapChart.jsx
│       │   └── StatsPanel.jsx
│       └── services/
│           ├── api.js
│           └── websocket.js
└── flow_replayer/
    ├── Dockerfile
    └── replayer.py
```

---

## Getting Started

### Prerequisites

- Linux or WSL2 (required for Docker host networking)
- Docker + Docker Compose installed
- Optional API keys:
  - Anthropic API key (LLM explanations)
  - AbuseIPDB API key (IP reputation)

You also need pre-trained models from the offline notebook:
- `backend/models/isolation_forest.pkl`
- `backend/models/xgb_model.pkl`

### 1. Configure Environment

```bash
git clone https://github.com/Sathwik-Konijeti/xIDS.git
cd xids
cp .env.example .env
```

Edit `.env` with:
- PostgreSQL connection details
- JWT secret and token settings
- AbuseIPDB and Anthropic API keys (optional)

### 2. Train Models (Offline)

Use `offline_training.ipynb` to:
- Load CICIDS2017 Clean dataset
- Train Isolation Forest on benign traffic only
- Train XGBoost on labeled attack data
- Save `isolation_forest.pkl` and `xgb_model.pkl` into `backend/models/`

This step is done once before building images.

### 3. Run with Docker Compose

```bash
docker-compose up --build
```

By default:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- PostgreSQL: port 5432

---

## Using xIDS

### Authenticate

Create an initial user via admin script or SQL insert, then:

```bash
curl -X POST http://localhost:8000/auth/token \
  -d "username=analyst&password=yourpassword"
```

Or log in from the frontend. JWTs carry the user role: `admin`, `analyst`, or `viewer`.

### Ingest Flows

Run the flow replayer to send CICIDS CSV data to `/ingest`:

```bash
docker-compose up flow_replayer
```

Or post a single flow manually:

```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"src_ip": "10.0.0.5", "dst_ip": "192.0.2.10", "Flow Duration": 123, "..."}'
```

For each flow the backend:
1. Scores it with Isolation Forest
2. If anomalous, runs XGBoost; if confident enough, runs TreeSHAP
3. Optionally calls the LLM for a short explanation
4. Optionally enriches with AbuseIPDB
5. Deduplicates into an `incident_id`
6. Stores the alert in PostgreSQL

### Triage in the Dashboard

From http://localhost:3000:
- View recent alerts with attack type, scores, tier, and incident ID
- Open an alert to see model scores, SHAP chart, IP reputation, and LLM explanation
- Switch to incidents view to see grouped alerts per source IP
- As an analyst: mark alerts as true positive / false positive / suspicious and add comments

---

## Limitations

xIDS is intentionally limited and not suitable for production:

- **Training data:** Models are trained on public IDS datasets, not real organization baselines
- **Post-flow detection:** Analysis happens after connections close — xIDS cannot block traffic in real time
- **No behavioral analytics:** No UEBA or long-term user/host behavior modeling — operates on per-flow features only
- **Platform security:** JWT and RBAC exist but hardening is minimal — suitable for lab/demo only
- **Performance:** Designed for lab traffic and pcaps — no guarantees at scale

---

## Future Work

- Collecting and modeling long-term flows from a lab network for per-host behavior baselines
- Better monitoring, logging, and SIEM/SOAR integration
- Exploring more advanced models and additional datasets

---

## Project Status

xIDS is a personal project focused on:
- Practicing ML-based intrusion detection in a realistic end-to-end pipeline
- Applying explainable AI (SHAP + optional LLM) to security alerts
- Building a fully defensible system for technical interviews
