# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Serdar Gundogdu - AI Practitioner. The site showcases end-to-end artificial intelligence solutions built using cutting-edge AI coding assistants (Claude Code, ChatGPT Codex, Google Gemini) with VS Code and Antigravity IDE.

**Tech Stack:** Pure HTML5, CSS3, vanilla JavaScript - zero external dependencies.

## Development Commands

There are no build steps, package managers, or test runners. This is a pure static site.

- **Local development:** Open `index.html` in a browser or use any static file server
- **Deployment:** Automatic via Azure Static Web Apps on push to `main` branch

## Architecture

### Root Level
- `index.html` - Main portfolio landing page (navigation hub to all sub-projects)
- `styles.css` - Global design system with CSS custom properties for theming
- `scripts.js` - Core features: theme toggle, mobile navigation, back-to-top button

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

**PIPolars** (https://pypi.org/project/pipolars/)
- Python library for extracting OSIsoft PI System data into Polars DataFrames
- 10-100x performance improvements over pandas
- Features: bulk tag extraction, lazy evaluation, SQLite/Arrow caching, fluent API
- Requires Python 3.10+, Windows, PI AF SDK 2.x

**DSML101** (https://dsml101.com)
- Data Science and Machine Learning educational platform and resources

**SWAPP** (https://swapp.org.tr)
- AI-First Industrial Data Workbench for operational analytics
- Modules: Explorer, Trend, Stats, PPM dashboards
- Dual .NET/Python API, natural language queries, edge-to-cloud ingestion

**SCADA Nerve** (https://scadanerve.com)
- SCADA and industrial control systems platform for monitoring and automation

### Key Patterns

**Theme System:** CSS custom properties (`--bg`, `--text`, `--primary`, etc.) with `data-theme` attribute. Respects `prefers-color-scheme` and persists choice to localStorage.

**JavaScript:** Vanilla JS using IIFE pattern for module encapsulation. No framework dependencies.

**Accessibility:** ARIA labels, live regions, keyboard navigation, skip links, focus indicators throughout.

## Deployment

Azure Static Web Apps via GitHub Actions (`.github/workflows/azure-static-web-apps-icy-hill-00c42ed1e.yml`):
- Triggers on push to `main` or PR events
- No build step required - serves static files directly
- PR branches get automatic staging environments
