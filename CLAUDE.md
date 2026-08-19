# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Serdar Gündoğdu — Industrial AI Engineer. The site presents a physical-to-digital career journey (mechanical engineering → AI engineering) with an interactive ASCII/pixel portrait engine, an application map of live subdomain products, and verified credentials.

**Tech Stack:** Pure HTML5, CSS3, vanilla JavaScript - zero runtime dependencies. Node.js 20+ and npm provide dependency-free local development and validation commands. The public experience is bilingual: `/` serves the English page directly, `/tr/` serves Turkish, and the retired `/en/` duplicate 301-redirects to `/` (see `staticwebapp.config.json`).

## Development Commands

There is no production build step. npm provides the shared development command surface without installing runtime or development packages.

- **Setup:** `npm ci`
- **Local development:** `npm run dev` (serves `http://127.0.0.1:4173` by default)
- **Validation:** `npm test`
- **Static server tests:** `npm run test:server`
- **Deployment:** Automatic via Azure Static Web Apps on push to `main` branch

## Architecture

### Root Level
- `index.html` - English homepage served at `/` (self-canonical)
- `tr/index.html` - Turkish homepage with matching anchors and timeline stage keys
- `styles.css` - Global design system with CSS custom properties; self-hosted Inter variable font (`/fonts/`)
- `scripts.js` - Language preference, active career timeline, and viewport-aware ASCII portrait animation
- `staticwebapp.config.json` - Route rules: `/en` + `/en/*` 301 to `/`, immutable caching for versioned assets, security headers
- `sitemap.xml`, `robots.txt` - SEO surfaces listing `/` and `/tr/` only
- `package.json` - Shared setup, preview, and validation command contract
- `tools/serve.mjs` - Dependency-free local static preview server
- `tools/serve.test.mjs` - HTTP behavior and path-confinement regression tests
- `tools/validate-site.mjs` - Dependency-free parity and metadata validation for both locales (also encodes retired project URLs that must not return to the site)

### Pages and sections (both locales, keep in parity)
- Hero + reverse-chronological eight-stage career timeline (`08 AI Engineer` → `01 Mechanical Engineering`)
- `#learning` learning system - the application atlas expressed as a study loop (AIA → GPU → LLM → USL → CLD) with an ASCII flow diagram, guiding questions, and an investment-priority strip
- `#apps` application map - five live subdomain products, each keyed by a three-letter code
- `#approach` working principles, `#about` + verified credentials, contact

### Application map products
| Code | Product | Address |
| ---- | ------- | ------- |
| `aia` | AI Ecosystem Atlas | https://aia.aserdargun.com/ |
| `llm` | LLM Runtime & Serving Atlas | https://llm.aserdargun.com/ |
| `usl` | Unsloth Studio Learning | https://usl.aserdargun.com/ |
| `gpu` | GPU Kernel Engineering — Kernel Atlas | https://gpu.aserdargun.com/ |
| `cld` | Cloud Provider Cost Comparison | https://cld.aserdargun.com/ |

Earlier portfolio projects (Stackfolio, PIPolars, PIWebAPI, SWAPP, SCADA Nerve, Industry-Learn, Scikit-Play, Aeon-Play, PyTorch-Play, DSML101) were retired from this site on purpose; `tools/validate-site.mjs` fails the build if any of their URLs reappear.

### Key Patterns

**Typography:** Self-hosted Inter variable font (latin + latin-ext subsets in `/fonts/`, preloaded), enabling intermediate weights (520/560/650) with a Helvetica/Arial fallback stack. Monospace UI accents use the system mono stack.

**Images:** Career portraits ship as WebP with palette-quantized PNG fallbacks (≤250 KB each, transparency via tRNS). Open Graph images are 1200×630 JPEG (≤400 KB). Asset changes require bumping the shared `?v=` cache-busting query, mirrored in `tools/validate-site.mjs` (`expectedAssetVersion`).

**JavaScript:** Vanilla JS using IIFE pattern for module encapsulation. No framework dependencies. Portrait renderers are gated by IntersectionObserver visibility and a requestAnimationFrame energy threshold; `prefers-reduced-motion` disables all animation.

**Accessibility:** ARIA labels, skip link, keyboard navigation, focus indicators, sticky mobile navigation, print stylesheet, no-JS fallbacks throughout.

## Deployment

Azure Static Web Apps via GitHub Actions (`.github/workflows/azure-static-web-apps-red-tree-06630f303.yml`):
- Triggers on push to `main` or PR events
- No build step required - serves static files directly
- PR branches get automatic staging environments
