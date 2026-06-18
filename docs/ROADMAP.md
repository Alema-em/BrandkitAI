# BrandForge — 30-Day Development Roadmap

**Goal:** First paying customer within 30 days  
**Strategy:** Ship the smallest paid product on top of what already works. No rewrites.

---

## Current state (what you have)

| Asset | Status |
|-------|--------|
| Web UI (`frontend/web/index.html`) | Working, served by Flask |
| Brand generation API | `POST /generate-brand` via Ollama |
| Brand kit data | Name, colors, typography, voice, logo concept, sample copy |
| Logo generator | `generate_vector_logo()` exists but **not shown in UI** |
| Monetization hook | UI already says *"Free preview • Upgrade to unlock full brand kit"* |
| Payments | None |
| Public hosting | Local only (`localhost:5000`) |
| User accounts | None |

**Biggest gap:** A customer cannot find, use, or pay for this product today.

---

## Prioritization framework

Features are ranked by **business impact** — how directly they move someone from visitor → paid customer.

| Rank | Meaning |
|------|---------|
| **Must Build** | Blocks revenue or makes the product unpublishable |
| **Should Build** | Improves conversion or delivery enough to matter this month |
| **Nice To Have** | Valuable later; skip until after first payment |

---

## Must Build

*Target: Days 1–14. Without these, there is nothing to sell.*

### 1. Public deployment
**Impact:** Critical — nobody can pay for a localhost app.

- Deploy Flask app to a single host (Railway, Render, or a $5–10 VPS).
- Keep current stack: Flask serves UI + API. No separate frontend host.
- Add a production WSGI server (`gunicorn`) and turn off `debug=True`.
- **Do not:** Kubernetes, Docker orchestration, or multi-region setup.

**Done when:** `https://yourdomain.com` loads the UI and generates a brand.

---

### 2. Cloud AI backend
**Impact:** Critical — Ollama on your laptop cannot serve paying users.

- Move inference off localhost. Pick **one** path:
  - **Option A (fastest):** Hosted API (Groq, Together, OpenRouter) with a single env var swap in `ai_engine.py`.
  - **Option B:** Ollama on the same VPS as Flask.
- Add request timeout (120s) and a user-facing error when AI is unavailable.
- Fix the JSON prompt comma bug in `ai_engine.py` — reduces failed generations.

**Done when:** A stranger can generate a brand without your machine running.

---

### 3. Stripe Checkout (one-time payment)
**Impact:** Critical — no payment = no customer.

- One product: **"Full Brand Kit"** at a fixed price ($19–49 to start).
- Stripe Payment Link or Checkout Session — no custom cart, no subscriptions yet.
- After payment → redirect to a success page with download links.
- Store payment confirmation via Stripe webhook (single endpoint in `backend/api/`).

**Do not:** Build user accounts, subscription billing, or coupon systems yet.

**Done when:** You can send someone a link and receive money.

---

### 4. Paid deliverable — downloadable brand kit
**Impact:** Critical — this is what people pay for.

Wire existing code into the paid flow:

| Deliverable | Source | Effort |
|-------------|--------|--------|
| Brand JSON | Already generated | Low |
| Logo PNG + SVG | `generate_vector_logo()` — already built | Low |
| One-page PDF summary | Simple HTML → PDF (WeasyPrint or similar) | Medium |

- Free tier: preview only (current UI, no download).
- Paid tier: ZIP with `brandkit.json`, `logo.png`, `logo.svg`, `brand-summary.pdf`.
- Gate downloads behind payment token (signed URL or Stripe session ID check).

**Done when:** A paying user receives files they can actually use.

---

### 5. Paywall on existing UI
**Impact:** High — converts the watermark into revenue.

The UI already teases an upgrade. Make it real:

- Replace *"Upgrade to unlock full brand kit"* with a **"Download Full Kit — $XX"** button.
- Show a clear before/after: free = preview on screen; paid = downloadable files.
- Add a simple `/pricing` section on the same page (no new app).

**Done when:** Every generated brand has an obvious path to pay.

---

## Should Build

*Target: Days 10–22. Increases conversion and trust after the core loop works.*

### 6. Output quality fixes
**Impact:** Medium-high — bad output kills word-of-mouth and refunds.

Quick fixes from [docs/PROJECT_AUDIT.md](PROJECT_AUDIT.md):

- Align `p.type` vs `p.trait` in `script.js` (personality labels).
- Align `canva_guidance` vs `canva` field names.
- Validate `idea` is non-empty before calling Ollama (return `400`).
- Show all brand fields in the UI (Instagram bio, brand voice language tone).

**Done when:** Output looks intentional, not broken.

---

### 7. Generation UX (loading + errors)
**Impact:** Medium — 2-minute wait loses users.

