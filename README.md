# Personal Profile Page

Bilingual personal portfolio for Serdar Gündoğdu, available at `/en/` and `/tr/`. The root route selects the saved or browser language and retains accessible language links when JavaScript is unavailable.

The opening experience combines an interactive ASCII portrait with a nine-stage career timeline spanning mechanical engineering, manufacturing leadership, data science, full-stack AI, and ongoing GPU kernel engineering study.

## Development

Install the project metadata from the lockfile, then start the dependency-free
local preview server:

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:4173. The host and port can be overridden with `HOST` and
`PORT` environment variables.

Stop the managed preview from another terminal with:

```bash
npm run stop
```

The Codex environment exposes matching `Run`, `Stop`, and `Validate` actions.
`Stop` affects only the preview registered for the current worktree and is a
successful no-op when no managed preview is running.

## Validation

Run the complete validation gate:

```bash
npm test
```

For focused troubleshooting, run an individual check:

```bash
npm run check:js
npm run test:environment
npm run test:portrait
npm run test:server
npm run test:stop
npm run validate:site
```

## Projects

### Industry-Learn
AI-Powered ML Solutions platform for industrial applications and machine learning workflows.

**Website:** https://industry-learn.com

---

### Scikit-Play
Interactive machine learning playground built with Streamlit for experimenting with ML algorithms.

**Website:** https://scikit-play.org

---

### PIPolars
Python library for extracting OSIsoft PI System data into Polars DataFrames with 10-100x performance over pandas.

**Features:**
- Bulk tag extraction
- Lazy evaluation with LazyFrame support
- SQLite and Arrow IPC caching
- Fluent API with method chaining

**Requirements:**
- Python 3.10+
- Windows OS
- OSIsoft PI AF SDK 2.x

**Installation:**
```bash
pip install pipolars
```

**PyPI:** https://pypi.org/project/pipolars/

---

### DSML101
Data Science and Machine Learning educational platform and resources.

**Website:** https://dsml101.com

---

### SWAPP
AI-First Industrial Data Workbench replacing licensed tools with governed APIs and AI-powered insights.

**Modules:**
- Explorer: Asset framework navigation with tree view and search
- Trend: Multi-tag charting with AI-powered anomaly analysis
- Stats: Statistical analysis for correlation, regression, and outlier detection
- PPM: KPI dashboards with loss accounting and AI-generated reports

**Features:**
- Dual .NET/Python API architecture
- Natural language-to-query capabilities
- Edge-to-cloud data ingestion

**Website:** https://swapp.org.tr

---

### SCADA Nerve
SCADA and industrial control systems platform for monitoring and automation.

**Website:** https://scadanerve.com
