# Bugfix Report — BrandForge

**Date:** 2026-06-15  
**Scope:** Schema consistency, Ollama stability, and error handling  
**Constraints:** No architecture changes, no new features, no UI redesign

---

## Summary

Six stability and consistency issues were fixed across the backend, API layer, and frontends. All changes preserve existing behavior when Ollama is healthy; failures now surface clear messages instead of hanging or returning opaque errors.

---

## 1. Malformed JSON schema in `ai_engine.py`

**File:** `backend/core/ai_engine.py`

**Problem:** The Ollama prompt schema was missing a comma after the `canva_guidance` block, producing invalid example JSON:

```json
"landing_template_type": ""}}

  "sample_usage": {
```

**Fix:** Added the missing comma and closed the `canva_guidance` object correctly:

```json
"landing_template_type": ""
  },

  "sample_usage": {
```

**Impact:** Improves likelihood that the model returns valid, parseable JSON.

---

## 2. Standardized `canva_guidance` naming

**Files:**
- `backend/core/ai_engine.py`
- `frontend/streamlit/ui.py`

**Problem:** The AI prompt and schema used `canva_guidance`, but Streamlit read `data.get("canva", {})`. Legacy or mismatched keys were never normalized in API responses.

**Fix:**
- Added `normalize_brand_data()` in `ai_engine.py` to rename `canva` → `canva_guidance` in all API responses.
- If both keys exist, `canva_guidance` is kept and `canva` is removed.
- Streamlit updated to read `data.get("canva_guidance", {})`.

**Impact:** Consistent field name across prompt, API output, and Streamlit. Web UI does not render Canva data (unchanged).

---

## 3. Standardized personality object schema (`type`)

**Files:**
- `backend/core/ai_engine.py`
- `frontend/web/script.js`
- `frontend/streamlit/ui.py` (already used `type`; no logic change)

**Problem:** The prompt schema defined personality items with `type`, but the web frontend checked `p.trait`, causing labels to fall through to generic fallback text.

**Fix:**
- Added normalization in `normalize_brand_data()`:
  - If `trait` exists without `type`, rename `trait` → `type`.
  - If both exist, remove `trait` and keep `type`.
- Updated `script.js` to render `p.type` instead of `p.trait`.

**Impact:** Personality traits display correctly as `Type: Description` in the web UI. API responses always use `type`.

---

## 4. Timeout handling for Ollama requests

**File:** `backend/core/ai_engine.py`

**Problem:** `requests.post()` calls had no timeout, causing indefinite hangs when Ollama was slow or unresponsive.

**Fix:**
- Introduced `OLLAMA_TIMEOUT` (default `120` seconds), overridable via `.env`.
- Introduced `OLLAMA_BASE_URL` (default `http://localhost:11434`), overridable via `.env`.
- Extracted `_call_ollama()` helper that applies timeout to all Ollama HTTP calls (initial request and retry).

**Impact:** Requests fail predictably after 120s instead of hanging forever.

---

## 5. Error handling when Ollama is unavailable

**Files:**
- `backend/core/ai_engine.py`
- `backend/api/brand_routes.py`
- `frontend/web/api.js`
- `frontend/streamlit/ui.py`
- `ai_engine.py` (CLI shim)
- `backend/core/__init__.py`

**Problem:** Connection failures, timeouts, and HTTP errors surfaced as generic exceptions or unhelpful `"Server error"` messages.

**Fix:**

### Backend exceptions (`ai_engine.py`)
| Exception | When raised | Message |
|-----------|-------------|---------|
| `OllamaTimeoutError` | Request exceeds timeout | Brand generation timed out… |
| `OllamaUnavailableError` | Connection refused, HTTP error | Ollama is not running / returned an error |
| `OllamaError` | Base class for Ollama failures | — |

### API route (`brand_routes.py`)
| Exception | HTTP status | Response body |
|-----------|-------------|---------------|
| `OllamaTimeoutError` | 504 | `{"error": "…"}` |
| `OllamaUnavailableError` | 503 | `{"error": "…"}` |
| `OllamaError` | 503 | `{"error": "…"}` |
| `ValueError` (bad JSON) | 422 | `{"error": "…"}` |
| Other | 500 | `{"error": "An unexpected error…"}` |

### Web API client (`api.js`)
- Parses `error` field from failed API responses and passes it to the existing `throw new Error(message)` path.

### Streamlit UI (`ui.py`)
- Wraps `generate_brand()` in try/except and displays `st.error()` with the specific message.

### CLI (`ai_engine.py` `__main__`)
- Catches Ollama errors and exits with a readable message.

**Impact:** Users see actionable fallback messages. Existing web UI error display (`"Something went wrong"`) is unchanged structurally; API error text is now available in the thrown error for debugging. No HTML/CSS changes.

---

## Files changed

| File | Changes |
|------|---------|
| `backend/core/ai_engine.py` | Schema fix, `_call_ollama()`, timeouts, exceptions, `normalize_brand_data()` |
| `backend/api/brand_routes.py` | Try/except with structured JSON error responses |
| `backend/core/__init__.py` | Export new exception classes |
| `ai_engine.py` | Re-export exceptions |
| `frontend/web/script.js` | `p.trait` → `p.type` |
| `frontend/web/api.js` | Parse API error messages from response body |
| `frontend/streamlit/ui.py` | `canva_guidance` naming, Ollama error handling |

---

## New environment variables (optional)

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_TIMEOUT` | `120` | Request timeout in seconds |

---

## What was not changed

- Project architecture (Flask, Blueprint, file layout)
- HTML/CSS layout or styling
- New API endpoints or features
- Ollama model name or generation parameters
- Logo generation logic
- Payment, auth, or deployment

---

## Verification

- `py_compile` passes on all modified Python files
- `normalize_brand_data()` unit check: `canva` → `canva_guidance`, `trait` → `type`
- Existing success path unchanged: `generate_brand()` still returns normalized JSON on successful Ollama response