- Progress indicator during generation ("Crafting your brand…").
- Disable the Generate button while waiting.
- Friendly error messages (Ollama down, timeout, invalid input).
- Optional: show partial results if retry succeeds.

**Do not:** WebSockets, streaming tokens, or job queues.

---

### 8. Email capture
**Impact:** Medium — most visitors won't pay on first visit.

- Collect email before or after free preview (Mailchimp, Buttondown, or Resend).
- Send a follow-up with their preview + upgrade link.
- Store emails in a simple list — no CRM integration.

**Done when:** You can re-engage people who didn't buy immediately.

---

### 9. Landing page CTAs that work
**Impact:** Medium — hero buttons currently do nothing.

Wire existing buttons in `index.html`:

- **"Get Started"** / **"Start Building"** → scroll to brand input.
- **"View Demo"** → pre-fill example idea and trigger generation.
- Add 2–3 example brand outputs (screenshots) as social proof.

**Done when:** A new visitor knows what to do in 5 seconds.

---

### 10. Basic analytics
**Impact:** Medium — you need to know what's failing.

- Plausible or Google Analytics on `index.html`.
- Track: page view → generate click → generation success → pay click → purchase.
- Stripe dashboard for revenue.

**Do not:** Build a custom admin dashboard.

---

## Nice To Have

*Target: Day 23+ or after first payment. Do not build these in the first 2 weeks.*

| Feature | Why it waits |
|---------|--------------|
| User accounts / login | Stripe + signed download links are enough for v1 |
| Subscription plans | One-time purchase is simpler to sell and support |
| Logo regeneration / editing | Adds scope; current generator is good enough to ship |
| Multiple logo variants | Nice polish, not required for first sale |
| Canva API integration | Hardcoded links already exist in Streamlit UI |
| React / Next.js rewrite | Current vanilla JS + Flask works |
| Streamlit UI | Deprecated path; focus on `frontend/web` only |
| Response caching | Optimization, not a revenue blocker |
| Team / agency features | Enterprise scope — wrong for day 30 |
| Custom domain email (@brandforge.com) | Use Stripe receipts + a free email tool first |
| Mobile app | Web-first is sufficient |

---

## 30-day timeline

```
Week 1 — Make it reachable
├── Deploy to production host
├── Move AI off localhost
├── Fix prompt/JSON reliability
└── Wire hero CTAs

Week 2 — Make it sellable
├── Stripe Checkout live
├── Paid download flow (JSON + logo PNG/SVG)
├── Paywall button on preview
└── Pricing section on landing page

Week 3 — Make it convert
├── PDF brand summary in download ZIP
├── Loading states + error handling
├── Email capture
└── Output quality fixes in UI

Week 4 — Make it grow
├── Analytics + funnel review
├── First outreach (10–20 target customers)
├── Iterate on price/copy based on feedback
└── First paying customer 🎯
```

---

## What to sell (recommended v1 offer)

**Product:** Full Brand Kit — one-time purchase  
**Price:** $29 (adjust after 5 conversations with real prospects)  
**Includes:**
- Brand name, personality, colors, typography, voice
- Logo PNG + SVG
- JSON export
- One-page PDF summary

**Free tier:** On-screen preview only (current experience)

This maps directly to code you already have. The gap is deployment, payment, and wiring `generate_vector_logo()` into the download flow.

---

## Anti-patterns (do not do these in 30 days)

- Rewrite frontend in React
- Build authentication from scratch
- Add a database before you have paying users
- Support multiple AI providers with an abstraction layer
- Build a logo editor
- Add team seats, API access, or white-label
- Perfect the Streamlit UI
- Spend more than 2 days on logo algorithm improvements

---

## Success metrics

| Metric | Day 7 | Day 14 | Day 30 |
|--------|-------|--------|--------|
| Production URL live | ✅ | — | — |
| Stripe accepting payments | — | ✅ | — |
| Paid downloads working | — | ✅ | — |
| Outreach conversations | 5 | 15 | 30 |
| Free generations | 20 | 100 | 300 |
| **Paying customers** | 0 | 0–1 | **1+** |

---

## Architecture — what stays the same

```
frontend/web/index.html  →  Flask (UI + API)  →  ai_engine  →  LLM
                                ↓
                          Stripe Checkout
                                ↓
                          Download ZIP (post-payment)
```

No new services. No new frontends. Extend `backend/api/` with payment and download routes only.

---

## First action (today)

1. Buy a domain and deploy `python server.py` equivalent to Railway or Render.
2. Swap Ollama for a hosted LLM API key in `.env`.
3. Create a Stripe product and Payment Link.
4. Wire `generate_vector_logo()` into a new `POST /download-brand-kit` endpoint gated by payment.

Everything else follows from those four steps.
