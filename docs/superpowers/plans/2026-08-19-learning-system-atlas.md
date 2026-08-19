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
- [x] **Task 6: Guiding questions.** Give every stop its question
  (`aia` twice — entry and return), add the `CLD → AIA` return edge to the
  diagram, and add stage 04 · Return; extend the validator to six codes,
  six questions, and four stages.
- [x] **Task 7: Depth plan.** Add the study-order strip
  (`aia → gpu → llm → usl → cld` with roles), per-card order badges and
  topic chains, the `llm → gpu` feed edge, the weighted investment bar
  (llm 30 / gpu 25 / usl 20 / cld 15 / aia 10), and validator assertions
  for all of it.

## Delivery boundary

- No `scripts.js` change, no new assets, no dependency changes.
- Application-map table and career timeline contracts remain untouched.
