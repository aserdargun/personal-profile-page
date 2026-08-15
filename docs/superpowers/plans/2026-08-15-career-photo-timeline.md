# Career Photo Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current nine-stage ASCII-portrait career section with an eight-stage reverse-chronological journey that pairs each role with its normalized normal photograph and uses ASCII characters only during animated stage transitions.

**Architecture:** Keep the static HTML/CSS/JavaScript architecture and existing two-column journey layout. Each timeline item owns localized role/focus copy plus deterministic portrait asset paths; `initializeTimeline()` coordinates the active item, portrait summary, progress line, preload/fallback behavior, and a canvas-based transition overlay. Portrait editing is an asset pipeline step, while `tools/validate-site.mjs` remains the root/TR/EN parity and asset contract.

**Tech Stack:** Semantic HTML, shared CSS, browser JavaScript, Canvas 2D, IntersectionObserver, Web Animations API, built-in ImageGen, Node.js validation/tests, Browser plugin QA

## Global Constraints

- Render stages in exact reverse chronological order: `08` AI Engineer through `01` Mechanical Engineering.
- Preserve Photo 8 through Photo 1 as the exact role mapping defined in the approved specification.
- Photographs remain normal photographs; ASCII characters appear only in the transition overlay.
- Normalize each background-removed portrait to a transparent 640 × 800 canvas with WebP and PNG outputs.
- Use a 680-millisecond desktop transition and a 420-millisecond mobile transition.
- Respect `prefers-reduced-motion: reduce` and preserve a no-JavaScript content/image fallback.
- Remove AI Practitioner as a personal title and timeline stage while retaining the official `AWS Certified AI Practitioner` credential name.
- Keep root English, `/en/`, and `/tr/` semantically synchronized.
- Add no frontend framework or runtime dependency.
- Do not commit, push, deploy, or leave the preview server running.

---

## File Map

- Create `images/career/08-ai-engineer.png` and `.webp`: transparent, normalized Photo 8.
- Create `images/career/07-full-stack-ai-engineer.png` and `.webp`: transparent, normalized Photo 7.
- Create `images/career/06-data-scientist.png` and `.webp`: transparent, normalized Photo 6.
- Create `images/career/05-production-manager.png` and `.webp`: transparent, normalized Photo 5.
- Create `images/career/04-production-engineer.png` and `.webp`: transparent, normalized Photo 4.
- Create `images/career/03-materials-manufacturing.png` and `.webp`: transparent, normalized Photo 3.
- Create `images/career/02-industrial-engineering.png` and `.webp`: transparent, normalized Photo 2.
- Create `images/career/01-mechanical-engineering.png` and `.webp`: transparent, normalized Photo 1.
- Modify `index.html`: root English metadata, hero identity, portrait stage, eight timeline items, and footer.
- Modify `en/index.html`: localized canonical English equivalent of root.
- Modify `tr/index.html`: Turkish metadata, hero identity, portrait stage, eight timeline items, and footer.
- Modify `styles.css`: normal portrait stage, transparent cutout presentation, ASCII transition canvas, active-state layout, responsive behavior, and reduced motion.
- Modify `scripts.js`: active-stage image state, preloading, cancellable canvas transition, image fallback, and observer integration.
- Modify `tools/validate-site.mjs`: exact stage/order/image/copy/asset assertions and obsolete portrait-contract removal.
- Modify `tools/validate-portrait-canvas.mjs`: validate the new transition architecture rather than the removed interactive ASCII portrait implementation.

### Task 1: Establish the failing eight-stage validation contract

**Files:**
- Modify: `tools/validate-site.mjs`
- Modify: `tools/validate-portrait-canvas.mjs`

**Interfaces:**
- Consumes: current HTML pages, `styles.css`, `scripts.js`, and the approved role/photo table.
- Produces: exact arrays `expectedStageKeys`, `expectedStageNumbers`, and `expectedStageImages`; asset/stat checks for all PNG/WebP pairs; behavior-source assertions for cancellable transitions and reduced motion.

- [ ] **Step 1: Replace the stage expectations in the site validator**

