# Project Audit — BrandForge / Brandkit AI

**Audit date:** 2026-06-15  
**Scope:** Full repository cleanup, structure, and documentation (no functional changes to outputs)

---

## Executive summary

The repository was a flat collection of Python scripts and a static web folder with no dependency manifest, duplicate API calls, orphaned modules, and mixed frontend/backend concerns. This audit reorganized the codebase into `backend/` and `frontend/`, introduced an explicit API layer, fixed broken imports and HTML/CSS issues, removed dead files, and documented architecture and dependencies.

---

## 1. Project structure (before → after)

### Before

```
Brand/
├── ai_engine.py          # Core logic + CLI
├── server.py             # Flask (monolithic)
├── ui.py                 # Streamlit (monolithic)
├── prompts.py            # UNUSED
├── BrandforgeUI/         # Web frontend
├── logo.png / logo.svg   # UNUSED root artifacts
├── generated/            # Output files
└── README.md             # Referenced missing requirements.txt
```

### After

```
Brand/
├── backend/
│   ├── main.py
│   ├── api/brand_routes.py
│   └── core/ai_engine.py
├── frontend/
│   ├── web/              # HTML/CSS/JS + api.js
│   └── streamlit/ui.py
├── docs/                 # Audit and bugfix log
├── screenshots/          # README visuals
├── assets/               # Static assets (reserved)
├── server.py, ui.py, ai_engine.py   # Compatibility shims
├── requirements.txt
├── README.md
└── docs/PROJECT_AUDIT.md
```

---

## 2. Files removed

| File / path | Reason |
|-------------|--------|
| `prompts.py` | Never imported; superseded by inline prompt in `ai_engine` |
| `logo.png`, `logo.svg` (root) | Not referenced by any source file |
| `BrandforgeUI/` | Migrated to `frontend/web/` |
| `BrandforgeUI/.vscode/launch.json` | IDE-only config, not part of application |
| `assets/styles.css` | Empty file, not referenced anywhere |

### Files retained (not removed)

| File | Reason |
|------|--------|
| `generated/Verdi_logo.*` | User-generated output artifacts |
| `brand_preview_*.json` (deleted in git) | Already gitignored preview exports |

---

## 3. Duplicate code removed

| Location | Issue | Action |
|----------|-------|--------|
| `ui.py` | `generate_brand(idea)` called **twice** per button click | Reduced to single call (same output, half the Ollama latency) |
| `ui.py` | Unused imports: `extract_json`, `generate_vector_logo` | Removed |
| `ui.py` | Unused `is_hex()` helper | Removed |
| `ui.py` | Unused `canva` template variables (`logo_template`, etc.) | Removed assignments |
| `ai_engine.py` | Unused `USE_OLLAMA` flag | Removed |
| `ai_engine.py` | Unused `svgwrite` import | Removed (package was never used) |
| `ai_engine.py` | Unused `concept` variable in `generate_vector_logo` | Removed |
| `script.js` | Debug `console.log("JS WORKING")` | Removed |
| `script.js` | Duplicate `// TYPOGRAPHY` comments | Removed |
| `script.js` | Inline `fetch()` duplicated API config | Extracted to `frontend/web/api.js` |
| `style.css` | Duplicate `.card:hover`, `.primary:hover`, `.hero-content` rules | Left in place (cosmetic redundancy only) |

---

## 4. Broken imports fixed

| Issue | Resolution |
|-------|------------|
| `README.md` referenced `requirements.txt` which did not exist | Created `requirements.txt` with pinned minimum versions |
| `ui.py` imported symbols never used (`extract_json`, `generate_vector_logo`) | Removed unused imports (symbols still available via `backend.core.ai_engine`) |
| `ai_engine.py` imported `svgwrite` but never used | Removed import |
| Flat imports (`from ai_engine import …`) broke after move | Added root shims: `ai_engine.py`, `server.py`, `ui.py` |
| `frontend/streamlit/ui.py` | Updated to `from backend.core.ai_engine import generate_brand` |
| `server.py` | Delegates to `backend.main.app` |
| `index.html` missing `</head>` | Added closing tag |

All Python modules pass `py_compile` syntax check. Runtime import of `backend.core.ai_engine` verified.

---

## 5. API layer

### Backend (`backend/api/brand_routes.py`)

- Flask Blueprint `brand_bp`
- Route: `POST /generate-brand`
- Delegates to `backend.core.ai_engine.generate_brand`
- Registered in `backend/main.py` via `create_app()`

### Frontend (`frontend/web/api.js`)

- `API_CONFIG` — base URL and endpoint paths
- `apiUrl()` — URL builder
- `fetchBrand(idea)` — typed fetch wrapper used by `script.js`

This separates HTTP transport (frontend) from route handling (backend) from business logic (core).

---

## 6. Dependency audit

### Python — `requirements.txt`

| Package | Version constraint | Status | Used by |
|---------|-------------------|--------|---------|
| `flask` | >=3.0.0 | **Required** | `backend/main.py` |
| `flask-cors` | >=4.0.0 | **Required** | `backend/main.py` |
| `requests` | >=2.31.0 | **Required** | Ollama HTTP client |
| `python-dotenv` | >=1.0.0 | **Required** | `.env` loading |
| `Pillow` | >=10.0.0 | **Required** | `generate_vector_logo()` |
| `streamlit` | >=1.28.0 | **Required** | Streamlit UI |
| ~~`svgwrite`~~ | — | **Removed** | Was imported but never called |

