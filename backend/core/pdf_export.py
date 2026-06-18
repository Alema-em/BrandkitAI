import re

from fpdf import FPDF

DEFAULT_FALLBACK = "Not specified"


def _safe_text(value, fallback=DEFAULT_FALLBACK) -> str:
    if value is None:
        return fallback
    text = str(value).strip()
    return text if text else fallback


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        return (128, 128, 128)
    try:
        return (
            int(hex_color[0:2], 16),
            int(hex_color[2:4], 16),
            int(hex_color[4:6], 16),
        )
    except ValueError:
        return (128, 128, 128)


def get_tagline(brand_data: dict) -> str:
    if brand_data.get("brand_tagline"):
        return _safe_text(brand_data["brand_tagline"])
    if brand_data.get("tagline"):
        return _safe_text(brand_data["tagline"])
    return DEFAULT_FALLBACK


def format_personality(brand_data: dict) -> str:
    personality = brand_data.get("brand_personality")
    if not isinstance(personality, list) or not personality:
        return DEFAULT_FALLBACK

    lines = []
    for item in personality:
        if isinstance(item, str):
            lines.append(f"- {item}")
        elif isinstance(item, dict):
            trait_type = item.get("type") or item.get("trait")
            description = item.get("description")
            if trait_type and description:
                lines.append(f"- {trait_type}: {description}")
            elif description:
                lines.append(f"- {description}")
            elif trait_type:
                lines.append(f"- {trait_type}")

    return "\n".join(lines) if lines else DEFAULT_FALLBACK


def format_brand_voice(brand_data: dict) -> str:
    voice = brand_data.get("brand_voice")
    if not isinstance(voice, dict):
        if isinstance(voice, str) and voice.strip():
            return voice.strip()
        return DEFAULT_FALLBACK

    tone = _safe_text(voice.get("tone"), "")
    language_tone = _safe_text(voice.get("language_tone"), "")

    parts = []
    if tone:
        parts.append(f"Tone: {tone}")
    if language_tone:
        parts.append(f"Language style: {language_tone}")

    return "\n".join(parts) if parts else DEFAULT_FALLBACK


def format_typography(brand_data: dict) -> str:
    typography = brand_data.get("typography")
    if not isinstance(typography, dict):
        return DEFAULT_FALLBACK

    heading = _safe_text(typography.get("heading"), "")
    body = _safe_text(typography.get("body"), "")

    parts = []
    if heading:
        parts.append(f"Heading: {heading}")
    if body:
        parts.append(f"Body: {body}")

    return "\n".join(parts) if parts else DEFAULT_FALLBACK


def format_website_hero(brand_data: dict) -> str:
    hero = brand_data.get("website_hero")
    if not isinstance(hero, dict):
        return DEFAULT_FALLBACK

    return "\n".join([
        f"Headline: {_safe_text(hero.get('headline'))}",
        f"Subheadline: {_safe_text(hero.get('subheadline'))}",
        f"CTA: {_safe_text(hero.get('cta'))}",
        f"Visual direction: {_safe_text(hero.get('visual_direction'))}",
    ])


def format_social_media(brand_data: dict) -> str:
    social = brand_data.get("social_media")
    if not isinstance(social, dict):
        return DEFAULT_FALLBACK

    instagram = social.get("instagram")
    linkedin = social.get("linkedin")
    if not isinstance(instagram, dict):
        instagram = {}
    if not isinstance(linkedin, dict):
        linkedin = {}

    return "\n".join([
        "Instagram",
        f"Visual concept: {_safe_text(instagram.get('visual_concept'))}",
        f"Caption: {_safe_text(instagram.get('caption'))}",
        "",
        "LinkedIn",
        f"Headline: {_safe_text(linkedin.get('headline'))}",
        f"Post: {_safe_text(linkedin.get('post'))}",
    ])


def get_pdf_sections(brand_data: dict) -> list[tuple[str, str, str]]:
    """
    Ordered PDF sections for extensibility.
    Each entry: (section_type, title, value)
    section_type is 'text' or 'color_palette'
    """
    return [
        ("text", "Tagline", get_tagline(brand_data)),
        ("text", "Brand Personality", format_personality(brand_data)),
        ("text", "Brand Voice", format_brand_voice(brand_data)),
        ("color_palette", "Color Palette", ""),
        ("text", "Typography", format_typography(brand_data)),
        ("text", "Logo Concept", _safe_text(brand_data.get("logo_concept"))),
        ("text", "Website Hero", format_website_hero(brand_data)),
        ("text", "Launch Content", format_social_media(brand_data)),
    ]


def pdf_filename(brand_data: dict) -> str:
    name = brand_data.get("brand_name") or "Brand"
    safe = re.sub(r"[^\w\s-]", "", str(name)).strip().replace(" ", "")
    safe = safe or "Brand"
    return f"{safe}-Brand-Kit.pdf"


class BrandPdfBuilder:
    def __init__(self):
        self.pdf = FPDF()
        self.pdf.set_auto_page_break(auto=True, margin=20)
        self.pdf.add_page()
        self.pdf.set_margins(20, 20, 20)

    def add_title(self, text: str):
        self.pdf.set_font("Helvetica", "B", 22)
        self.pdf.cell(0, 14, text, new_x="LMARGIN", new_y="NEXT")
        self.pdf.ln(4)

    def add_section(self, title: str, value: str):
        self.pdf.set_font("Helvetica", "B", 12)
        self.pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")

        self.pdf.set_font("Helvetica", "", 10)
        self.pdf.multi_cell(0, 6, value)
        self.pdf.ln(4)

    def add_color_palette(self, brand_data: dict):
        self.pdf.set_font("Helvetica", "B", 12)
        self.pdf.cell(0, 8, "Color Palette", new_x="LMARGIN", new_y="NEXT")

        palette = brand_data.get("color_palette")
        if not isinstance(palette, dict):
            self.pdf.set_font("Helvetica", "", 10)
            self.pdf.multi_cell(0, 6, DEFAULT_FALLBACK)
            self.pdf.ln(4)
            return

        labels = [
            ("Primary", palette.get("primary", "#808080")),
            ("Secondary", palette.get("secondary", "#808080")),
            ("Accent", palette.get("accent", "#808080")),
        ]

        self.pdf.set_font("Helvetica", "", 10)
        for label, hex_color in labels:
            hex_display = _safe_text(hex_color, "#808080")
            r, g, b = _hex_to_rgb(hex_display)

            y = self.pdf.get_y()
            self.pdf.set_fill_color(r, g, b)
            self.pdf.rect(self.pdf.get_x(), y, 8, 8, style="F")

            self.pdf.set_xy(self.pdf.get_x() + 12, y)
            self.pdf.cell(0, 8, f"{label}: {hex_display}", new_x="LMARGIN", new_y="NEXT")

        self.pdf.ln(4)

    def add_footer(self):
        self.pdf.set_y(-15)
        self.pdf.set_font("Helvetica", "I", 8)
        self.pdf.set_text_color(120, 120, 120)
        self.pdf.cell(0, 10, "Generated with BrandForge", align="C")

    def build(self, brand_data: dict) -> bytes:
        self.add_title(_safe_text(brand_data.get("brand_name"), "Your Brand"))

        for section_type, title, value in get_pdf_sections(brand_data):
            if section_type == "color_palette":
                self.add_color_palette(brand_data)
            else:
                self.add_section(title, value)

        self.add_footer()
        return bytes(self.pdf.output())


def build_brand_pdf(brand_data: dict) -> bytes:
    return BrandPdfBuilder().build(brand_data)
