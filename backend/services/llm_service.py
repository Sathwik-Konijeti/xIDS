import anthropic
import os

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def generate_explanation(attack_type: str, confidence: float, shap_features: dict) -> str:
    try:
        features_text = "\n".join([
            f"- {name}: value={info['value']}, SHAP contribution={info['shap']:.4f}"
            for name, info in shap_features.items()
        ])

        prompt = f"""You are a cybersecurity analyst reviewing an intrusion detection alert.

Alert details:
- Attack type: {attack_type}
- Model confidence: {confidence * 100:.1f}%

Top 5 features that drove this detection (SHAP values):
{features_text}

Write a concise 2-3 sentence plain English explanation of why this alert was triggered, based only on the features provided. Focus on what the feature values suggest about the network behavior. Do not invent context not present in the data."""

        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text

    except Exception as e:
        return f"Explanation unavailable: {str(e)}"
