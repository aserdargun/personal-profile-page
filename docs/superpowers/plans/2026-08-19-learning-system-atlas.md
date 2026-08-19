# Learning System Atlas Implementation Plan

> **For agentic workers:** The approved specification is
> `docs/superpowers/specs/2026-08-19-learning-system-atlas-design.md`.

**Goal:** Express the AI Ecosystem Atlas plan as a learning system — orient
(`aia`), build on three parallel tracks (`gpu` hardware, `llm` serving hub,
`usl` training), converge on AI infrastructure (`cld`) — integrate it into
all three homepages, and publish through the normal `main` deployment.

## Tasks

- [x] **Task 1: Section markup.** Insert the `learning-system` section after
  the journey section on `index.html`, `en/index.html`, and `tr/index.html`,
  with localized copy, the localized ASCII diagram, and node links in
  `aia, gpu, llm, usl, cld` order. Add the `#learning` nav link on all three
  pages.
- [x] **Task 2: Styling.** Add `.learning-system` rules to `styles.css`
  (dark band, mono diagram, stage flow, track cards, feed line, loop line,
  responsive collapse at the existing breakpoints).
- [x] **Task 3: Validation contract.** Bump `expectedAssetVersion` to
  `20260819-learning-atlas` in `tools/validate-site.mjs` and in every asset
  reference; assert the learning-system contract for en, tr, and root.
- [x] **Task 4: Verification.** `npm test` and `npm run test:server` pass.
- [x] **Task 5: Publish.** Commit on `main` and push; the Azure Static Web
  Apps workflow validates and deploys.

## Delivery boundary

- No `scripts.js` change, no new assets, no dependency changes.
- Application-map table and career timeline contracts remain untouched.
