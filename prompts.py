def build_prompt(business_idea):
    return f"""
You are a senior brand strategist.

Generate a detailed brand preview for the following business idea:

{business_idea}
"""


def build_json_formatter(raw_text):
    return f"""
You are a JSON formatter.

Your task:
Convert the following text into STRICTLY valid JSON.

Rules:
- Output ONLY valid JSON
- No markdown
- No explanations
- No extra text

JSON format:
{{
  "brand_name": "",
  "brand_personality": [],
  "color_palette": {{
    "primary": "",
    "secondary": "",
    "accent": ""
  }},
  "typography": {{
    "heading": "",
    "body": ""
  }},
  "logo_concept": "",
  "brand_voice": "",
  "sample_usage": {{
    "website_headline": "",
    "instagram_bio": ""
  }}
}}

TEXT TO CONVERT:
{raw_text}
"""

