# Physical-to-Digital Career Portraits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render career stages `01–05` as progressively finer green analog-pixel heads, preserve the embossed ASCII renderer for `06–08`, and narrate the physical-to-digital transition beneath every portrait.

**Architecture:** Extend the existing dependency-free single-Canvas portrait renderer with explicit per-stage presentation metadata and two modes: `pixel-analog` and `ascii-depth`. Both modes reuse the existing transparent `640 × 800` head assets, scale/fallback flow, pointer scheduler, Matrix transition, and semantic images; localized HTML supplies the mode parameters and visible transformation captions.

**Tech Stack:** Dependency-free HTML/CSS/JavaScript, Canvas 2D, Node.js `node:test` + `vm`, existing site validator and preview lifecycle, in-app Browser plugin.

## Global Constraints

- Stages `01–05` use `pixel-analog`; stages `06–08` use `ascii-depth`.
- Desktop analog cell sizes are exactly `14`, `11`, `8`, `6`, and `4 CSS px` for stages `01` through `05`.
- Analog palette-level counts are exactly `2`, `3`, `4`, `4`, and `5` for stages `01` through `05`.
- At portrait widths below `290 CSS px`, compute `nominalCellSize × (portraitWidth / 290)` and clamp to `[3, nominalCellSize] CSS px`.
- Use the ordered phosphor palette `#24420f`, `#4f7618`, `#82bd1d`, `#c8ff36`, `#efffb8` with the stage-specific subsets defined in the approved spec.
- Stages `01–05` draw portrait cells with `fillRect()` and make no portrait `fillText()` calls.
- Stages `06–08` preserve the existing `78–112` column, approximately `2.75 CSS px`, three-pass embossed ASCII renderer.
- Preserve the existing source pixels, alpha channels, `640 × 800` PNG/WebP assets, alternative text, and `0.84` Production Engineer scale; do not regenerate or retouch faces.
- Keep one display Canvas per portrait; do not add WebGL, a second depth Canvas, image-generation edits, asset variants, or a permanent animation loop.
- Analog pointer displacement is capped at `0.6 CSS px` per axis and snapped to backing-store pixels; pointer brightness radius is `max(36 CSS px, cellSize × 5)`.
- Digital pointer lighting, the `680 ms` desktop Matrix transition, off-screen suspension, reduced motion, and `08 → 01` order remain unchanged.
- Root and `/en/` use the approved English world labels/captions; `/tr/` uses the approved Turkish copy.
- Preserve semantic images and normal-image fallback; physical fallback images use `grayscale(1) sepia(1) saturate(5) hue-rotate(36deg) brightness(0.78)`.
- Preserve mobile vertical scrolling, zero horizontal overflow, all `8/8` lazy renderers, and zero final about/contact and credential/contact gaps at `390 × 844`.
- The current worktree already contains approved local 3D-ASCII work and follow-up test improvements. Preserve every existing change and do not reset or overwrite unrelated files.
- Delivery is local only: do not run `git add`, `git commit`, `git push`, `gh`, `az`, GitHub Actions, or Azure deployment without a separate publication instruction.
- Because commits are prohibited, every task ends with focused tests, `git diff --check`, and `git status --short` instead of a commit checkpoint.

## File Map

- `index.html`, `en/index.html`, `tr/index.html`: explicit presentation metadata, localized physical/digital labels, transformation captions, sticky-summary caption hooks, and cache keys.
- `scripts.js`: presentation parsing, mode routing, analog sampling/drawing, mode-specific pointer behavior, sticky-summary updates, and existing desktop stage integration.
- `styles.css`: physical/digital Canvas treatment, CRT scan lines, fallback filtering, and compact portrait-story typography.
- `tools/validate-portrait-canvas.mjs`: observable `fillRect()`/`fillText()` contracts, mode/cell/palette routing, pointer, reduced motion, scale, and fallback tests.
- `tools/validate-site.mjs`: exact localized metadata/caption parity and stage-order contracts.
- `docs/superpowers/specs/2026-08-15-physical-to-digital-career-portraits-design.md`: implementation and Browser-QA status.
- `docs/superpowers/specs/2026-08-15-career-ascii-3d-depth-design.md`: short note that stages `01–05` are superseded by the physical-to-digital design while `06–08` remain authoritative.

---

### Task 1: Localized presentation metadata and semantic portrait stories

**Files:**
- Modify: `tools/validate-site.mjs:6-26,75-104,143-183`
- Modify: `index.html:116-177`
- Modify: `en/index.html:116-177`
- Modify: `tr/index.html:116-177`

**Interfaces:**
- Produces on every `[data-timeline-step]`: `data-stage-portrait-mode`, optional `data-stage-pixel-size`, optional `data-stage-palette-levels`, `data-stage-world-label`, and `data-stage-bridge`.
- Produces visible `.portrait-story` HTML under every mobile portrait.
- Produces desktop summary hooks: `[data-stage-world-label]` and `[data-stage-bridge]` scoped inside `[data-stage-summary]`.
- Consumed by Task 2 presentation parsing and sticky-summary updates.

- [ ] **Step 1: Extend the site validator with the exact stage contracts**

Add these constants after `expectedStageImages`:

```js
const expectedPortraitModes = [
  "ascii-depth",
  "ascii-depth",
  "ascii-depth",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
  "pixel-analog",
];
const expectedPixelSizes = ["4", "6", "8", "11", "14"];
const expectedPaletteLevels = ["5", "4", "4", "3", "2"];
const expectedEnglishBridges = [
  "Turning intelligence into working systems",
  "From models to products",
  "From data to models",
  "From operations to data",
  "Making production measurable",
  "From materials to evidence",
  "Systems and flow",
  "Matter and mechanics",
];
const expectedTurkishBridges = [
  "Zekâyı çalışan sistemlere dönüştürmek",
  "Modellerden ürünlere",
  "Veriden modellere",
  "Operasyondan veriye",
  "Üretimi ölçülebilir kılmak",
  "Malzemeden kanıta",
  "Sistemler ve akış",
  "Madde ve mekanik",
];
```

Inside the localized-page loop, after the stage-number assertion, add:

```js
const portraitModes = matches(html, /data-stage-portrait-mode="([^"]+)"/g);
check(JSON.stringify(portraitModes) === JSON.stringify(expectedPortraitModes), `${locale}: portrait modes or order differ`);
const pixelSizes = matches(html, /data-stage-pixel-size="([^"]+)"/g);
check(JSON.stringify(pixelSizes) === JSON.stringify(expectedPixelSizes), `${locale}: analog pixel sizes must be 4, 6, 8, 11, 14 in reverse timeline order`);
const paletteLevels = matches(html, /data-stage-palette-levels="([^"]+)"/g);
check(JSON.stringify(paletteLevels) === JSON.stringify(expectedPaletteLevels), `${locale}: analog palette levels must be 5, 4, 4, 3, 2 in reverse timeline order`);
const expectedBridges = locale === "tr" ? expectedTurkishBridges : expectedEnglishBridges;
const bridges = matches(html, /data-stage-bridge="([^"]+)"/g);
check(JSON.stringify(bridges) === JSON.stringify(expectedBridges), `${locale}: physical-to-digital bridge copy differs`);
check((html.match(/class="portrait-story"/g) || []).length === 8, `${locale}: every portrait needs one visible story`);
check((html.match(/PHYSICAL WORLD|FİZİKSEL DÜNYA/g) || []).length >= 5, `${locale}: physical-world labels are incomplete`);
check((html.match(/DIGITAL WORLD|DİJİTAL DÜNYA/g) || []).length >= 3, `${locale}: digital-world labels are incomplete`);
```

Repeat the same root-page array checks using English expectations after the current root stage-number check.

- [ ] **Step 2: Run the validator and confirm the intended red state**

Run: `npm run validate:site`

Expected: FAIL with missing portrait-mode, analog pixel-size/palette, bridge-copy, and `.portrait-story` messages. Existing asset/order checks must remain green.

- [ ] **Step 3: Add exact stage metadata to root and English pages**

Use this exact reverse-timeline mapping on the eight `<li data-timeline-step>` elements in both English documents:

| Stage | Attributes |
| --- | --- |
| `08` | `data-stage-portrait-mode="ascii-depth" data-stage-world-label="DIGITAL WORLD" data-stage-bridge="Turning intelligence into working systems"` |
| `07` | `data-stage-portrait-mode="ascii-depth" data-stage-world-label="DIGITAL WORLD" data-stage-bridge="From models to products"` |
| `06` | `data-stage-portrait-mode="ascii-depth" data-stage-world-label="DIGITAL WORLD" data-stage-bridge="From data to models"` |
| `05` | `data-stage-portrait-mode="pixel-analog" data-stage-pixel-size="4" data-stage-palette-levels="5" data-stage-world-label="PHYSICAL WORLD" data-stage-bridge="From operations to data"` |
| `04` | `data-stage-portrait-mode="pixel-analog" data-stage-pixel-size="6" data-stage-palette-levels="4" data-stage-world-label="PHYSICAL WORLD" data-stage-bridge="Making production measurable"` plus existing `data-stage-portrait-scale="0.84"` |
| `03` | `data-stage-portrait-mode="pixel-analog" data-stage-pixel-size="8" data-stage-palette-levels="4" data-stage-world-label="PHYSICAL WORLD" data-stage-bridge="From materials to evidence"` |
| `02` | `data-stage-portrait-mode="pixel-analog" data-stage-pixel-size="11" data-stage-palette-levels="3" data-stage-world-label="PHYSICAL WORLD" data-stage-bridge="Systems and flow"` |
| `01` | `data-stage-portrait-mode="pixel-analog" data-stage-pixel-size="14" data-stage-palette-levels="2" data-stage-world-label="PHYSICAL WORLD" data-stage-bridge="Matter and mechanics"` |

Immediately after each `<picture class="timeline-step-portrait">…</picture>`, add the matching semantic story. Example for stage `05`:

```html
<div class="portrait-story" data-portrait-world="physical">
  <span class="portrait-story-world"><span aria-hidden="true">■</span> PHYSICAL WORLD</span>
  <span class="portrait-story-bridge">From operations to data</span>
</div>
```

Digital example for stage `06`:

```html
<div class="portrait-story" data-portrait-world="digital">
  <span class="portrait-story-world"><span aria-hidden="true">&gt;_</span> DIGITAL WORLD</span>
  <span class="portrait-story-bridge">From data to models</span>
</div>
```

Add the initial digital story hooks inside the desktop `[data-stage-summary]`, before `[data-stage-role]`:

```html
<span class="portrait-stage-world" data-stage-world-label><span aria-hidden="true">&gt;_</span> DIGITAL WORLD</span>
```