```js
const expectedStageKeys = [
  "ai-engineer",
  "full-stack-ai",
  "data-scientist",
  "production-manager",
  "production-engineer",
  "materials-manufacturing",
  "industrial-engineering",
  "mechanical-engineering",
];
const expectedStageNumbers = ["08", "07", "06", "05", "04", "03", "02", "01"];
const expectedStageImages = [
  "08-ai-engineer",
  "07-full-stack-ai-engineer",
  "06-data-scientist",
  "05-production-manager",
  "04-production-engineer",
  "03-materials-manufacturing",
  "02-industrial-engineering",
  "01-mechanical-engineering",
];
```

- [ ] **Step 2: Assert page-level portrait mappings and personal-title cleanup**

```js
check(JSON.stringify(stageNumbers) === JSON.stringify(expectedStageNumbers), `${locale}: stage numbers must descend from 08 to 01`);
for (const assetName of expectedStageImages) {
  check(html.includes(`/images/career/${assetName}.webp`), `${locale}: WebP career portrait is missing: ${assetName}`);
  check(html.includes(`/images/career/${assetName}.png`), `${locale}: PNG career portrait is missing: ${assetName}`);
}
const withoutCredential = html.replaceAll("AWS Certified AI Practitioner", "");
check(!withoutCredential.match(/AI Practitioner/i), `${locale}: AI Practitioner remains as a personal title`);
```

- [ ] **Step 3: Replace legacy portrait-canvas assertions with transition assertions**

```js
assert.match(source, /function initializeCareerPortraitTransition\(\)/);
assert.match(source, /cancelAnimationFrame\(transitionFrame\)/);
assert.match(source, /prefers-reduced-motion: reduce/);
assert.match(source, /data-stage-image-webp/);
```

- [ ] **Step 4: Run the targeted validators and confirm the new contract fails**

Run: `npm run validate:site && npm run test:portrait`

Expected: FAIL because the HTML still contains nine stages, the new career assets do not exist, and the transition function is not implemented.

- [ ] **Step 5: Record the test-first checkpoint without committing**

Run: `git diff --check && git status --short`

Expected: only the approved spec, plan, and validator edits appear; no commit is created.

### Task 2: Prepare and validate the eight portrait assets

**Files:**
- Create: `images/career/*.png`
- Create: `images/career/*.webp`

**Interfaces:**
- Consumes: user-supplied Photo 1 through Photo 8 in `/tmp/codex-remote-attachments/.../`.
- Produces: eight pairs named exactly as `expectedStageImages`, each with a transparent 640 × 800 canvas and a preserved identity/crop.

- [ ] **Step 1: Edit each source independently with built-in ImageGen**

Use case: `background-extraction`. For every photo, request actual transparency, exact identity/expression/hair preservation, no age or clothing changes, no ASCII styling, and a centered head-and-shoulders cutout with consistent eye line.

- [ ] **Step 2: Inspect every generated cutout before accepting it**

Use the image viewer to reject outputs with changed facial identity, missing hair/shoulders, residual scenery, opaque checkerboards, or artificial sharpness. Re-run only the affected edit with one targeted correction.

- [ ] **Step 3: Normalize and encode accepted assets**

Use a non-destructive image conversion tool to place the accepted transparent cutout on a 640 × 800 transparent canvas and emit both PNG and alpha-enabled WebP. Never overwrite the attachment sources.

- [ ] **Step 4: Verify dimensions, alpha, filenames, and file sizes**

Run: `file images/career/* && du -h images/career/*`

Expected: 16 assets, each 640 × 800, with transparency and without unexpectedly large multi-megabyte delivery files.

- [ ] **Step 5: Re-run the site validator to isolate remaining markup failures**

Run: `npm run validate:site`

Expected: asset-stat checks pass; stage markup and copy checks still fail.

### Task 3: Replace the nine-stage markup and personal identity copy

**Files:**
- Modify: `index.html`
- Modify: `en/index.html`
- Modify: `tr/index.html`

