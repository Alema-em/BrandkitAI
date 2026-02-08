import requests
import os
import json
import re 
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path
from prompts import build_prompt
from prompts import build_json_formatter

USE_OLLAMA = True

load_dotenv(dotenv_path=Path(".env"))

API_KEY = os.getenv("OPENROUTER_API_KEY")
#print("OPENROUTER TOKEN LOADED:", API_KEY[:10] if API_KEY else "NOT FOUND")

#API_URL = "https://openrouter.ai/api/v1/chat/completions"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost",
    "X-Title": "BrandForge AI"
}

import json
import re

def extract_json(text):

    # 1) Grab everything between the first { and the last }
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found in output")

    json_text = match.group()

    # ---------- CLEANING STEPS ----------

    # Normalize smart quotes
    json_text = json_text.replace("“", '"').replace("”", '"')
    json_text = json_text.replace("’", "'")

    # Remove all stray trailing backslashes at line ends
    json_text = re.sub(r"\\\\\s*(?=[,\n}])", "", json_text)

    # Remove escaped quotes inside text fields like \" -> "
    json_text = json_text.replace(r'\"', '"')

    # Remove // comments if any
    json_text = re.sub(r"//.*", "", json_text)

    # Remove trailing commas before } or ]
    json_text = re.sub(r",\s*}", "}", json_text)
    json_text = re.sub(r",\s*]", "]", json_text)

    # Fix common broken patterns where quotes appear mid-string
    json_text = re.sub(
        r'":\s*"([^"]*?)"([^,}]*?)"',
        r'": "\1 \2"',
        json_text
    )

    # Ensure final JSON is wrapped properly
    json_text = json_text.strip()

    try:
        return json.loads(json_text)

    except Exception as e:
        # If it STILL fails, save the cleaned version so you can debug
        raise ValueError(f"JSON parsing failed AFTER cleaning:\n{json_text}") from e


def generate_brand(business_idea):
    if USE_OLLAMA:
        return generate_brand_ollama(business_idea)

    # ---- OpenRouter path (DISABLED FOR NOW) ----
    raise RuntimeError("OpenRouter is disabled. Set USE_OLLAMA = True.")


def generate_brand_ollama(business_idea):
    prompt = build_prompt(business_idea)

    payload = {
        "model": "phi3",
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 400
        }
    }

    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload
    )

    if response.status_code != 200:
        raise Exception(response.text)

    # ✅ DEFINE raw_text HERE
    raw_text = response.json()["response"]

    # ✅ SECOND PASS: format to JSON
    json_text = format_to_json_ollama(raw_text)

    return json_text



def format_to_json_ollama(raw_text):
    formatter_prompt = f"""
    
    You are a STRICT JSON generator.
   

    Return ONLY valid JSON.
    All keys and values must be in double quotes.
    Do not include explanations or markdown.

    You MUST output ALL fields.
    If information is missing, INVENT reasonable defaults.
    DO NOT omit any key.
    DO NOT return null.
    DO NOT return empty lists.

    Return ONLY valid JSON.

    JSON SCHEMA:
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

    brand_voice.language_tone MUST describe HOW the brand speaks,
    not the language itself.
    Examples: "friendly and conversational", "refined and poetic",
    "professional and trustworthy".
    Do NOT use words like English, Hindi, or Arabic here.

    TEXT:
    {raw_text}
    """


    payload = {
        "model": "phi3",
        "prompt": formatter_prompt,
        "stream": False,
        "options": {
            "num_predict": 400
        }
    }

    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload
    )

    if response.status_code != 200:
        raise Exception("Ollama JSON formatting failed")

    return response.json()["response"]


if __name__ == "__main__":
    idea = input("Describe your business idea:\n")
    output = generate_brand(idea)
    if output:
        data = extract_json(output)

        filename = f"brand_preview_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

        print("\nAI Brand Preview:\n", json.dumps(data, indent=2))