Add this immediately after `[data-stage-role]`:

```html
<span class="portrait-stage-bridge" data-stage-bridge>Turning intelligence into working systems</span>
```

- [ ] **Step 4: Add exact Turkish metadata and stories**

Use the same modes, pixel sizes, and palette counts in `tr/index.html`, with this copy:

| Stage | World label | Bridge |
| --- | --- | --- |
| `08` | `DİJİTAL DÜNYA` | `Zekâyı çalışan sistemlere dönüştürmek` |
| `07` | `DİJİTAL DÜNYA` | `Modellerden ürünlere` |
| `06` | `DİJİTAL DÜNYA` | `Veriden modellere` |
| `05` | `FİZİKSEL DÜNYA` | `Operasyondan veriye` |
| `04` | `FİZİKSEL DÜNYA` | `Üretimi ölçülebilir kılmak` |
| `03` | `FİZİKSEL DÜNYA` | `Malzemeden kanıta` |
| `02` | `FİZİKSEL DÜNYA` | `Sistemler ve akış` |
| `01` | `FİZİKSEL DÜNYA` | `Madde ve mekanik` |

Use marker `■` for physical stages and escaped `&gt;_` for digital stages. The desktop summary starts with stage `08` Turkish copy.

- [ ] **Step 5: Verify localized parity and checkpoint the local diff**

Run: `npm run validate:site && git diff --check`

Expected: PASS; root and English share exact English metadata/captions, Turkish has exact localized captions, existing `08 → 01` assets/order and `0.84` metadata remain intact.

Run: `git status --short`

Expected: only the existing approved local changes plus the new design/plan and in-scope HTML/validator changes; do not commit.

---

