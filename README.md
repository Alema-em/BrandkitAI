# BrandKit AI

BrandKit AI turns a short business idea into a structured brand identity — colors, typography, logo concept, website mockup, moodboard and social copy — powered by a local LLM through Ollama.

The primary experience is a single-page web app (`frontend/web/`) served by Flask. An optional Streamlit dashboard is included for development and demos.

---

## Screenshots

A quick look at the BrandKit UI — from a single idea to a client-ready brand deck.

### Website preview

Interactive browser-style homepage mockup with industry-aware hero imagery, typography and CTA.
<img width="1618" height="887" alt="image" src="https://github.com/user-attachments/assets/e7a5b33c-3c9f-4ecd-9b81-d7e209f86ba2" />



### Brand system

Unified design system strip: palette, typography, logo mark, and brand voice.

<img width="987" height="205" alt="image" src="https://github.com/user-attachments/assets/7008014c-9420-4423-afcd-0e4385230a75" />


### Moodboard

Editorial six-image moodboard matched to the brand’s industry category.

<img width="1413" height="442" alt="image" src="https://github.com/user-attachments/assets/f97f0759-e753-42db-acba-3b7425563105" />


### Social assets

Instagram and LinkedIn launch previews generated alongside the brand kit.
<img width="1600" height="863" alt="image" src="https://github.com/user-attachments/assets/883a34ea-9821-4ae0-ba4f-466616088519" />


---

## Features

- **Brand identity generation** — name, personality and positioning from a one-line idea
- **Color palette creation** — primary, secondary and accent colors
- **Typography recommendations** — heading and body font pairings
- **Logo concept generation** — SVG mark concepts by industry archetype
- **Website mockup generation** — interactive browser-style homepage preview
- **Moodboard creation** — editorial 6-image visual world by category
- **Social media asset generation** — Instagram and LinkedIn post previews
- **PDF export** — downloadable brand preview document

---

## Tech stack

| Layer | Technology |
|-------|------------|
| AI | [Ollama](https://ollama.com) + `llama3.1:8b` |
| Backend | Python, Flask, flask-cors |
| PDF export | fpdf2 |
| Image output | Pillow |
| Frontend | Vanilla HTML, CSS, JavaScript (no build step) |
| Alternate UI | Streamlit |

---

## Project structure

```
Brand/
├── backend/                 # Python API and core logic
│   ├── main.py              # Flask app factory
│   ├── api/
│   │   ├── brand_routes.py  # POST /generate-brand
│   │   └── export_routes.py # POST /export-pdf
│   └── core/
│       ├── ai_engine.py     # Ollama integration, JSON parsing
│       └── pdf_export.py    # Brand kit PDF builder
├── frontend/
│   ├── web/                 # Primary UI (HTML/CSS/JS)
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── reveal-v2.css
│   │   ├── reveal-v3.css
│   │   ├── script.js
│   │   └── api.js
│   └── streamlit/
│       └── ui.py            # Alternate dashboard UI
├── docs/                    # Audit notes and bugfix log
├── screenshots/             # README visuals
├── assets/                  # Reserved for static brand assets
├── generated/               # Logo output (gitignored)
├── server.py                # Flask entry point shim
├── ui.py                    # Streamlit entry point shim
├── ai_engine.py             # Import shim for backward compatibility
└── requirements.txt
```

---

## How to run

### Prerequisites

1. **Python 3.10+**
2. **Ollama** installed and running locally
3. Model available: `ollama pull llama3.1:8b`

### Setup

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Optional: create `.env` in the project root:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=120
```

### Web UI (recommended)

```bash
python server.py
```

Open **http://127.0.0.1:5000**, enter a brand idea, and click **Generate**.

### Streamlit dashboard (alternate)

```bash
streamlit run ui.py
```

### API

```bash
curl -X POST http://127.0.0.1:5000/generate-brand \
  -H "Content-Type: application/json" \
  -d "{\"idea\": \"A sustainable coffee shop for remote workers\"}"
```

---

## Known limitations

- **Requires Ollama locally** — generation fails if Ollama is not running or the model is missing
- **Generation latency** — `llama3.1:8b` can take 30–120+ seconds depending on hardware; timeouts are configurable via `OLLAMA_TIMEOUT`
- **Moodboard images** — curated Unsplash URLs by industry archetype, not AI-generated imagery
- **No authentication** — single-user local/demo use; no accounts or persistence beyond browser session storage
- **PDF export** — summary document; not a full design handoff package
- **Internet required for moodboard** — external image URLs load from Unsplash CDN

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PROJECT_AUDIT.md](docs/PROJECT_AUDIT.md) | Structure audit and dependency notes |
| [docs/BUGFIX_REPORT.md](docs/BUGFIX_REPORT.md) | Stability and schema fixes log |

---

## License

Not specified in this repository.
