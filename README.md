# xIDS — Explainable Intrusion Detection System

## Honest Scope & Limitations

xIDS is a lab-grade post-flow ML network intrusion detection prototype trained on public IDS data (CICIDS2017). Detection occurs after a network connection terminates, not in real time. This is not a production NDR or UEBA system.

- Models are trained on CICIDS2017 Clean dataset, not real enterprise baselines
- Isolation Forest detects anomalies, XGBoost classifies attack type
- SHAP explains which features drove each detection
- LLM generates plain English summaries for analysts
- Deployable on Linux via Docker Compose

## Stack
FastAPI · PostgreSQL · React · XGBoost · SHAP · Anthropic Claude API · Docker