### JavaScript — `package.json`

**Not present.** The web frontend uses vanilla HTML/CSS/JS with no bundler, transpiler, or npm dependencies. No `package.json` audit applicable.

### External runtime dependencies

| Dependency | Required | Notes |
|------------|----------|-------|
| Ollama | Yes | Must run at `http://localhost:11434` |
| `llama3.1:8b` model | Yes | `ollama pull llama3.1:8b` |
| Google Fonts CDN | Web UI only | Loaded in `index.html` |
| `grainy-gradients.vercel.app` | Web UI only | Noise texture in CSS |

---

## 7. Bugs identified

| Severity | Location | Description | Fixed in cleanup? |
|----------|----------|-------------|-------------------|
| **High** | `ui.py` (old) | Double `generate_brand()` call on every generate | Yes |
| **Medium** | `index.html` | Missing `</head>` — invalid HTML | Yes |
| **Medium** | `style.css` | `body::before` nested inside `body {}` — invalid CSS, noise overlay never applied | Yes |
| **Medium** | `ai_engine.py` prompt | JSON schema missing comma after `canva_guidance` block — may cause invalid AI JSON | No (documented; prompt content unchanged per scope) |
| **Low** | `ui.py` | Reads `data.get("canva")` but AI returns `canva_guidance` — Canva section always uses hardcoded URLs | No (pre-existing; URLs are static anyway) |
| **Low** | `script.js` | Personality uses `p.trait` but AI schema uses `p.type` — trait label may show fallback text | No (display-only mismatch) |
| **Low** | `brand_routes.py` | No validation when `idea` is `null`/empty — passes through to Ollama | No |
| **Low** | `ai_engine.py` | Bare `except` on font load changed to `except OSError` | Yes (narrower exception) |
| **Low** | `ai_engine.py` | `extract_json` uses greedy `re.findall(r"\{.*\}")` — can match wrong JSON in edge cases | No |

---

## 8. Dead code

| Symbol / file | Status |
|---------------|--------|
| `prompts.py` | **Deleted** — entire file unused |
| `generate_vector_logo()` | **Retained** — exported, callable, not wired to any UI |
| `generate_brand_ollama()` | **Retained** — internal implementation |
| `extract_json()` | **Retained** — used internally + exported for testing |
| Root `logo.png` / `logo.svg` | **Deleted** |
| `USE_OLLAMA` variable | **Deleted** |
| `is_hex()` in Streamlit UI | **Deleted** |
| Unused `canva` template vars in Streamlit | **Deleted** |

---

## 9. Performance issues

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Double `generate_brand()` in Streamlit | 2× Ollama inference per click (~seconds each) | **Fixed** — single call |
| No request timeout on Ollama `requests.post` | Hangs indefinitely if Ollama is down | Add `timeout=120` (future) |
| No caching of brand results | Repeated identical ideas re-hit LLM | Add optional cache layer (future) |
| Synchronous blocking in Flask route | Blocks worker during LLM call | Acceptable for local dev; use async/queue for production |
| Large CSS file with duplicate rules | Minor parse/repaint overhead | Consolidate duplicate selectors (cosmetic) |
| External CDN fonts + noise texture | Extra network round-trips on page load | Self-host or preload (future) |

---

## 10. Security notes

| Item | Risk | Notes |
|------|------|-------|
| `debug=True` in Flask | Medium | Acceptable for local dev only |
| CORS wide open | Low | Required for local web UI → API |
| No input sanitization on `idea` | Low | Passed to local Ollama only |
| `unsafe_allow_html=True` in Streamlit | Low | Static template strings only |

---

## 11. `.gitignore` updates

Added `generated/` to prevent committing logo output artifacts.

---

## 12. Entry points (verified)

| Command | Status |
|---------|--------|
| `python -m py_compile` on all `.py` files | Pass |
| `from backend.core.ai_engine import …` | Pass |
| `from backend.main import app` | Requires `flask-cors` installed |
| `streamlit run ui.py` | Requires `streamlit` installed; imports via shim |
| `python server.py` | Requires `flask` + `flask-cors` |

---

## 13. Recommended next steps (out of scope)

1. Fix JSON schema comma in Ollama prompt for more reliable parsing
2. Align `canva` / `canva_guidance` and `trait` / `type` field names across AI schema and UIs
3. Wire `generate_vector_logo()` into Streamlit and web UIs
4. Add request validation and error responses to API (`400` for missing `idea`)
5. Add `timeout` to Ollama HTTP calls
6. Add basic tests for `extract_json` and API routes
7. Consider `package.json` only if introducing a build toolchain for the web frontend

---

## 14. Change log summary

- Reorganized into `backend/` + `frontend/` with API layer
- Removed 5 unused files / folders
- Fixed duplicate API call, broken HTML, invalid CSS nesting
- Created `requirements.txt`, updated `README.md`, `.gitignore`
- Added backward-compatible root shims
- No changes to AI prompt content, Ollama model, or brand JSON output schema
