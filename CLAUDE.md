# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Serdar Gundogdu - AI Practitioner. The site showcases end-to-end artificial intelligence solutions built using cutting-edge AI coding assistants (Claude Code, ChatGPT Codex, Google Gemini) with VS Code and Antigravity IDE.

**Tech Stack:** Pure HTML5, CSS3, vanilla JavaScript - zero runtime dependencies. Node.js 20+ and npm provide dependency-free local development and validation commands. The public experience is bilingual: `/en/` and `/tr/`, with `/` acting as an accessible language gateway.

## Development Commands

There is no production build step. npm provides the shared development command surface without installing runtime or development packages.

- **Setup:** `npm ci`
- **Local development:** `npm run dev` (serves `http://127.0.0.1:4173` by default)
- **Validation:** `npm test`
- **Static server tests:** `npm run test:server`
- **Deployment:** Automatic via Azure Static Web Apps on push to `main` branch

## Architecture

### Root Level
- `index.html` - Saved/browser-language gateway with no-JavaScript language links
- `en/index.html`, `tr/index.html` - Complete localized portfolio pages with matching anchors and timeline stage keys
- `styles.css` - Global design system with CSS custom properties for theming
- `scripts.js` - Language preference, active career timeline, and viewport-aware ASCII portrait animation
- `package.json` - Shared setup, preview, and validation command contract
- `tools/serve.mjs` - Dependency-free local static preview server
- `tools/serve.test.mjs` - HTTP behavior and path-confinement regression tests
- `tools/validate-site.mjs` - Dependency-free parity and metadata validation for both locales

### Projects

**Industry-Learn** (https://industry-learn.com)
- AI-Powered ML Solutions platform for industrial applications and machine learning workflows

**Scikit-Play** (https://scikit-play.org)
- Interactive machine learning playground built with Streamlit for experimenting with ML algorithms

**Aeon-Play** (https://aeon-play.org)
- Time series playground built with Plotly Dash and the Aeon library
- Experimenting with time series analysis and forecasting

**PyTorch-Play** (https://pytorch-play.org)
- Deep learning playground built with PyTorch and Gradio
- Experimenting with neural networks and deep learning models

**PIPolars** (https://pypi.org/project/pipolars/ | https://github.com/aserdargun/pipolars)
- Python library for extracting OSIsoft PI System data into Polars DataFrames
- 10-100x performance improvements over pandas
- Features: bulk tag extraction, lazy evaluation, SQLite/Arrow caching, fluent API
- Requires Python 3.10+, Windows, PI AF SDK 2.x

**PIWebAPI** (https://www.nuget.org/packages/PIWebAPI | https://github.com/aserdargun/piwebapi)
- .NET Framework 4.8 REST API for accessing OSIsoft PI System data via the AF SDK
- Features: PI Points data retrieval, AF hierarchy navigation, StreamSets bulk operations, Event Frames management
- Health monitoring endpoints for PI Data Archive and AF Server connectivity
- Windows Integrated Authentication (NTLM/Kerberos)

**DSML101** (https://dsml101.com)
- Data Science and Machine Learning educational platform and resources

**SWAPP** (https://swapp.org.tr)
- AI-First Industrial Data Workbench for operational analytics
- Modules: Explorer, Trend, Stats, PPM dashboards
- Dual .NET/Python API, natural language queries, edge-to-cloud ingestion

**SCADA Nerve** (https://scadanerve.com)
- SCADA and industrial control systems platform for monitoring and automation

**AI Practitioner Dev OS** (https://github.com/aserdargun/ai-practitioner-dev-os | https://github.com/aserdargun/my-ai-practitioner-dev-os)
- AI-driven, project-based learning operating system for AI practitioners
- 12-month adaptive curriculum across three tiers (Beginner, Intermediate, Advanced)
- Claude Code integration with AI agents for planning, building, reviewing, evaluation
- Features: Command system (/plan-week, /evaluate, /retro), memory tracking, Python evaluation engine
- Personal fork customized for Advanced tier with NLP pipeline and sequence models specialization

### Key Patterns

**Theme System:** CSS custom properties (`--bg`, `--text`, `--primary`, etc.) with `data-theme` attribute. Respects `prefers-color-scheme` and persists choice to localStorage.

**JavaScript:** Vanilla JS using IIFE pattern for module encapsulation. No framework dependencies.

**Accessibility:** ARIA labels, live regions, keyboard navigation, skip links, focus indicators throughout.

## Deployment

Azure Static Web Apps via GitHub Actions (`.github/workflows/azure-static-web-apps-icy-hill-00c42ed1e.yml`):
- Triggers on push to `main` or PR events
- No build step required - serves static files directly
- PR branches get automatic staging environments
