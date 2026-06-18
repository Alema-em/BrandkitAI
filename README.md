# BrandForge AI

BrandForge AI turns a short business idea into a structured brand identity — colors, typography, logo concept, website mockup, moodboard, and social copy — powered by a local LLM through Ollama.

The primary experience is a single-page web app (`frontend/web/`) served by Flask. An optional Streamlit dashboard is included for development and demos.

---

## Screenshots

<img width="1690" height="834" alt="BrandForge website preview" src="https://github.com/user-attachments/assets/f35c4162-fab4-4621-8a23-c12f9e536a48" />
<img width="1444" height="831" alt="BrandForge brand system" src="https://github.com/user-attachments/assets/dd30ac05-e21d-4d2a-8181-d01c6f771218" />
<img width="1433" height="747" alt="BrandForge moodboard and social assets" src="https://github.com/user-attachments/assets/11707556-73cd-485f-a47b-379b41b11227" />

Local captures are also available in [`screenshots/`](screenshots/), including [`website-preview.png`](screenshots/website-preview.png).

---

## Features

- **Brand identity generation** — name, personality, and positioning from a one-line idea
- **Color palette creation** — primary, secondary, and accent colors
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
├── docs/                    # Audit notes, bugfix log, roadmap
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

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the 30-day product plan (payments, hosting, accounts, and paid export).

High-level next steps:

1. Public deployment (Render, Railway, or similar)
2. Stripe checkout for full brand kit unlock
3. User accounts and saved brands
4. Higher-quality logo export in the UI
5. Automated tests for API and JSON schema

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
| [docs/ROADMAP.md](docs/ROADMAP.md) | Business and product roadmap |

---

## License

Not specified in this repository.
