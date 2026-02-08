import streamlit as st
import json
import re
import dotenv
from ai_engine import generate_brand, extract_json

DEV_MODE = True 

FREE_FIELDS = [
    "brand_name",
    "brand_personality",
    "color_palette"
]

st.set_page_config(
    page_title="Brandkit AI",
    
    layout="centered"
)



def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_color_name(hex_color):
    try:
        r, g, b = hex_to_rgb(hex_color)

        # Hue detection (very reliable for branding use)
        if g > r and g > b:
            base = "Green"
        elif r > g and r > b:
            base = "Red"
        elif b > r and b > g:
            base = "Blue"
        elif r > 200 and g > 200 and b > 200:
            return "Soft White"
        else:
            base = "Neutral"

        brightness = (r + g + b) / 3

        if brightness > 200:
            prefix = "Light"
        elif brightness > 130:
            prefix = "Soft"
        else:
            prefix = "Deep"

        return f"{prefix} {base}"

    except:
        return "Custom Color"


def get_free_preview(data):
    return {k: data[k] for k in FREE_FIELDS}


DEV_MODE = True 



st.markdown("""
<style>
body {
    background-color: #FAFAFA;
}
</style>
""", unsafe_allow_html=True)

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
#st.divider()


idea = st.text_area(
    "Describe your business idea",
    placeholder="e.g. An online plant shop for urban millennials who want low-maintenance greenery...",
    height=120
)

generate = st.button("✨ Generate Brand")
#if st.button("✨ Generate Brand", use_container_width=True):
    


if generate and idea:
    with st.spinner("Crafting your brand identity..."):
        output = generate_brand(idea)
        st.session_state["brand_data"] = extract_json(output)
if "brand_data" not in st.session_state:
    st.stop()

data = st.session_state["brand_data"]

def is_hex(color):
    return isinstance(color, str) and re.match(r"^#([A-Fa-f0-9]{6})$", color)

colors = data["color_palette"]

for key in ["primary", "secondary", "accent"]:
    if not is_hex(colors.get(key, "")):
        colors[key] = "#E5E7EB"  
st.success("Your brand is ready ✨")



st.divider()
st.markdown("## Brand Overview")

col1, col2 = st.columns(2)

# Add a small spacer so both sides start at the same vertical level
st.markdown("<br>", unsafe_allow_html=True)

# -------- LEFT COLUMN --------
with col1:
    st.markdown("### Brand Name")
    st.markdown(f"**{data.get('brand_name','')}**")

    st.markdown("### Brand Personality")

    personality = data.get("brand_personality")

    if not personality:
        personality = [
            {
                "type": "Approachable",
                "description": "Warm, friendly, and easy to connect with."
            }
        ]

    for trait in personality:
        if isinstance(trait, dict):
            title = trait.get("type")
            desc = trait.get("description")

            if title:
                st.markdown(f"**{title}**")
            if desc:
                st.markdown(f"*{desc}*")

        elif isinstance(trait, str):
            st.markdown(f"• {trait}")

# -------- RIGHT COLUMN --------
with col2:
    st.markdown("### Brand Voice")

    brand_voice = data.get("brand_voice", {})
    language = brand_voice.get("language_tone", "")
    tone = brand_voice.get("tone", "")
    if language.lower() in ["english", "hindi", "arabic", "french"]:
        language = "Friendly, clear, and professional"

    if isinstance(brand_voice, dict):
        language = brand_voice.get("language_tone", "")
        tone = brand_voice.get("tone", "")
    
        if language:
            st.markdown("#### Language Style")
            st.info(language or "Friendly, clear, and professional")

        if tone:
            st.markdown("#### Emotional Tone")
            st.info(tone or "Warm and inspiring")
    else:
        st.info(brand_voice)



st.divider()


st.markdown("## Color Palette")

cols = st.columns(3)
colors = data.get("color_palette", {})
if not colors.get("accent"):
    colors["accent"] = "#FFC107"  # warm yellow fallback


for i, (name, value) in enumerate(colors.items()):
    color_name = get_color_name(value)
    with cols[i]:
        st.markdown(
            f"""
            <div style="
                background-color:{value if value.startswith('#') else '#eee'};
                height: 180px;
                padding: 32px;
                border-radius: 16px;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-shadow: 0px 4px 12px rgba(0,0,0,0.1);
            ">
            {name.capitalize()}<br>{color_name}.{value}
            </div>
            """,
            unsafe_allow_html=True
        )


st.divider()


st.markdown("## Typography")

typography = data.get("typography") or {}

heading_font = typography.get("heading") or "Inter"
body_font = typography.get("body") or "Inter"


col1, col2 = st.columns(2)

with col1:
    st.markdown("### Heading Font")
    st.write(heading_font)

with col2:
    st.markdown("### Body Font")
    st.write(body_font)

    #st.markdown(data["typography"]["body"])


st.divider()


st.markdown("## Logo Concept")

logo = data.get("logo_concept", "")

if isinstance(logo, dict):
    description = logo.get("image") or logo.get("description", "")
    st.info(description)
else:
    st.info(logo)


st.divider()


st.markdown("## Sample Usage")

st.markdown("### Website Headline")
st.markdown(f"> {data['sample_usage']['website_headline']}")

st.markdown("### Instagram Bio")
st.markdown(f"_{data['sample_usage']['instagram_bio']}_")


if "brand_data" in st.session_state:

    brand_json = json.dumps(
        st.session_state["brand_data"],
        indent=2
    )
    col1,col2,col3=st.columns([1,2,1])
    with col2:
        st.download_button(
            label="⬇ Download Brand Kit (JSON)",
            data=brand_json,
            file_name="brandkit.json",
            mime="application/json",
            use_container_width=True
        )