**Interfaces:**
- Consumes: exact `images/career/<stage>.webp|png` paths and stage arrays from Task 1.
- Produces: eight `<li data-timeline-step>` items with `data-stage-image-webp`, `data-stage-image-png`, `data-stage-image-alt`, `data-stage-role`, and `data-stage-focus`; a portrait `<picture>` with a decorative transition canvas.

- [ ] **Step 1: Replace the sticky portrait markup**

```html
<div class="career-portrait" data-career-portrait>
  <picture>
    <source data-career-source type="image/webp" srcset="/images/career/08-ai-engineer.webp">
    <img data-career-image src="/images/career/08-ai-engineer.png" width="640" height="800" alt="Portrait associated with the AI Engineer career stage">
  </picture>
  <canvas class="career-transition" data-career-transition aria-hidden="true"></canvas>
  <span class="career-portrait-fallback" data-career-fallback aria-hidden="true">SG</span>
</div>
```

- [ ] **Step 2: Replace the ordered list with eight reverse-chronological stages**

Every stage uses the common attribute contract:

```html
<li data-timeline-step data-stage-key="ai-engineer" data-stage-number="08"
    data-stage-image-webp="/images/career/08-ai-engineer.webp"
    data-stage-image-png="/images/career/08-ai-engineer.png"
    data-stage-image-alt="Portrait associated with the AI Engineer career stage"
    data-stage-role="AI Engineer" data-stage-focus="AI systems, model engineering, and product delivery">
```

Create all eight items from this exact mapping; do not retain an `ai-practitioner` item:

| Number | Key | Image base | English role | Turkish role |
| --- | --- | --- | --- | --- |
| 08 | `ai-engineer` | `08-ai-engineer` | AI Engineer | AI Engineer |
| 07 | `full-stack-ai` | `07-full-stack-ai-engineer` | Full-Stack AI Engineer | Full-Stack AI Mühendisi |
| 06 | `data-scientist` | `06-data-scientist` | Data Scientist | Veri Bilimci |
| 05 | `production-manager` | `05-production-manager` | Production Manager | Üretim Müdürü |
| 04 | `production-engineer` | `04-production-engineer` | Production Engineer | Üretim Mühendisi |
| 03 | `materials-manufacturing` | `03-materials-manufacturing` | M.Sc. in Materials and Manufacturing | Malzeme ve İmalat Yüksek Lisansı |
| 02 | `industrial-engineering` | `02-industrial-engineering` | Industrial Engineering | Endüstri Mühendisliği |
| 01 | `mechanical-engineering` | `01-mechanical-engineering` | Mechanical Engineering | Makine Mühendisliği |

- [ ] **Step 3: Rewrite the English personal-title surfaces**

Use `Industrial AI Engineer` in the document/social titles, `AI engineer · Industrial systems` in hero/footer identity, and `AI Engineer` in JSON-LD `jobTitle`. Rewrite prose so no personal-title `AI practitioner` phrase remains.

- [ ] **Step 4: Rewrite the Turkish personal-title surfaces**

Use `Endüstriyel AI Mühendisi` in Turkish title/identity copy and `AI Engineer` for the explicit current role. Keep official credential names unchanged.

- [ ] **Step 5: Run validation and inspect parity**

Run: `npm run validate:site`

Expected: stage, order, copy, link, and asset assertions pass; transition-source assertions may still fail until Task 4.

### Task 4: Implement the normal-photo ASCII transition and responsive styling

