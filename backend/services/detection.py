import joblib
import numpy as np
import shap
import os

# load all models once at startup
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(BASE, "models")

iso_forest = joblib.load(os.path.join(MODELS, "isolation_forest.pkl"))
xgb_model = joblib.load(os.path.join(MODELS, "xgb_model.pkl"))
scaler = joblib.load(os.path.join(MODELS, "scaler.pkl"))
le = joblib.load(os.path.join(MODELS, "label_encoder.pkl"))
explainer = joblib.load(os.path.join(MODELS, "shap_explainer.pkl"))

ATTACK_CLASSES = list(le.classes_)

def run_detection(features: dict) -> dict:
    feature_names = list(features.keys())
    raw = np.array(list(features.values()), dtype=float).reshape(1, -1)
    scaled = scaler.transform(raw)

    # tier 1 — isolation forest
    anomaly_score = iso_forest.decision_function(scaled)[0]
    anomaly_pred = iso_forest.predict(scaled)[0]

    if anomaly_pred == 1:
        return {
            "tier_reached": 1,
            "flagged": False,
            "anomaly_score": float(anomaly_score),
            "attack_type": "benign",
            "confidence_score": 0.0,
            "top_shap_features": None,
        }

    # tier 2 — xgboost
    proba = xgb_model.predict_proba(scaled)[0]
    confidence = float(np.max(proba))
    class_idx = int(np.argmax(proba))
    predicted_class = ATTACK_CLASSES[class_idx]

    if confidence < 0.7:
        return {
            "tier_reached": 2,
            "flagged": True,
            "anomaly_score": float(anomaly_score),
            "attack_type": predicted_class,
            "confidence_score": confidence,
            "top_shap_features": None,
        }

    # tier 3 — shap
    shap_output = explainer(scaled)

    # handle different shap output formats
    if hasattr(shap_output, 'values'):
        sv = shap_output.values
        # shape could be (1, n_features, n_classes) or (1, n_features)
        if sv.ndim == 3:
            sv = sv[0, :, class_idx]
        elif sv.ndim == 2:
            sv = sv[0, :]
        else:
            sv = sv[0]
    else:
        # legacy list format
        if isinstance(shap_output, list):
            sv = np.array(shap_output[class_idx][0])
        else:
            sv = np.array(shap_output[0])

    sv = np.array(sv, dtype=float).flatten()
    top_indices = np.argsort(np.abs(sv))[::-1][:5]
    top_shap = {
        feature_names[i]: {
            "value": float(raw[0][i]),
            "shap": float(sv[i])
        }
        for i in top_indices
    }

    return {
        "tier_reached": 3,
        "flagged": True,
        "anomaly_score": float(anomaly_score),
        "attack_type": predicted_class,
        "confidence_score": confidence,
        "top_shap_features": top_shap,
    }
