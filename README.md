<div align="center">

# Free Self-Hosted SEO Tool — Open-Source Alternative to Ahrefs & Semrush

**An AI-powered, self-hosted SEO platform for freelancers, agencies, and site owners. 100+ tools — audits, rank tracking, keyword research, content briefs, backlink analysis, local SEO, AI-search visibility, paid-ads funnels, white-label reports. No paid API keys required to start. One command to install.**

[![License](https://img.shields.io/badge/license-PolyForm--NC--1.0.0-amber.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%E2%80%A2%20SQLite%20%E2%80%A2%20Playwright-cyan.svg)](#tech-stack)
[![Self-hosted](https://img.shields.io/badge/self--hosted-yes-green.svg)](#install--pick-one)
[![Built by](https://img.shields.io/badge/built%20by-DiceCodes-violet.svg)](https://dicecodes.com)

[**Install**](#install--pick-one) · [**Features**](#what-it-does) · [**vs Ahrefs / Semrush**](#why-this-exists-instead-of-just-paying-for-ahrefs-or-semrush) · [**FAQ**](#faq) · [**License**](#license)

</div>

---

## Why this exists (instead of just paying for Ahrefs or Semrush)

| | This tool | Ahrefs | Semrush |
|---|---|---|---|
| **Monthly cost** | $0 self-hosted | $129–$1499 | $140–$500 |
| **Data ownership** | Single SQLite file on your machine | Their servers | Their servers |
| **Privacy** | Zero telemetry, zero phone-home | Tracks usage | Tracks usage |
| **API keys required** | None (Google free tier optional) | Their subscription | Their subscription |
| **Rank tracking limit** | Unlimited | 100–10,000 keywords | 500–5,000 keywords |
| **Client cap** | Unlimited | 5–25 projects | 5–unlimited |
| **AI features** | Bring your own key (Gemini free, Groq free, Ollama free local) | Built-in (chargeable) | Built-in (chargeable) |
| **White-label reports** | Yes, free | Higher tiers only | Higher tiers only |
| **Source available** | Yes — fork it, audit it, modify it | Closed | Closed |

If you manage 1–25 client websites and are tired of paying $150–$500/month for the same data you can self-generate, this is for you.

---

## What it does

This is the **most complete free SEO tool on GitHub** as of 2026. Every category an SEO needs in one place:

### Site audits & technical SEO
- Full-site crawl with 30+ on-page checks (titles, descriptions, headings, schema, canonical, hreflang, robots, sitemap)
- Core Web Vitals via PageSpeed Insights API + local Lighthouse fallback
- Schema.org structured-data validator + generator (Article, Product, LocalBusiness, FAQ, How-To, Review, Recipe, Event, Video)
- Image optimization audit (WebP/AVIF conversion, alt text gap finder)
- Broken-link finder, redirect-chain inspector, mixed-content detector
- HTTPS / SSL / security-header audit (HSTS, CSP, X-Frame-Options)
- Mobile-friendliness check, JavaScript-rendering check
- Server-log analyzer (Nginx + Apache) — find what Googlebot + GPTBot + ClaudeBot actually crawl

### Rank tracking & SERP analysis
- Daily rank tracking, mobile vs desktop separately
- City-level rank tracking (not just country)
- Competitor rank tracking on the same dashboard
- SERP-feature tracking (AI Overview, featured snippet, People Also Ask, video carousel, image pack)
- Historical SERP screenshots with diff view
- Striking-distance keyword finder (positions 4–15, ready to push to page 1)
- Keyword cannibalization detector

### Keyword research (truly free)
- Google autocomplete fan-out (no API key needed — uses public endpoint)
- People Also Ask scraping
- Related searches extraction
- Wikipedia + Reddit + YouTube topic discovery
- Search-intent classifier (informational / navigational / transactional / commercial)
- Keyword clustering by topic and intent
- Difficulty estimate from SERP analysis

### Content
- AI-powered content brief generator (target length, headings, semantic keywords, PAA, competitor analysis)
- Content score in real time (paste a draft, see what's missing)
- Content gap analysis vs competitors
- Content decay detector — pages losing traffic, ranked by recovery value
- Editorial calendar
- Topic cluster builder with pillar/cluster visualization
- Plagiarism + AI-content detector before publishing

### Backlinks
- GSC backlink import (your own site's backlinks, free)
- Ahrefs Webmaster Tools integration (free for verified sites)
- New / lost backlink alerts
- Toxic-link heuristic flagging + disavow file generator
- Outreach hub with templates and reply tracking

### Local SEO
- Google Business Profile manager (direct GBP API integration)
- Review aggregator (Google, Yelp, TripAdvisor, Trustpilot, Facebook)
- Citation tracker with NAP-consistency checker (50+ directories)
- Local pack visibility tracking with map view
- Service-area page generator
- Local schema templates by business type

### AI-search visibility (the 2026 differentiator)
- LLM-mention tracker — weekly checks across ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews
- Citation analysis — when not cited, see who is (Reddit, Wikipedia, industry pubs)
- AI-bot crawl tracking from server logs (GPTBot, ClaudeBot, PerplexityBot frequency)
- `llms.txt` manager — generate, validate, monitor
- robots.txt AI-bot policy builder
- AI-Overview presence tracker

### Paid ads
- Ad-funnel architect — Meta, Google Search / Display / Shopping, LinkedIn, TikTok, YouTube
- Ad-copy generator with platform-specific rules
- Keyword research for Google Ads
- Landing-page audit for ads
- ROAS calculator

### Reports, invoicing, client management
- White-label PDF reports with AI-generated executive summary
- Per-client client portal with magic-link access (clients see live progress)
- Invoice generator with INR (UPI) + USD support
- Scheduled monthly digests via Slack / Discord / Teams / email
- Daily agent — 17 automated jobs per client, runs in the background

### Integrations
- Google Search Console, Google Analytics 4, Google Business Profile, Bing Webmaster Tools (free OAuth)
- WordPress plugin (read/write meta, schema, redirects)
- Shopify, Wix, Webflow integrations
- BYO key for OpenAI / Anthropic / Gemini / Groq / OpenRouter / DeepSeek / Perplexity / Ollama local

---

## Install — pick one

**One-line installer** (no Git, no Node, no setup required — auto-detects Docker, falls back to Node, finds a free port, opens browser, idempotent):

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/IamRamgarhia/seo/main/install.sh | bash
```

**Windows (PowerShell):**
```powershell
iwr -useb https://raw.githubusercontent.com/IamRamgarhia/seo/main/install.ps1 | iex
```

The installer downloads the latest code into `~/seo`, runs a one-time production build, applies database migrations, and starts the server. Daily startup after that is ~2 seconds (production mode). Re-run anytime to upgrade.

**Docker manually:**
```bash
git clone https://github.com/IamRamgarhia/seo.git
cd seo
docker compose up -d
```

**Native manually:**
```bash
git clone https://github.com/IamRamgarhia/seo.git
cd seo
pnpm install
pnpm exec playwright install chromium
pnpm build
pnpm start:daily
```

Open <http://localhost:3000>.

By default the server binds to `127.0.0.1` (localhost-only) for safety. To expose on your LAN, set `APP_PASSWORD=your-password` AND `SEO_BIND_HOST=0.0.0.0`.

---

## First 5 minutes

1. **Add a client** at <http://localhost:3000/clients/new> — paste a domain, the tool detects the tech stack and niche automatically.
2. **Connect Google** under Settings → Integrations (optional — uses free Google APIs for GSC, GA4, PageSpeed).
3. **Pick an AI provider** under Settings → AI:
   - **Local Ollama** — free, private, fully offline
   - **Gemini / Groq / OpenRouter** — free tiers, just paste an API key
   - **OpenAI / Anthropic** — paid, BYO key
4. **Run your first audit** — click "Run audit" on any client.

The daily agent kicks in 24h later and runs ~17 automated jobs per client on its own (rank checks, audit deltas, content decay, backlink scans, GBP monitoring, etc.).

---

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **SQLite** (better-sqlite3) + **Drizzle ORM** — single-file database, no Postgres required for self-hosters
- **Playwright** (headless Chromium) for rank checking + SERP scraping + GBP scraping
- **Tailwind CSS 4** + **motion** library
- **Satori** + **resvg-js** for OG-image generation (no headless Chrome needed)
- **PDFKit** for reports + invoices
- Optional: **Ollama** for local AI, **Browserless** / Cloudflare Browser Rendering for remote chromium

Runs on a $5/month VPS (1 GB RAM) for solo / small-agency use. See [`docs/HOSTING.md`](docs/HOSTING.md) for production hosting on Hetzner, Railway, Hostinger.

---

## FAQ

### Is this really free?
Yes — fully self-hostable for personal, freelance, and agency client work under the [PolyForm Noncommercial 1.0.0](LICENSE) license. No usage limits, no feature gates, no telemetry. The only thing you can't do is sell it or resell it as a paid SaaS — for that you need a paid commercial license from DiceCodes (`hello@dicecodes.com`).

### Can I use this for client work as a freelancer or agency?
Yes. Charging clients for your SEO services using this tool is allowed — that's not "selling the software," it's selling your service. You can also white-label reports with your own brand.

### Does it really work without any API keys?
Yes. The tool ships with a headless Chromium browser pool that scrapes Google, DuckDuckGo, and Bing for SERPs, autocomplete, related searches, and rank checks. Adding a free Google API key (GSC, GA4, PageSpeed Insights — all free tiers) makes it faster and more accurate, but isn't required.

### How does this compare to Ahrefs / Semrush / Moz / Mangools?
Ahrefs and Semrush have larger backlink indexes and faster SERP data because they pay for premium SERP APIs at scale. This tool uses free Google APIs + headless browsers, which is slower at huge scale but free forever. For SEOs managing 1–25 client websites, the difference rarely matters — and you'll save $1,500–$6,000/year.

### What about SEO Panel / SerpBear / SEOnaut / OpenSEO / RustySEO?
This tool absorbs the best ideas from each: SEO Panel's multi-client + white-label, SerpBear's rank tracking + GSC integration, SEOnaut's severity-classified audits, RustySEO's local AI + log analysis, plus genuinely new pieces (LLM-citation tracking, ad-funnel architect, content decay detector, niche-aware task templates). It's the first integrated workflow tool of its kind on GitHub.

### Does it work on a $5/month VPS?
Yes. Tested on Hetzner CX11 (1 GB RAM). Daily agent + 5 clients with full rank tracking fits comfortably. The headless browser pool is the dominant resource — disable it via Settings if you only need audits + content tools.

### Can I run this fully offline?
Yes. Install [Ollama](https://ollama.com/) for local AI (Llama 3.2 / Phi-3 / Mistral). The tool detects it automatically. SERP scraping and Google API calls still need internet, but everything else — audits, content, schema, internal linking — runs offline.

### How is data stored?
A single `data.db` SQLite file in your install folder. API keys and OAuth tokens are encrypted at rest with AES-256-GCM. Backup = copy the folder.

### What's the difference between this and just hiring an SEO?
This isn't a replacement for human strategy — it's a workflow tool that takes the manual labor out of audits, rank tracking, reporting, and content production. Most agencies use Ahrefs/Semrush + a stack of 5–10 other tools costing $300–$800/month. This collapses that stack into one self-hosted app.

### Does it support languages other than English?
Yes. Site audits + rank tracking work for any country and language (country code + BCP-47 language stored per client). Content generation respects the configured language. UI is English-only for now — translations welcome via PR.

### Why "DiceCodes"?
That's the developer ([dicecodes.com](https://dicecodes.com)). Solo project, no VC funding, no growth team — just one person who got tired of $1,800/year Ahrefs subscriptions and built this instead.

---

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — source-available, not OSI-open-source.

**Plain English:**

✅ **You can, freely:**
- Self-host for your own SEO work (any scale)
- Use it for paid freelance / agency client work
- Modify, fork, and adapt the code
- Share copies under these same terms
- Contribute back via pull requests

❌ **You cannot, without written permission:**
- Sell this software or any derivative of it
- Offer it as a paid hosted service (SaaS)
- Re-license it under a different license
- Strip the DiceCodes maintainer credit and pass it off as your own

For a **commercial license** (paid SaaS hosting, white-label resale, OEM embedding), contact **hello@dicecodes.com**. Pricing is per-deployment, not per-seat.

---

## Star history & support

If this tool saves you a Ahrefs or Semrush subscription, the cheapest way to say thanks:

- ⭐ **Star this repo** — helps other SEOs discover it
- 💜 **Tip via UPI (India)** — `dicecodes@upi`, or open the Support button in the app
- ☕ **Buy Me A Coffee (international)** — <https://buymeacoffee.com/dicecodes>

---

## Built by [DiceCodes](https://dicecodes.com)

Solo-built. No VC. No growth team. Just one developer trying to make SEO tooling permanently free.

**Links:**
- 🌐 Website: [dicecodes.com](https://dicecodes.com)
- 📧 Email: `hello@dicecodes.com`
- 🐙 GitHub: <https://github.com/IamRamgarhia/seo>

---

<div align="center">

**Search terms this tool is built for:** free SEO tool · open source SEO software · self-hosted SEO platform · Ahrefs alternative free · Semrush alternative free · SEO tool GitHub · free rank tracker · free site audit tool · open source backlink checker · self-hosted keyword research · AI SEO tool open source · GEO SEO · AI Overview tracking · LLM citation tracking · ChatGPT SEO · Perplexity SEO · WordPress SEO plugin · Shopify SEO · local SEO software · white-label SEO reports

</div>
