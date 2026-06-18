import json

import streamlit as st

from backend.core.ai_engine import (
    OllamaError,
    OllamaTimeoutError,
    OllamaUnavailableError,
    generate_brand,
)

st.set_page_config(
    page_title="Brandkit AI",
    layout="centered"
)


def safe_get(data, key, default):
    """Safe getter that never returns None."""
    return data.get(key, default)


st.title("Brandkit AI")
st.markdown(
    """
    <p style="color: #9CA3AF; font-size: 16px;">
    Turn your business idea into a complete brand identity in seconds.
    Enter your idea below and let AI design your brand kit.
    </p>
    """,
    unsafe_allow_html=True
)

idea = st.text_area(
    "Describe your business idea",
    placeholder="e.g. An online plant shop for urban millennials who want low-maintenance greenery...",
    height=120
)

generate = st.button("✨ Generate Brand")

if generate and idea:
    with st.spinner("Crafting your brand identity..."):
        try:
            st.session_state["brand_data"] = generate_brand(idea)
        except OllamaTimeoutError as e:
            st.error(str(e))
        except OllamaUnavailableError as e:
            st.error(str(e))
        except OllamaError as e:
            st.error(str(e))
        except ValueError as e:
            st.error(str(e))
        except Exception:
            st.error("An unexpected error occurred during brand generation. Please try again.")

if "brand_data" not in st.session_state:
    st.stop()

data = st.session_state["brand_data"]

st.success("Your brand is ready ✨")
st.divider()

st.markdown("## Brand Overview")

col1, col2 = st.columns(2)

with col1:
    st.markdown("### Brand Name")
    brand_name = safe_get(data, "brand_name", "Your Brand Name")
    st.markdown(f"**{brand_name}**")

    st.markdown("### Brand Personality")

    personality = safe_get(data, "brand_personality", [])
    if not personality:
        personality = [
            {
                "type": "Approachable",
                "description": "Warm, friendly, and easy to connect with."
            }
        ]

    for trait in personality:
        if isinstance(trait, dict):
            st.markdown(f"**{trait.get('type','Brand Trait')}**")
            st.markdown(f"*{trait.get('description','')}*")
        else:
            st.markdown(f"• {trait}")

with col2:
    st.markdown("### Brand Voice")

    brand_voice = safe_get(data, "brand_voice", {})

    language = safe_get(
        brand_voice,
        "language_tone",
        "Friendly, clear, and professional"
    )

    tone = safe_get(
        brand_voice,
        "tone",
        "Warm and inspiring"
    )

    if language.lower() in ["english", "hindi", "arabic", "french"]:
        language = "Friendly, clear, and professional"

    st.markdown("#### Language Style")
    st.info(language)

    st.markdown("#### Emotional Tone")
    st.info(tone)

st.divider()

st.markdown("## Color Palette")

colors = data.get("color_palette", {})

primary = colors.get("primary", "#5CFF87")
secondary = colors.get("secondary", "#A9E06D")
accent = colors.get("accent", "#FFC107")

cols = st.columns(3)

with cols[0]:
    st.markdown(
    f"""
    <div style="
        background:{primary};
        height: 180px;
        padding: 32px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
    ">
    <b>Primary</b><br>{primary}
    </div>
    """,
    unsafe_allow_html=True
)

with cols[1]:
    st.markdown(
    f"""
    <div style="
        background:{secondary};
        height: 180px;
        padding: 32px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
    ">
    <b>Secondary</b><br>{secondary}
    </div>
    """,
    unsafe_allow_html=True
)

with cols[2]:
    st.markdown(
    f"""
    <div style="
        background:{accent};
        height: 180px;
        padding: 32px;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
    ">
    <b>Accent</b><br>{accent}
    </div>
    """,
    unsafe_allow_html=True
)

st.divider()

st.markdown("## Typography")

typography = data.get("typography", {})

heading_font = typography.get("heading")
body_font = typography.get("body")

if not heading_font or len(heading_font) < 3:
    heading_font = "Playfair Display"

if not body_font or len(body_font) < 3:
    body_font = "Poppins"

col1, col2 = st.columns(2)

with col1:
    st.markdown("### Heading Font")
    st.write(f"**{heading_font}**")

with col2:
    st.markdown("### Body Font")
    st.write(f"**{body_font}**")

st.markdown(
f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Poppins:wght@400&display=swap');

h3.heading-demo {{
    font-family: 'Playfair Display', serif;
}}

p.body-demo {{
    font-family: 'Poppins', sans-serif;
}}
</style>

<h3 class="heading-demo">This is your heading style</h3>
<p class="body-demo">This is your body text style — clean, modern, and readable.</p>
""",
unsafe_allow_html=True
)

st.divider()

st.markdown("## Logo Concept")

logo = safe_get(data, "logo_concept", "A clean, modern logo inspired by your idea.")
st.info(logo)

st.divider()

st.markdown("## Edit in Canva 🎨")

canva_guidance = data.get("canva_guidance", {})

st.markdown("### ✨ One-click design links")

st.markdown(f"""
- 🖼 **Edit Logo in Canva:**
  https://www.canva.com/templates/EAFQ6leaf-logo/

- 📸 **Edit Brand Poster:**
  https://www.canva.com/templates/EAFQ6brand-poster/

- 🌐 **Edit Landing Page:**
  https://www.canva.com/templates/EAFQ6green-website/
""")

st.markdown("## Sample Usage")

sample = data.get("sample_usage", {})

website_headline = sample.get("website_headline")
instagram_bio = sample.get("instagram_bio")

st.markdown("### Website Headline")

if website_headline:
    st.info(website_headline)
else:
    st.info("AI will generate a headline when the model returns one.")

st.markdown("### Instagram Bio")

if instagram_bio:
    st.info(instagram_bio)
else:
    st.info("AI will generate an Instagram bio when the model returns one.")

st.divider()

brand_json = json.dumps(data, indent=2)

col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    st.download_button(
        label="⬇ Download Brand Kit (JSON)",
        data=brand_json,
        file_name="brandkit.json",
        mime="application/json",
        use_container_width=True
    )
