# Personal Profile Page

Bilingual personal portfolio for Serdar Gündoğdu. The English homepage is served
directly at `/`, the Turkish edition lives at `/tr/`, and the retired `/en/`
duplicate permanently redirects to `/`.

The opening experience combines an interactive ASCII/pixel portrait engine with a
reverse-chronological eight-stage career timeline spanning mechanical engineering,
manufacturing leadership, data science, full-stack AI, and AI engineering,
followed by a learning-system loop that connects the application atlas
(`aia` → `gpu` → `llm` → `usl` → `cld`), the application map itself, working
principles, verified credentials, and contact.

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
npm run test:deployment
npm run test:environment
npm run test:portrait
npm run test:server
npm run test:stop
npm run validate:site
```

`tools/validate-site.mjs` also encodes the list of retired project URLs
(Stackfolio, PIPolars, PIWebAPI, SWAPP, SCADA Nerve, Industry-Learn,
Scikit-Play, Aeon-Play, PyTorch-Play, DSML101). Those projects were removed
from this site deliberately; the validator fails if any of them reappear.

## Assets

- **Fonts:** self-hosted Inter variable subsets in `fonts/` (latin +
  latin-ext, preloaded) — no third-party font requests.
- **Portraits:** WebP primaries with palette-quantized PNG fallbacks
  (640×800, ≤250 KB) in `images/career/`.
- **Open Graph:** 1200×630 JPEG (≤400 KB) at `images/og-ascii.jpg` and
  `images/og-ascii-tr.jpg`.