### Task 2: Presentation parsing, generic renderer interface, and desktop/mobile routing

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:48-317,319-487`
- Modify: `scripts.js:26-55,110-155,404-528,725-768`

**Interfaces:**
- Produces: `readPortraitPresentation(element, attributes?) -> { mode, nominalCellSize, paletteLevels, scale }`.
- Produces: `createCareerPortraitRenderer({ wrap, image, presentation }) -> { canvas, destroy(), drawStatic(), setImage(media, { presentation? }), snapshot() } | null`.
- Defaults: `mode: "ascii-depth"`, `nominalCellSize: 4`, `paletteLevels: 5`, `scale: 1`.
- Desktop attributes use `data-stage-*`; mobile renderers read the containing `[data-timeline-step]`.
- Consumed by Tasks 3–4 analog sampling/drawing and pointer behavior.

- [ ] **Step 1: Extend the VM fixture with stage presentation data**

Add a helper that builds real attribute access:

```js
function createStage({
  mode = "ascii-depth",
  nominalCellSize,
  paletteLevels,
  scale = 1,
  role = "AI Engineer",
  png = "/images/career/08-ai-engineer.png",
  webp = "/images/career/08-ai-engineer.webp",
} = {}) {
  const attributes = new Map([
    ["data-stage-image-alt", `Portrait associated with the ${role} career stage`],
    ["data-stage-image-png", png],
    ["data-stage-image-webp", webp],
    ["data-stage-portrait-mode", mode],
    ["data-stage-role", role],
  ]);
  if (nominalCellSize != null) attributes.set("data-stage-pixel-size", String(nominalCellSize));
  if (paletteLevels != null) attributes.set("data-stage-palette-levels", String(paletteLevels));
  if (scale !== 1) attributes.set("data-stage-portrait-scale", String(scale));
  return createEventTarget({
    getAttribute: (name) => attributes.get(name) || null,
  });
}
```

Allow `createWrap({ inline, stage })` and implement:

```js
closest(selector) {
  if (selector === "[data-timeline-step]") return stage || null;
  return null;
}
```

Add an attribute map to the fake wrap so `setAttribute()` and `getAttribute()` record renderer mode. Preserve the current style-value map and existing scale tests.

- [ ] **Step 2: Write the failing parser/routing test**

Add:

```js
test("routes explicit analog presentation and defaults ordinary stages to ASCII depth", async () => {
  const analogStage = createStage({
    mode: "pixel-analog",
    nominalCellSize: 14,
    paletteLevels: 2,
    role: "Mechanical Engineering",
  });
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: [analogStage, createStage()] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  assert.equal(fixture.inlineWraps[0].getAttribute("data-portrait-render-mode"), "pixel-analog");
  assert.equal(fixture.inlineWraps[0].style.getPropertyValue("--portrait-pixel-size"), "14");
  assert.equal(fixture.inlineWraps[0].style.getPropertyValue("--portrait-palette-levels"), "2");
  assert.equal(fixture.inlineWraps[1].getAttribute("data-portrait-render-mode"), "ascii-depth");
});
```

- [ ] **Step 3: Run the focused test and confirm the intended red state**

Run: `npm run test:portrait`

Expected: FAIL because the renderer has no presentation reader, does not inspect the containing timeline stage, and does not expose render mode/cell/palette values.

- [ ] **Step 4: Implement bounded presentation parsing**

Add after `readPortraitScale`:

```js
function readPortraitPresentation(element, attributes = {}) {
  const modeAttribute = attributes.mode || "data-portrait-mode";
  const cellAttribute = attributes.cellSize || "data-portrait-pixel-size";
  const paletteAttribute = attributes.paletteLevels || "data-portrait-palette-levels";
  const scaleAttribute = attributes.scale || "data-portrait-scale";
  const mode = element?.getAttribute?.(modeAttribute) === "pixel-analog"
    ? "pixel-analog"
    : "ascii-depth";
  const parsedCellSize = Number.parseFloat(element?.getAttribute?.(cellAttribute) || "4");
  const parsedPaletteLevels = Number.parseInt(element?.getAttribute?.(paletteAttribute) || "5", 10);
  return {
    mode,
    nominalCellSize: Number.isFinite(parsedCellSize)
      ? Math.max(3, Math.min(14, parsedCellSize))
      : 4,
    paletteLevels: Number.isFinite(parsedPaletteLevels)
      ? Math.max(2, Math.min(5, parsedPaletteLevels))
      : 5,
    scale: readPortraitScale(element, scaleAttribute),
  };
}
```

Use this exact desktop attribute map:

```js
const STAGE_PRESENTATION_ATTRIBUTES = {
  mode: "data-stage-portrait-mode",
  cellSize: "data-stage-pixel-size",
  paletteLevels: "data-stage-palette-levels",
  scale: "data-stage-portrait-scale",
};
```

- [ ] **Step 5: Generalize the renderer without changing digital drawing**

Rename `createAsciiPortraitRenderer` to `createCareerPortraitRenderer` and accept `presentation`:

```js
function createCareerPortraitRenderer({ wrap, image, presentation }) {
  if (!wrap || !image) return null;
  let currentPresentation = {
    mode: "ascii-depth",
    nominalCellSize: 4,
    paletteLevels: 5,
    scale: 1,
    ...presentation,
  };

  function applyPresentation(nextPresentation = {}) {
    currentPresentation = {
      mode: nextPresentation.mode === "pixel-analog" ? "pixel-analog" : "ascii-depth",
      nominalCellSize: Math.max(3, Math.min(14, Number(nextPresentation.nominalCellSize) || 4)),
      paletteLevels: Math.max(2, Math.min(5, Number(nextPresentation.paletteLevels) || 5)),
      scale: Number.isFinite(nextPresentation.scale) && nextPresentation.scale > 0 && nextPresentation.scale <= 1
        ? nextPresentation.scale
        : 1,
    };
    wrap.setAttribute("data-portrait-render-mode", currentPresentation.mode);
    wrap.style.setProperty("--portrait-source-scale", String(currentPresentation.scale));
    wrap.style.setProperty("--portrait-pixel-size", String(currentPresentation.nominalCellSize));
    wrap.style.setProperty("--portrait-palette-levels", String(currentPresentation.paletteLevels));
  }

  applyPresentation(currentPresentation);
  // existing Canvas setup and digital renderer follow
```

Replace `currentScale` reads in `fitSource()` with `currentPresentation.scale`. Change `setImage` to:

```js
function setImage(media, options = {}) {
  if (options.presentation) applyPresentation(options.presentation);
  currentMedia = media;
  if (media.complete && media.naturalWidth) {
    renderMedia(media);
    return;
  }
  media.addEventListener("load", () => renderMedia(media), { once: true });
}
```

Keep the existing `.ascii-portrait-canvas`, `.is-ascii-rendered`, and `.ascii-portrait-source` compatibility classes during this feature; renaming them is outside scope.

- [ ] **Step 6: Wire mobile, desktop, and sticky-summary data**

Mobile:

```js
const renderers = Array.from(document.querySelectorAll(".timeline-step-portrait"))
  .map((wrap) => {
    const step = wrap.closest("[data-timeline-step]");
    return createCareerPortraitRenderer({
      wrap,
      image: wrap.querySelector("img"),
      presentation: readPortraitPresentation(step, STAGE_PRESENTATION_ATTRIBUTES),
    });
  })
  .filter(Boolean);
```

Desktop initialization:

```js
const portraitRenderer = createCareerPortraitRenderer({
  wrap: stage,
  image,
  presentation: readPortraitPresentation(steps[0], STAGE_PRESENTATION_ATTRIBUTES),
});
```

In `setStage`, replace the scale-only read and update with:

```js
const presentation = readPortraitPresentation(nextStep, STAGE_PRESENTATION_ATTRIBUTES);
// after the incoming portrait succeeds
portraitRenderer?.setImage(portrait, { presentation });
```

Rename local `asciiRenderer` references to `portraitRenderer`, including `snapshot()`, `destroy()`, and the image-load path. The image-load handler must reapply the current step presentation rather than resetting to defaults.

In `initializeTimeline`, add scoped summary hooks:

```js
const stageWorldLabel = stageSummary?.querySelector("[data-stage-world-label]");
const stageBridge = stageSummary?.querySelector("[data-stage-bridge]");
```

Update them in `setActiveStep`:

```js
const worldLabel = activeStep.dataset.stageWorldLabel || "";
if (stageWorldLabel) {
  const marker = activeStep.dataset.stagePortraitMode === "pixel-analog" ? "■" : ">_";
  stageWorldLabel.textContent = `${marker} ${worldLabel}`;
}
if (stageBridge) stageBridge.textContent = activeStep.dataset.stageBridge || "";
```

- [ ] **Step 7: Verify parser/routing and preserve the digital baseline**

Run: `npm run test:portrait && npm run check:js && git diff --check`

Expected: PASS. Existing detailed ASCII, three-layer, scale, pointer, reduced-motion, and Canvas-failure tests remain green because digital drawing has not changed.

Run: `git status --short`; do not commit.

---

### Task 3: Progressive analog square-pixel sampling and drawing

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:58-109,319-487`
- Modify: `scripts.js:131-329`

**Interfaces:**
- Consumes: `currentPresentation.mode`, `nominalCellSize`, `paletteLevels`, and `scale` from Task 2.
- Produces in analog mode: cells `{ alpha, column, luminance, paletteIndex, row }`.
- Produces renderer state: `effectiveCellSize`, mode-specific `columns`/`rows`, and wrapper custom property `--portrait-effective-cell-size`.
- Preserves digital cells `{ alpha, column, depth, edge, glyph, luminance, row }` and all existing glyph passes.

- [ ] **Step 1: Record observable square-pixel Canvas calls**

In the fake Canvas context, replace the empty `fillRect` with:

```js
const fillRectCalls = [];
// context method
fillRect(x, y, width, height) {
  fillRectCalls.push({
    alpha: context.globalAlpha,
    fillStyle: context.fillStyle,
    height,
    width,
    x,
    y,
  });
},
```

Expose `fillRectCalls` on the fake Canvas and add `imageSmoothingEnabled: true` to the fake context defaults.

- [ ] **Step 2: Write the failing progressive-render test**

Add a five-stage mobile fixture using the exact analog presentations, then assert:

```js
test("renders stages 01 through 05 as progressively finer square phosphor pixels", async () => {
  const physicalStages = [
    createStage({ mode: "pixel-analog", nominalCellSize: 14, paletteLevels: 2, role: "Mechanical Engineering" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 11, paletteLevels: 3, role: "Industrial Engineering" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 8, paletteLevels: 4, role: "M.Sc. Materials and Manufacturing" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 6, paletteLevels: 4, scale: 0.84, role: "Production Engineer" }),
    createStage({ mode: "pixel-analog", nominalCellSize: 4, paletteLevels: 5, role: "Production Manager" }),
  ];
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: physicalStages });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const widths = fixture.inlineWraps.map((wrap) => {
    const canvas = wrap.querySelector(".ascii-portrait-canvas");
    assert.ok(canvas.fillRectCalls.length > 100, "analog head must contain visible pixel cells");
    assert.equal(canvas.fillTextCalls.length, 0, "physical stages must not draw ASCII glyphs");
    const first = canvas.fillRectCalls[0];
    assert.ok(Math.abs(first.width - first.height) < 0.0001, "analog cells must be square");
    return first.width;
  });

  assert.ok(widths.every((width, index) => index === 0 || widths[index - 1] > width));
});
```

Add a palette assertion for the five Canvas surfaces:

```js
const expectedColorCaps = [2, 3, 4, 4, 5];
fixture.inlineWraps.forEach((wrap, index) => {
  const colors = new Set(wrap.querySelector(".ascii-portrait-canvas").fillRectCalls.map((call) => call.fillStyle));
  assert.ok(colors.size <= expectedColorCaps[index]);
  assert.ok(colors.size >= 2);
});
```

- [ ] **Step 3: Run the portrait suite and confirm the intended red state**

Run: `npm run test:portrait`

Expected: FAIL because analog stages still run the digital `fillText()` renderer and produce no recorded portrait `fillRect()` cells.

- [ ] **Step 4: Add mode-specific grid sizing**

Add renderer state:

```js
const phosphorPalette = ["#24420f", "#4f7618", "#82bd1d", "#c8ff36", "#efffb8"];
let effectiveCellSize = 2.75;
```

At the start of `sampleMedia`:

```js
if (currentPresentation.mode === "pixel-analog") {
  effectiveCellSize = Math.max(
    3,
    Math.min(
      currentPresentation.nominalCellSize,
      currentPresentation.nominalCellSize * (width / 290),
    ),
  );
  columns = Math.max(1, Math.ceil(width / effectiveCellSize));
  rows = Math.max(1, Math.ceil(height / effectiveCellSize));
} else {
  effectiveCellSize = 2.75;
  columns = Math.max(78, Math.min(112, Math.round(width / 2.75)));
  rows = Math.max(28, Math.round(columns * (height / width) * 0.55));
}
wrap.style.setProperty("--portrait-effective-cell-size", String(effectiveCellSize));
```

Keep DPR capped at `2`, Canvas CSS/backing dimensions unchanged, and let `fitSource()` use the active mode's `columns`/`rows` so the existing center/scale behavior is shared.

- [ ] **Step 5: Build mode-specific cells from the shared luminance buffers**

Inside the visible-sample loop, branch before edge/depth calculation:

```js
if (currentPresentation.mode === "pixel-analog") {
  const paletteLevels = currentPresentation.paletteLevels;
  const paletteIndex = Math.min(
    paletteLevels - 1,
    Math.floor(luminance * paletteLevels),
  );
  nextCells.push({ alpha, column, luminance, paletteIndex, row });
  continue;
}
```

Add this palette selector outside the loop:

```js
function getAnalogPalette(levels) {
  if (levels === 2) return ["#4f7618", "#c8ff36"];
  if (levels === 3) return ["#4f7618", "#82bd1d", "#c8ff36"];
  if (levels === 4) return phosphorPalette.slice(0, 4);
  return phosphorPalette;
}
```

- [ ] **Step 6: Draw analog cells with sharp square blocks**

At the top of `draw`, branch to a new helper before configuring text:

```js
function drawAnalogPixels() {
  const palette = getAnalogPalette(currentPresentation.paletteLevels);
  ctx.imageSmoothingEnabled = false;
  for (const cell of cells) {
    const x = cell.column * effectiveCellSize;
    const y = cell.row * effectiveCellSize;
    ctx.fillStyle = palette[Math.min(palette.length - 1, cell.paletteIndex)];
    ctx.globalAlpha = Math.min(1, cell.alpha * (0.72 + (1 - cell.luminance) * 0.28));
    ctx.fillRect(x, y, effectiveCellSize, effectiveCellSize);
  }
}

if (currentPresentation.mode === "pixel-analog") {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  drawAnalogPixels();
  ctx.globalAlpha = 1;
  wrap.classList.add("is-ascii-rendered");
  image.classList.add("ascii-portrait-source");
  return;
}
```

Do not change `drawGlyphLayer()` or the three digital call sites.

- [ ] **Step 7: Verify progressive pixels and digital non-regression**

Run: `npm run test:portrait && npm run check:js && git diff --check`

Expected: PASS. Five physical renderers use square `fillRect()` cells in strict coarse-to-fine order and no glyphs; existing digital detail/layer/scale tests remain green.

Run: `git status --short`; do not commit.

---

### Task 4: Analog pointer phosphor response, reduced motion, fallback, and caption styling

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:319-520`
- Modify: `scripts.js:261-413`
- Modify: `styles.css:518-641,721-760,919-960,1440-1565`

**Interfaces:**
- Consumes: analog cells and `effectiveCellSize` from Task 3.
- Produces: pointer-driven analog brightness/displacement with no glyph calls.
- Produces CSS state via `[data-portrait-render-mode="pixel-analog"]` and `[data-portrait-render-mode="ascii-depth"]`.
- Preserves the existing digital pointer scheduler and reduced-motion behavior.

- [ ] **Step 1: Write failing analog pointer and reduced-motion tests**

Add:

```js
test("analog pointer movement changes phosphor pixels without drawing glyphs", async () => {
  const analog = createStage({ mode: "pixel-analog", nominalCellSize: 8, paletteLevels: 4 });
  const fixture = await createAsciiFixture({ mobile: true, mobileStages: [analog] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const canvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  const settledCalls = canvas.fillRectCalls.slice();
  fixture.inlineWraps[0].dispatch("pointermove", { clientX: 210, clientY: 70, pointerType: "touch" });
  fixture.runAnimationFrame();
  const movedCalls = canvas.fillRectCalls.slice(settledCalls.length);

  assert.ok(movedCalls.length > 0, "pointer movement must redraw analog pixels");
  assert.ok(
    movedCalls.some((moved, index) => {
      const settled = settledCalls[index];
      return settled && (
        moved.x !== settled.x
        || moved.y !== settled.y
        || moved.alpha !== settled.alpha
        || moved.fillStyle !== settled.fillStyle
      );
    }),
    "analog pointer must change at least one pixel position, brightness, or palette level",
  );
  assert.equal(canvas.fillTextCalls.length, 0);
});

test("reduced motion draws static analog pixels with no recurring frame", async () => {
  const analog = createStage({ mode: "pixel-analog", nominalCellSize: 14, paletteLevels: 2 });
  const fixture = await createAsciiFixture({ mobile: true, reduceMotion: true, mobileStages: [analog] });
  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const canvas = fixture.inlineWraps[0].querySelector(".ascii-portrait-canvas");
  assert.ok(canvas.fillRectCalls.length > 100);
  assert.equal(canvas.fillTextCalls.length, 0);
  assert.equal(fixture.animationFrames.length, 0);
});
```

- [ ] **Step 2: Run the suite and confirm the intended red state**

Run: `npm run test:portrait`

Expected: the static analog test passes, but the pointer test FAILS because settled and moved pixels are identical.

- [ ] **Step 3: Add bounded analog phosphor response**

In `drawAnalogPixels`, calculate pointer response per cell:

```js
const centerX = (cell.column + 0.5) * effectiveCellSize;
const centerY = (cell.row + 0.5) * effectiveCellSize;
const pointerRadius = Math.max(36, effectiveCellSize * 5);
const distance = Math.hypot(centerX - pointer.x, centerY - pointer.y);
const glow = pointer.inside ? Math.max(0, 1 - distance / pointerRadius) : 0;
const displacementX = Math.max(-0.6, Math.min(0.6, light.x * 0.5 * glow));
const displacementY = Math.max(-0.6, Math.min(0.6, light.y * 0.5 * glow));
const snap = (value) => Math.round(value * dpr) / dpr;
const paletteIndex = Math.min(
  palette.length - 1,
  cell.paletteIndex + (glow >= 0.35 ? 1 : 0),
);

ctx.fillStyle = palette[paletteIndex];
ctx.globalAlpha = Math.min(1, cell.alpha * (0.72 + (1 - cell.luminance) * 0.28 + glow * 0.2));
ctx.fillRect(
  snap(cell.column * effectiveCellSize + displacementX),
  snap(cell.row * effectiveCellSize + displacementY),
  effectiveCellSize,
  effectiveCellSize,
);
```

In `updatePointer`, keep light targets and CSS variables for both modes, but only add column velocities in digital mode:

```js
if (currentPresentation.mode === "ascii-depth") {
  for (let column = 0; column < columns; column += 1) {
    const centerX = (column + 0.5) / columns * width;
    const falloff = Math.max(0, 1 - Math.abs(centerX - x) / radius);
    velocities[column] += speed * falloff * falloff;
  }
}
```

In `animateMotion`, only integrate `offsets`/`velocities` for `ascii-depth`; analog motion energy comes from the existing damped light target. This prevents ASCII-style elastic columns in physical stages and still lets analog glow settle without a permanent loop.

- [ ] **Step 4: Add mode-specific Canvas, CRT, and fallback styling**

Add:

```css
[data-portrait-render-mode="pixel-analog"] .ascii-portrait-canvas,
.timeline-step-portrait[data-portrait-render-mode="pixel-analog"] .ascii-portrait-canvas {
  filter: drop-shadow(0 0 5px rgba(130, 189, 29, 0.28));
  image-rendering: pixelated;
}

[data-portrait-render-mode="pixel-analog"]::after {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: repeating-linear-gradient(
    180deg,
    transparent 0 3px,
    rgba(5, 7, 4, 0.11) 3px 4px
  );
  content: "";
  pointer-events: none;
}

[data-portrait-render-mode="pixel-analog"] .career-portrait-image,
.timeline-step-portrait[data-portrait-render-mode="pixel-analog"] img {
  filter: grayscale(1) sepia(1) saturate(5) hue-rotate(36deg) brightness(0.78);
}
```

The last rule is the visible-image fallback treatment; `.is-ascii-rendered` must continue hiding the source after successful Canvas drawing. Ensure the overlay does not cover `.career-transition` during the Matrix sweep by preserving its higher active z-index or suppressing the scan line opacity under `.is-transitioning`.

- [ ] **Step 5: Style semantic stories and the sticky summary**

Add a compact grid that remains subordinate to role headings:

```css
.portrait-story {
  display: grid;
  max-width: 650px;
  gap: 4px;
  margin: -18px 0 22px;
  font-family: var(--font-geist-mono), monospace;
}

.portrait-story-world,
.portrait-stage-world {
  color: #82bd1d;
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.portrait-story[data-portrait-world="digital"] .portrait-story-world,
.portrait-stage[data-portrait-world="digital"] .portrait-stage-world {
  color: #c8ff36;
}

.portrait-story-bridge,
.portrait-stage-bridge {
  color: rgba(255, 253, 247, 0.58);
  font-size: 0.68rem;
  line-height: 1.35;
}
```

In `setActiveStep`, set `stageSummary.dataset.portraitWorld` to `"physical"` or `"digital"` from the active mode so the sticky world label receives the correct color. At `max-width: 480px`, allow `.portrait-story-bridge` to wrap to two lines while keeping `overflow-wrap: anywhere`; do not set a fixed height.

- [ ] **Step 6: Verify pointer, reduced motion, fallback, and caption layout contracts**

Run: `npm run test:portrait && npm run validate:site && npm run check:js && git diff --check`

Expected: PASS. Analog pointer redraw changes at least one pixel property, physical stages never draw glyphs, reduced motion schedules zero frames, digital tests remain green, and localized stories stay consistent.

Run: `git status --short`; do not commit.

---

### Task 5: Cache parity, documentation state, and full automated contract

**Files:**
- Modify: `index.html:33-34`
- Modify: `en/index.html:33-34`
- Modify: `tr/index.html:33-34`
- Modify: `docs/superpowers/specs/2026-08-15-physical-to-digital-career-portraits-design.md:1-296`
- Modify: `docs/superpowers/specs/2026-08-15-career-ascii-3d-depth-design.md:1-160`
- Verify read-only: `.github/workflows/azure-static-web-apps-red-tree-06630f303.yml`

**Interfaces:**
- Produces matching CSS/JS cache key `20260815-physical-digital` in all three HTML documents.
- Produces implementation status `Implemented locally; browser QA pending` before Task 6.
- Preserves the existing workflow and local-only delivery boundary.

- [ ] **Step 1: Update localized cache keys**

Use exactly in root, English, and Turkish heads:

```html
<link rel="stylesheet" href="/styles.css?v=20260815-physical-digital">
<script src="/scripts.js?v=20260815-physical-digital" defer></script>
```

- [ ] **Step 2: Update design-document status without changing the delivery boundary**

Set the new design status to:

```markdown
**Status:** Implemented locally; browser QA pending
```

Append this implementation note:

```markdown
## Implementation Note

- Physical stages `01–05`: square `fillRect()` phosphor cells at nominal `14, 11, 8, 6, 4 CSS px`.
- Digital stages `06–08`: preserved three-pass embossed ASCII.
- Runtime assets: unchanged transparent `640 × 800` PNG/WebP heads; no regenerated images.
- Narrative: localized physical/digital world labels and eight semantic transformation captions.
- Automated coverage: mode routing, progressive cell sizes, palette limits, pointer response, reduced motion, scale reset, fallback, and localized parity.
```

In the prior 3D-depth design, append:

```markdown
## Superseding Visual Scope

The physical-to-digital portrait design supersedes the settled visual renderer for stages `01–05`. The three-pass embossed ASCII specification remains authoritative for stages `06–08`, and all scale, fallback, motion, transition, and responsive contracts remain in force.
```

- [ ] **Step 3: Run the complete local automated contract**

Run: `npm test`

Expected: PASS for JavaScript syntax, deployment tests, environment action, portrait renderer tests, project-scoped stop tests, and site validation. If the sandbox alone denies a loopback listener with `listen EPERM`, rerun the unchanged command using the already approved project-local loopback permission; do not change code.

Run: `npm run test:server`

Expected: all HTTP server-contract tests PASS and no preview remains running.

Run: `git diff --check`

Expected: PASS with no whitespace errors.

- [ ] **Step 4: Confirm the workflow and local-only checkpoint**

Read `.github/workflows/azure-static-web-apps-red-tree-06630f303.yml` and confirm it still runs `npm test` and `npm run test:server` before the unchanged static upload. Do not edit or execute it.

Run: `git status --short`

Expected: only the approved previous changes, the new spec/plan, and in-scope HTML/CSS/JS/test/validator/doc changes. There must be no portrait bitmap changes, screenshots, generated assets, staged files, commits, or deployment artifacts.

---

### Task 6: Desktop and mobile Browser QA, final documentation status, and runtime cleanup

**Files:**
- Verify: `index.html`, `en/index.html`, `tr/index.html`, `scripts.js`, `styles.css`
- Verify unchanged: `images/career/01-mechanical-engineering.png` through `images/career/08-ai-engineer.png` and WebP equivalents
- Modify after successful QA: `docs/superpowers/specs/2026-08-15-physical-to-digital-career-portraits-design.md`
- Do not create repository screenshots or reports.

**Interfaces:**
- Consumes the local preview at `http://127.0.0.1:4173/`.
- Produces browser evidence for progressive analog resolution, `05 → 06` Matrix transition, digital non-regression, localized captions, mobile `8/8`, overflow/gap invariants, and cleanup.

- [ ] **Step 1: Read and use the Browser skill, then start the project-scoped preview**

Read the complete Browser skill before browser work. Run:

```bash
npm run dev
```

Expected: `Preview server running at http://127.0.0.1:4173`.

Use a fresh Browser tab chosen for that URL. Keep any screenshots under `/tmp/physical-digital-career-qa/` only.

- [ ] **Step 2: Verify desktop at `1440 × 1000`**

At page load, confirm stage `08`:

```text
Mode: ascii-depth
World label: DIGITAL WORLD
Bridge: Turning intelligence into working systems
Canvas opacity: 1
Source opacity: 0
Broken images: 0
Horizontal overflow: 0
```

Scroll and settle stage `06`; confirm it retains dark extrusion, lime front glyphs, pale highlights, and pointer-dependent depth lighting.

Traverse stage `05 → 06` and sample `is-transitioning` during the sweep. Require the transition to become `true`, then clear to `false` after the `680 ms` animation settles.

Settle and capture stages `05` and `01`. Read the renderer's `--portrait-effective-cell-size` custom property and visually confirm `01` is distinctly coarser than `05`, both contain only square blocks, and neither contains visible text glyphs. Require:

```text
Stage 01 nominal pixel size: 14
Stage 05 nominal pixel size: 4
Stage 01 palette levels: 2
Stage 05 palette levels: 5
Physical world labels/captions: correct
Heads: centered, contained, uncropped
```

Settle stage `04`; confirm the wrapper scale is `0.84`, the head is not oversized, and the mode remains `pixel-analog`.

Exercise pointer movement on stage `05`; confirm the phosphor hotspot moves while squares remain crisp. Exercise stage `06`; confirm the existing embossed pointer-light behavior remains.

- [ ] **Step 3: Verify mobile at `390 × 844`**

Reload at `390 × 844` and traverse the full timeline. Require:

```text
Portrait wrappers: 8
Canvas elements: 8
Rendered wrappers after traversal: 8
Opaque canvases: 8
Hidden sources: 8
Head-detail sources: 8
Pixel-analog wrappers: 5
ASCII-depth wrappers: 3
Broken images: 0
Horizontal overflow: 0
Production Engineer scale: 0.84
```

Read `--portrait-effective-cell-size` from every physical wrapper and confirm the values remain strictly ordered `01 > 02 > 03 > 04 > 05` after mobile scaling. Visually confirm physical portraits use square blocks without visible glyphs; the automated Canvas recorder is the authoritative `fillRect()`/`fillText()` contract. Confirm digital ASCII remains legible.

Verify all eight visible stories and the exact localized labels/captions on `/tr/`. Exercise pointer/touch interaction inside one analog portrait and prove a vertical scroll can start on the same portrait without being blocked.

At the page end require:

```text
.section-about padding-bottom: 0px
About-to-contact gap: 0px
Last-credential-to-contact gap: 0px
```

- [ ] **Step 4: Check diagnostics and update the QA status**

Require zero relevant application console warnings/errors. After every Browser assertion passes, change the new design status to:

```markdown
**Status:** Implemented and browser-QA validated locally
```

Add a dated QA note containing the tested viewports, progressive stage checks, `05 → 06` transition, localized story checks, mobile `8/8`, zero overflow/gaps, and clean console result. Do not claim publication.

- [ ] **Step 5: Close Browser state and leave a clean runtime**

Reset the temporary viewport and close the QA tab. Run:

```bash
npm run stop
```

Expected: `Preview server stopped at http://127.0.0.1:4173`.

Run:

```bash
lsof -nP -iTCP:4173 -sTCP:LISTEN
```

Expected: exit `1` with no output.

Run: `git diff --check && git status --short`

Expected: only approved local source/spec/plan/test changes; no screenshot or bitmap changes, no staged files, no commit, no push, and no deployment.