**Files:**
- Modify: `scripts.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: timeline data attributes from Task 3.
- Produces: `initializeCareerPortraitTransition()` and its returned `{ setStage(index), destroy() }` controller; `initializeTimeline()` calls `setStage()` for the active index.
- Local helper signatures: `preloadPortrait(webpPath, pngPath) -> Promise<{ webpPath, pngPath }>`; `resizeTransitionCanvas() -> { width, height, dpr }`; `drawTransitionFrame(startTime, outgoingImage, stageData) -> void`; `settlePortrait(stageData) -> void`; `cancelTransition() -> void`.

- [ ] **Step 1: Add the portrait transition controller**

```js
function initializeCareerPortraitTransition() {
  const stage = document.querySelector("[data-career-portrait]");
  const image = stage?.querySelector("[data-career-image]");
  const source = stage?.querySelector("[data-career-source]");
  const canvas = stage?.querySelector("[data-career-transition]");
  const fallback = stage?.querySelector("[data-career-fallback]");
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!stage || !image || !source || !canvas) return null;

  function setStage(index, { immediate = false } = {}) {
    const step = document.querySelectorAll("[data-timeline-step]")[index];
    if (!step) return;
    cancelTransition();
    preloadPortrait(step.dataset.stageImageWebp, step.dataset.stageImagePng)
      .then(() => immediate || reduceMotion
        ? settlePortrait(step.dataset)
        : drawTransitionFrame(performance.now(), image, step.dataset))
      .catch(() => fallback?.removeAttribute("aria-hidden"));
  }

  function destroy() {
    cancelTransition();
    window.removeEventListener("resize", resizeTransitionCanvas);
  }

  return { setStage, destroy };
}
```

`setStage(index)` reads only from the indexed timeline item, cancels `transitionFrame`, preloads WebP/PNG, keeps the old portrait until the next asset decodes, runs the character/fragments overlay, and then settles the new image and alt text.

- [ ] **Step 2: Couple timeline activation to the controller**

Create the controller before defining `setActiveStep()`, call `portraitTransition?.setStage(boundedIndex)` in the same state update as summary/progress, and ensure the initially active item sets Photo 8 without an entrance transition.

- [ ] **Step 3: Draw only the temporary overlay on canvas**

Use a time-normalized `progress` value, device-pixel-ratio-capped canvas sizing, green monospace glyph columns, and a clipped outgoing-image fragment pass. Clear the canvas when progress reaches 1. Never rasterize the settled portrait into ASCII.

- [ ] **Step 4: Replace legacy portrait styles**

Style `.career-portrait picture`, `[data-career-image]`, `.career-transition`, and `.career-portrait-fallback` so transparent portraits sit on the shared dark/lime stage, keep a consistent eye line, and do not inherit the old ASCII portrait scaling or pointer-drag rules.

- [ ] **Step 5: Add mobile and reduced-motion rules**

At `max-width: 900px`, keep `.portrait-sticky` static and reduce canvas character density through a CSS custom property. Under `prefers-reduced-motion: reduce`, hide `.career-transition`, remove image-transition animation, and keep the current normal photograph visible.

- [ ] **Step 6: Run syntax and targeted behavior checks**

Run: `npm run check:js && npm run test:portrait && npm run validate:site`

Expected: PASS.

### Task 5: Complete repository and rendered verification

**Files:**
- Verify: all files above
- Do not create committed screenshots or reports

**Interfaces:**
- Consumes: complete implementation.
- Produces: test, browser, responsive, reduced-motion, console, and shutdown evidence.

- [ ] **Step 1: Run the complete repository test suite**

Run: `npm test`

Expected: all JavaScript, deployment, environment, portrait, stop, and site validations pass.

- [ ] **Step 2: Start the managed local preview**

Run: `npm run dev`

Expected: the project-managed server accepts HTTP requests on its configured loopback address and port.

- [ ] **Step 3: Run desktop Browser QA**

Flow: `/` loads → career journey is visible → scroll activates stages `08`, `07`, and `06` → the normal portrait changes to the mapped photo after a temporary ASCII overlay → summary and progress update → console remains clean.

- [ ] **Step 4: Run mobile Browser QA**

Use a mobile viewport to verify the portrait stage is not sticky, crops remain legible, the 420-millisecond transition has no overlap or scroll trap, and all eight items remain readable.

- [ ] **Step 5: Run reduced-motion Browser QA**

Emulate `prefers-reduced-motion: reduce`, activate another stage, and verify the normal photo changes without the canvas character/fragment animation.

- [ ] **Step 6: Stop the preview and verify cleanup**

Run: `npm run stop`

Expected: HTTP acceptance stops and the project control record/listener is cleaned up.

- [ ] **Step 7: Run final cleanliness checks**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the intended specs, plan, assets, HTML, CSS, JavaScript, and test changes are present. No commit, push, or deployment occurs.
