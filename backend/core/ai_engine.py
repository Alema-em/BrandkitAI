import json
import os
import re
from datetime import datetime
from pathlib import Path

import requests
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFont

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=PROJECT_ROOT / ".env")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", "120"))


class OllamaError(Exception):
    """Base error for Ollama communication failures."""


class OllamaUnavailableError(OllamaError):
    """Raised when Ollama cannot be reached or returns an error."""


class OllamaTimeoutError(OllamaError):
    """Raised when an Ollama request exceeds the configured timeout."""


def extract_json(text: str):
    matches = re.findall(r"\{.*\}", text, re.DOTALL)
    if not matches:
        raise ValueError("No JSON found in model output")

    json_text = matches[-1]

    try:
        return json.loads(json_text)
    except Exception as e:
        raise ValueError(f"Invalid JSON from model:\n{json_text}") from e


def normalize_brand_data(data: dict) -> dict:
    """Normalize brand response fields for consistent API output."""
    if "canva" in data:
        if "canva_guidance" not in data:
            data["canva_guidance"] = data.pop("canva")
        else:
            del data["canva"]

    personality = data.get("brand_personality")
    if isinstance(personality, list):
        normalized = []
        for item in personality:
            if isinstance(item, dict):
                item = dict(item)
                if "type" not in item and "trait" in item:
                    item["type"] = item.pop("trait")
                elif "trait" in item:
                    del item["trait"]
            normalized.append(item)
        data["brand_personality"] = normalized

    return data


def _call_ollama(payload: dict) -> str:
    url = f"{OLLAMA_BASE_URL}/api/generate"

    try:
        response = requests.post(url, json=payload, timeout=OLLAMA_TIMEOUT)
    except requests.exceptions.Timeout as e:
        raise OllamaTimeoutError(
            "Brand generation timed out. Ollama took too long to respond. Please try again."
        ) from e
    except requests.exceptions.ConnectionError as e:
        raise OllamaUnavailableError(
            "Ollama is not running. Start Ollama and ensure llama3.1:8b is available."
        ) from e
    except requests.exceptions.RequestException as e:
        raise OllamaUnavailableError(
            "Could not reach Ollama. Check that the service is running and try again."
        ) from e

    if response.status_code != 200:
        raise OllamaUnavailableError(
            f"Ollama returned an error (HTTP {response.status_code})."
        )

    return response.json()["response"]


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
  "website_hero": {{
    "headline": "",
    "subheadline": "",
    "cta": "",
    "visual_direction": ""
  }},
  "social_media": {{
    "instagram": {{
      "visual_concept": "",
      "caption": ""
    }},
    "linkedin": {{
      "headline": "",
      "post": ""
    }}
  }},
  "brand_voice": {{
    "language_tone": "",
    "tone": ""
  }},
  "canva_guidance": {{
    "logo_template_type": "",
    "poster_template_type": "",
    "landing_template_type": ""
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
- website_hero.headline: max 8 words, punchy and benefit-led.
- website_hero.subheadline: max 20 words, supports the headline.
- website_hero.cta: max 4 words, action-oriented button text.
- website_hero.visual_direction: max 15 words, describes hero imagery and layout.
- social_media.instagram.visual_concept: max 20 words, describes the post visual.
- social_media.instagram.caption: max 30 words, on-brand Instagram caption.
- social_media.linkedin.headline: max 10 words, professional hook.
- social_media.linkedin.post: max 60 words, launch announcement post.

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

    raw_text = _call_ollama(payload)

    try:
        return extract_json(raw_text)
    except ValueError:
        print("⚠️ First attempt failed — retrying once...")
        raw_text = _call_ollama(payload)
        return extract_json(raw_text)


def generate_brand(business_idea: str):
    data = generate_brand_ollama(business_idea)
    return normalize_brand_data(data)


def generate_vector_logo(brand_data):
    """
    Generates a clean, real logo PNG based on the AI logo concept.
    Saves both SVG (simple vector) and PNG preview.
    """

    name = brand_data.get("brand_name", "Brand")
    colors = brand_data.get("color_palette", {})
    primary = colors.get("primary", "#5CFB87")

    img = Image.new("RGB", (800, 800), "white")
    draw = ImageDraw.Draw(img)

    draw.ellipse((250, 200, 550, 500), fill=primary)
    draw.ellipse((350, 450, 420, 520), fill="#2F855A")

    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except OSError:
        font = ImageFont.load_default()

    text_w, _text_h = draw.textbbox((0, 0), name, font=font)[2:]
    draw.text(
        ((800 - text_w) // 2, 600),
        name,
        fill="#2F855A",
        font=font
    )

    generated_dir = PROJECT_ROOT / "generated"
    os.makedirs(generated_dir, exist_ok=True)

    png_path = generated_dir / f"{name}_logo.png"
    img.save(png_path)

    svg_path = generated_dir / f"{name}_logo.svg"
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(f"""
        <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="350" r="150" fill="{primary}"/>
          <circle cx="385" cy="470" r="18" fill="#2F855A"/>
          <text x="400" y="650" text-anchor="middle"
                font-size="36" fill="#2F855A">{name}</text>
        </svg>
        """)

    return str(svg_path), str(png_path)


if __name__ == "__main__":
    idea = input("Describe your business idea:\n")

    try:
        data = generate_brand(idea)
    except OllamaUnavailableError as e:
        print(f"\nError: {e}")
        raise SystemExit(1) from e
    except OllamaTimeoutError as e:
        print(f"\nError: {e}")
        raise SystemExit(1) from e

    filename = PROJECT_ROOT / f"brand_preview_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("\nAI Brand Preview:\n")
    print(json.dumps(data, indent=2))
