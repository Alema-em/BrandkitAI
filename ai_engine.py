import requests
import os
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

USE_OLLAMA = True
load_dotenv(dotenv_path=Path(".env"))

# --------------------------------------------------
# 1) JSON EXTRACTOR (simple + reliable)
# --------------------------------------------------

def extract_json(text: str):
    matches = re.findall(r"\{.*\}", text, re.DOTALL)
    if not matches:
        raise ValueError("No JSON found in model output")

    json_text = matches[-1]

    try:
        return json.loads(json_text)
    except Exception as e:
        raise ValueError(f"Invalid JSON from model:\n{json_text}") from e


# --------------------------------------------------
# 2) MAIN GENERATOR (llama3.1, one-step JSON)
# --------------------------------------------------

def generate_brand_ollama(business_idea: str):

    strict_json_prompt = f"""
You are BrandForge AI — a professional branding system.

You MUST return ONLY valid JSON — no text, no markdown, no comments.

Follow this EXACT schema:

{{
  "brand_name": "",
  "brand_personality": [
    {{
      "type": "",
      "description": ""
    }}
  ],
  "color_palette": {{
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB"
  }},
  "typography": {{
    "heading": "",
    "body": ""
  }},
  "logo_concept": "",
  "brand_voice": {{
    "language_tone": "",
    "tone": ""
  }},
  "sample_usage": {{
    "website_headline": "",
    "instagram_bio": ""
  }}
}}

RULES:
- Brand name must be real, modern, and marketable.
- Colors must be aesthetic and harmonious.
- Fonts must be real Google Fonts (Playfair Display, Poppins, Inter, Montserrat).
- Logo concept must be visual and professional.
- brand_voice.language_tone must describe HOW the brand speaks (not the language).

Business idea: {business_idea}
"""

    payload = {
        "model": "llama3.1:8b",
        "prompt": strict_json_prompt,
        "stream": False,
        "options": {
            "num_predict": 900,
            "temperature": 0.35
        }
    }

    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload
    )

    if response.status_code != 200:
        raise Exception(response.text)

    raw_text = response.json()["response"]

    # Try once; if invalid, retry automatically
    try:
        return extract_json(raw_text)
    except Exception as e:
        print("⚠️ First attempt failed — retrying once...")
        response = requests.post(
            "http://localhost:11434/api/generate",
            json=payload
        )
        raw_text = response.json()["response"]
        return extract_json(raw_text)


def generate_brand(business_idea: str):
    return generate_brand_ollama(business_idea)


# --------------------------------------------------
# 3) CLEAN MAIN BLOCK (NO DOUBLE PARSING)
# --------------------------------------------------

if __name__ == "__main__":
    idea = input("Describe your business idea:\n")

    data = generate_brand(idea)   # <-- ONLY ONE CALL

    filename = f"brand_preview_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("\nAI Brand Preview:\n")
    print(json.dumps(data, indent=2))
