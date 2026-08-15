# Career ASCII 3D Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize the Production Engineer head scale and render all eight career portraits as crisp, interactive, embossed Matrix ASCII without regressing transitions, fallbacks, mobile layout, or accessibility.

**Architecture:** Keep the existing single Canvas 2D renderer and enrich each sampled cell with local edge strength and bounded virtual depth. Draw each frame in three back-to-front glyph passes, while explicit `data-portrait-scale` metadata flows from localized timeline markup into both source fitting and the normal-image fallback. Preserve the existing animation scheduler, Matrix transition canvas, and semantic `<img>` elements.

**Tech Stack:** Dependency-free HTML/CSS/JavaScript, Canvas 2D, Node.js `node:test` + `vm`, Azure-compatible static files, in-app Browser plugin.

## Global Constraints

- Production Engineer uses explicit visual scale `0.84`; every unannotated career stage defaults to `1`.
- Preserve all existing source pixels, identity, alpha channels, `640 × 800` PNG/WebP assets, and alternative text; do not regenerate or retouch faces.
- Keep the existing `78–112` column range, approximately `2.75 CSS px` cell width, and device-pixel-ratio cap of `2`.
- Draw one dark extrusion pass, one Matrix-lime front pass, and one selective pale edge-highlight pass on the same canvas.
- Settled depth offset never exceeds `2 CSS px`; pointer lighting is bounded to approximately `±1.2 CSS px` per axis.
- Keep the `680 ms` desktop Matrix transition, elastic column displacement, off-screen animation suspension, and `08 → 01` ordering.
- Reduced motion renders a static three-layer portrait and schedules no recurring animation.
- Preserve mobile vertical scrolling, zero horizontal overflow, and zero final credential/contact gap at `390 × 844`.
- Preserve normal-image fallback and semantic `<img>` elements; hide source pixels only after embossed ASCII draws successfully.
- Do not add dependencies, a second depth canvas, WebGL, RGB splitting, or a permanent animation loop.
- Delivery is local only: do not commit, push, trigger GitHub Actions, or deploy to Azure without a separate explicit publication instruction. Because of this boundary, the normal commit checkpoints are replaced with `git diff --check` and `git status --short` review checkpoints.

## File Map

- `scripts.js`: scale parsing/application, scaled source fitting, depth sampling, multi-pass glyph drawing, and pointer-light damping.
- `styles.css`: source fallback scaling and restrained full-canvas drop shadow.
- `index.html`, `en/index.html`, `tr/index.html`: localized parity for Production Engineer scale metadata and cache keys.
- `tools/validate-portrait-canvas.mjs`: observable Canvas call records plus scale, layer, pointer, reduced-motion, and fallback contracts.
- `docs/superpowers/specs/2026-08-15-career-ascii-3d-depth-design.md`: approved behavior specification and eventual implementation status.

---

### Task 1: Production Engineer scale metadata and source fitting

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:48-234`
- Modify: `scripts.js:110-393`
- Modify: `scripts.js:411-662`
- Modify: `styles.css:514-552`
- Modify: `index.html:144-166`
- Modify: `en/index.html:144-166`
- Modify: `tr/index.html:144-166`

**Interfaces:**
- Produces: `readPortraitScale(element) -> number`
- Produces: `createAsciiPortraitRenderer({ wrap, image, scale }) -> { canvas, destroy(), drawStatic(), setImage(media, options), snapshot() } | null`
- Produces: `setImage(media, { scale?: number })`
- Consumes: `data-portrait-scale="0.84"` on the Production Engineer mobile `<picture>` and `data-stage-portrait-scale="0.84"` on its timeline step.

- [ ] **Step 1: Extend the real Canvas fake and write the failing scale test**

Record `drawImage` arguments and inline style values in the fixture, and allow the two mobile wrappers to carry literal scale metadata. Change the fixture signature and wrapper construction exactly as follows:

```js
async function createAsciiFixture({
  mobile = false,
  reduceMotion = false,
  canvasAvailable = true,
  portraitScales = [1, 1],
} = {}) {
  // existing fixture setup remains
  const desktopWrap = createWrap();
  const inlineWraps = [
    createWrap({ inline: true, scale: portraitScales[0] }),
    createWrap({ inline: true, scale: portraitScales[1] }),
  ];
}
```

Then record each Canvas call:

```js
function createCanvas() {
  const drawImageCalls = [];
  const fillTextCalls = [];
  const context = {
    clearRect() {},
    drawImage(...args) {
      drawImageCalls.push(args);
    },
    // existing methods remain
  };
  const canvas = createEventTarget({
    classList: new FakeClassList(),
    drawImageCalls,
    fillTextCalls,
    getContext: () => canvasAvailable ? context : null,
    setAttribute() {},
    style: {},
    width: 0,
    height: 0,
  });
  canvases.push(canvas);
  return canvas;
}
```

Replace the fixture style stub with a recorded map and expose `data-portrait-scale` through `getAttribute`:

```js
function createWrap({ inline = false, scale = 1 } = {}) {
  const styleValues = new Map();
  // existing setup remains
  const wrap = createEventTarget({
    // existing properties remain
    getAttribute(name) {
      if (name === "data-portrait-scale" && scale !== 1) return String(scale);
      return null;
    },
    style: {
      getPropertyValue(name) {
        return styleValues.get(name) || "";
      },
      setProperty(name, value) {
        styleValues.set(name, String(value));
      },
    },
  });
  return wrap;
}
```

Create mobile wrappers with scales `[0.84, 1]`, then add:

```js
test("applies explicit Production Engineer scale without changing ordinary portraits", async () => {
  const fixture = await createAsciiFixture({ mobile: true, portraitScales: [0.84, 1] });

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const sourceCanvases = fixture.canvases.filter((canvas) =>
    canvas.drawImageCalls.some((call) => call.length === 9),
  );
  assert.equal(sourceCanvases.length, 2);

  const productionCall = sourceCanvases[0].drawImageCalls.at(-1);
  const ordinaryCall = sourceCanvases[1].drawImageCalls.at(-1);
  const productionArea = productionCall[7] * productionCall[8];
  const ordinaryArea = ordinaryCall[7] * ordinaryCall[8];

  assert.ok(Math.abs(productionArea / ordinaryArea - 0.84 ** 2) < 0.02);
  assert.equal(
    fixture.inlineWraps[0].style.getPropertyValue("--portrait-source-scale"),
    "0.84",
  );
  assert.equal(
    fixture.inlineWraps[1].style.getPropertyValue("--portrait-source-scale"),
    "1",
  );
});
```

- [ ] **Step 2: Run the portrait test and verify the intended red state**

Run: `npm run test:portrait`

Expected: FAIL in `applies explicit Production Engineer scale without changing ordinary portraits` because the renderer does not read scale metadata, does not write `--portrait-source-scale`, and both destination areas are equal.

- [ ] **Step 3: Implement bounded scale parsing and scaled source fitting**

Add before `createAsciiPortraitRenderer`:

```js
function readPortraitScale(element, attribute = "data-portrait-scale") {
  const parsed = Number.parseFloat(element?.getAttribute?.(attribute) || "1");
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 1;
}
```

Change the renderer signature and maintain `currentScale`:

```js
function createAsciiPortraitRenderer({ wrap, image, scale = 1 }) {
  if (!wrap || !image) return null;
  let currentScale = Number.isFinite(scale) && scale > 0 && scale <= 1 ? scale : 1;
  wrap.style.setProperty("--portrait-source-scale", String(currentScale));
  // existing canvas setup follows
```

At the end of the existing aspect-ratio branch in `fitSource`, scale around the fitted destination center:

```js
const centerX = drawX + drawWidth / 2;
const centerY = drawY + drawHeight / 2;
drawWidth *= currentScale;
drawHeight *= currentScale;
drawX = centerX - drawWidth / 2;
drawY = centerY - drawHeight / 2;
```

Add a bounded setter and accept options in `setImage`:

```js
function setScale(nextScale = 1) {
  currentScale = Number.isFinite(nextScale) && nextScale > 0 && nextScale <= 1 ? nextScale : 1;
  wrap.style.setProperty("--portrait-source-scale", String(currentScale));
}

function setImage(media, options = {}) {
  if (Object.hasOwn(options, "scale")) setScale(options.scale);
  currentMedia = media;
  // existing load/render path remains
}
```

Wire mobile metadata:

```js
.map((wrap) => createAsciiPortraitRenderer({
  wrap,
  image: wrap.querySelector("img"),
  scale: readPortraitScale(wrap),
}))
```

Wire desktop stage metadata:

```js
const asciiRenderer = createAsciiPortraitRenderer({
  wrap: stage,
  image,
  scale: readPortraitScale(steps[0], "data-stage-portrait-scale"),
});
```

Inside `setStage`, read and pass the incoming scale:

```js
const portraitScale = readPortraitScale(nextStep, "data-stage-portrait-scale");
// after the incoming portrait succeeds
asciiRenderer?.setImage(portrait, { scale: portraitScale });
```

- [ ] **Step 4: Add localized metadata and fallback scaling**

In all three HTML files, add the stage attribute to only the Production Engineer `<li>`:

```html
data-stage-portrait-scale="0.84"
```

Add the mobile attribute to only its `<picture>`:

```html
<picture class="timeline-step-portrait" data-portrait-scale="0.84">
```

In `styles.css`, give both normal-image surfaces the same custom-property transform:

```css
.career-portrait-image,
.timeline-step-portrait img {
  transform: scale(var(--portrait-source-scale, 1));
  transform-origin: center;
}
```

Keep the existing opacity transition and add `transform 180ms ease` to the same transition declaration.

- [ ] **Step 5: Run the focused tests and local review checkpoint**

Run: `npm run test:portrait && npm run validate:site && git diff --check`

Expected: PASS. The recorded source draw area ratio is approximately `0.7056`, all three localized pages remain structurally consistent, and the diff has no whitespace errors.

Run: `git status --short`

Expected: only the approved spec/plan and in-scope HTML/CSS/JS/test files are modified; do not commit.

---

### Task 2: Per-cell edge depth and three-pass embossed rendering

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:48-290`
- Modify: `scripts.js:155-247`
- Modify: `styles.css:532-542`

**Interfaces:**
- Consumes: sampled `columns × rows` RGBA data and `currentScale` from Task 1.
- Produces: cells shaped as `{ alpha, column, depth, edge, glyph, luminance, row }`.
- Produces: `drawGlyphLayer(kind, lightX, lightY)` behavior within `draw()` for `"extrusion"`, `"front"`, and `"highlight"`.

- [ ] **Step 1: Record draw-state snapshots and write the failing embossed-layer test**

Change the fake `fillText` recorder to capture the active draw state:

```js
fillText(glyph, x, y) {
  fillTextCalls.push({
    alpha: context.globalAlpha,
    fillStyle: context.fillStyle,
    glyph,
    x,
    y,
  });
},
```

Add `fillStyle: "#000000"` to the fake context defaults, then add:

```js
test("draws settled glyphs as extrusion, front face, and selective edge highlight", async () => {
  const fixture = await createAsciiFixture();

  fixture.context.initializeAsciiPortraits();
  await Promise.resolve();

  const calls = fixture.desktopWrap.querySelector(".ascii-portrait-canvas").fillTextCalls;
  const styles = new Set(calls.map((call) => call.fillStyle));

  assert.ok(styles.has("#24420f"), "dark extrusion layer must render");
  assert.ok(styles.has("#c8ff36"), "Matrix front glyphs must render");
  assert.ok(styles.has("#efffb8"), "edge highlights must render");
  assert.ok(calls.length > 13_000, "embossed rendering must add real glyph layers");
});
```

- [ ] **Step 2: Run the test and verify the intended red state**

Run: `npm run test:portrait`

Expected: FAIL because the current renderer has no `#24420f` extrusion pass and does not exceed the multi-pass draw threshold.

- [ ] **Step 3: Compute local edge strength and bounded virtual depth**

In `sampleMedia`, first populate two `Float32Array` buffers for alpha and luminance. Use clamped neighbor lookup, then build visible cells in a second pass:

```js
const sampleCount = columns * rows;
const alphas = new Float32Array(sampleCount);
const luminances = new Float32Array(sampleCount);

function sampleAt(values, row, column) {
  const boundedRow = Math.max(0, Math.min(rows - 1, row));
  const boundedColumn = Math.max(0, Math.min(columns - 1, column));
  return values[boundedRow * columns + boundedColumn];
}
```

For each visible sample:

```js
const horizontalEdge = Math.abs(
  sampleAt(luminances, row, column + 1) - sampleAt(luminances, row, column - 1),
);
const verticalEdge = Math.abs(
  sampleAt(luminances, row + 1, column) - sampleAt(luminances, row - 1, column),
);
const edge = Math.min(1, (horizontalEdge + verticalEdge) * 1.8);
const depth = Math.min(1, (1 - luminance) * 0.42 + edge * 0.9);
```

Store `edge` and `depth` on every cell while preserving the existing glyph ramp.

- [ ] **Step 4: Replace the flat loop with crisp back-to-front glyph passes**

Inside `draw()`, retain canvas sizing, text alignment, font, vertical falloff, and elastic displacement. Draw extrusion first:

```js
for (const cell of cells) {
  const position = getCellPosition(cell);
  const distance = 0.45 + cell.depth * 1.55;
  ctx.fillStyle = "#24420f";
  ctx.globalAlpha = Math.min(0.72, cell.alpha * (0.28 + cell.depth * 0.42));
  ctx.fillText(
    cell.glyph,
    position.x + light.x * distance,
    position.y + light.y * distance,
  );
}
```

Draw the existing front glyph at `position.x`, `position.y`, retaining the current luminance-based front palette. Finally draw highlights only when `cell.edge >= 0.12`:

```js
ctx.fillStyle = "#efffb8";
ctx.globalAlpha = Math.min(0.68, cell.alpha * cell.edge * 0.82);
ctx.fillText(
  cell.glyph,
  position.x - light.x * 0.38,
  position.y - light.y * 0.38,
);
```

Factor the repeated coordinate calculation into a local `getCellPosition(cell)` helper so all passes share the exact elastic displacement.

- [ ] **Step 5: Add a restrained whole-canvas shadow and verify green**

In `.ascii-portrait-canvas`, add:

```css
filter: drop-shadow(0 4px 7px rgba(0, 0, 0, 0.24));
```

Do not add blur to the drawing context or duplicate the canvas.

Run: `npm run test:portrait && npm run check:js && git diff --check`

Expected: PASS. The fake context observes all three layer colors and the draw-call threshold, JavaScript syntax is valid, and the diff is clean.

Run: `git status --short`

Expected: only in-scope local files are modified; do not commit.

---

### Task 3: Pointer-driven depth lighting and reduced-motion stability

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs:250-290`
- Modify: `scripts.js:124-330`

**Interfaces:**
- Consumes: `cell.depth`, `cell.edge`, and existing pointer/elastic state.
- Produces: `light = { x, y, targetX, targetY }`, where settled values are bounded to `[-1.2, 1.2]` per axis.
- Produces: pointer updates that change target lighting but never prevent default scrolling.

- [ ] **Step 1: Write the failing pointer-light and reduced-motion layer assertions**

Update the mobile pointer test to isolate the first extrusion call before and after input:

```js
const settledCalls = firstCanvas.fillTextCalls.slice();
const settledExtrusion = settledCalls.find((call) => call.fillStyle === "#24420f");

fixture.inlineWraps[0].dispatch("pointermove", {
  clientX: 210,
  clientY: 70,
  pointerType: "touch",
});
fixture.runAnimationFrame();

const movedCalls = firstCanvas.fillTextCalls.slice(settledCalls.length);
const movedExtrusion = movedCalls.find((call) => call.fillStyle === "#24420f");
assert.notEqual(movedExtrusion.x, settledExtrusion.x);
assert.notEqual(movedExtrusion.y, settledExtrusion.y);
```

Strengthen the reduced-motion test:

```js
const styles = new Set(displayCanvas.fillTextCalls.map((call) => call.fillStyle));
assert.ok(styles.has("#24420f"));
assert.ok(styles.has("#c8ff36"));
assert.ok(styles.has("#efffb8"));
assert.equal(fixture.animationFrames.length, 0);
```

- [ ] **Step 2: Run the tests and verify the intended red state**

Run: `npm run test:portrait`

Expected: FAIL because pointer movement currently changes only elastic column displacement; extrusion direction remains fixed or does not exist.

- [ ] **Step 3: Add bounded light targets and damped return**

Add renderer state:

```js
const defaultLight = { x: 0.72, y: 0.64 };
const light = {
  x: defaultLight.x,
  y: defaultLight.y,
  targetX: defaultLight.x,
  targetY: defaultLight.y,
};
```

In `updatePointer`, after pointer coordinates are clamped:

```js
light.targetX = Math.max(-1.2, Math.min(1.2, ((x / width) - 0.5) * 2.4));
light.targetY = Math.max(-1.2, Math.min(1.2, ((y / height) - 0.5) * 2.4));
```

In `handlePointerLeave`, restore targets:

```js
light.targetX = defaultLight.x;
light.targetY = defaultLight.y;
```

In `animateMotion`, damp current light values and include their delta in the existing energy calculation:

```js
light.x += (light.targetX - light.x) * 0.16;
light.y += (light.targetY - light.y) * 0.16;
energy += Math.abs(light.targetX - light.x) + Math.abs(light.targetY - light.y);
```

Use `light.x` and `light.y` in all three glyph passes. Keep `updatePointer`’s early return under reduced motion so the static default vector never schedules animation.

- [ ] **Step 4: Verify pointer, touch, reduced motion, and fallback behavior**

Run: `npm run test:portrait`

Expected: all scale, multi-pass, pointer, reduced-motion, and Canvas-failure tests PASS with no recurring reduced-motion frame.

Run: `npm run check:js && git diff --check`

Expected: PASS.

Run: `git status --short`

Expected: only approved local changes are present; do not commit.

---

### Task 4: Cache parity, documentation status, and complete automated contract

**Files:**
- Modify: `index.html:33-34`
- Modify: `en/index.html:33-34`
- Modify: `tr/index.html:33-34`
- Modify: `docs/superpowers/specs/2026-08-15-career-ascii-3d-depth-design.md:1-130`
- Verify: `.github/workflows/azure-static-web-apps-red-tree-06630f303.yml`

**Interfaces:**
- Consumes: completed local renderer and metadata from Tasks 1–3.
- Produces: matching `20260815-ascii-depth` CSS/JS cache keys in all localized documents.

- [ ] **Step 1: Update localized cache keys and implementation status**

In all three HTML heads, use:

```html
<link rel="stylesheet" href="/styles.css?v=20260815-ascii-depth">
<script src="/scripts.js?v=20260815-ascii-depth" defer></script>
```

Change the design spec status to `Implemented locally; browser QA pending`, and append this concrete implementation note. Do not change the delivery boundary:

```markdown
## Implementation Note

- Production Engineer metadata: `data-stage-portrait-scale="0.84"` and `data-portrait-scale="0.84"`.
- Depth palette: extrusion `#24420f`, luminance-mapped Matrix front glyphs, and edge highlight `#efffb8`.
- Pointer light vector: clamped to `[-1.2, 1.2]` per axis and damped to default `{ x: 0.72, y: 0.64 }` on leave.
- Automated coverage: scaled source fitting, three glyph passes, pointer light movement, reduced motion, mobile enhancement, and Canvas failure fallback.
```

- [ ] **Step 2: Run the entire local automated contract**

Run: `npm test`

Expected: all deployment, environment, detailed portrait, lifecycle, and site-parity checks PASS.

Run: `npm run test:server`

Expected: all HTTP server-contract tests PASS.

Run: `git diff --check`

Expected: PASS with no whitespace errors.

- [ ] **Step 3: Confirm the local-only delivery boundary**

Run: `git status --short`

Expected: the approved spec, plan, HTML/CSS/JS, and portrait test files are modified or untracked; no generated screenshots, test artifacts, or portrait bitmap changes are present.

Do not run `git add`, `git commit`, `git push`, `gh`, or `az` commands.

---

### Task 5: Desktop and mobile Browser QA

**Files:**
- Verify: `index.html`
- Verify: `scripts.js`
- Verify: `styles.css`
- Verify: `images/career/04-production-engineer.png`
- Do not create committed screenshots or reports.

**Interfaces:**
- Consumes: local preview at `http://127.0.0.1:4173/`.
- Produces: browser evidence for identity, embossed layers, pointer lighting, Matrix transition, Production Engineer scale, mobile `8/8`, and layout invariants.

- [ ] **Step 1: Start the checkout-scoped preview and define the target flow**

Run: `npm run dev`

Expected: `Preview server running at http://127.0.0.1:4173`.

Target flow: `http://127.0.0.1:4173/` loads → AI Engineer renders as crisp embossed ASCII → pointer movement changes depth lighting → scrolling through `08 → 04` uses the Matrix sweep → Production Engineer renders at normalized scale → mobile renders all eight embossed portraits and ends with zero gap.

- [ ] **Step 2: Verify desktop at `1440 × 1000` with the Browser plugin**

Use the Browser runtime and a fresh tab. Confirm:

```text
URL: http://127.0.0.1:4173/
Title: Serdar Gündoğdu — Industrial AI Engineer
ASCII canvas opacity: 1
Source image opacity: 0
Broken images: 0
Horizontal overflow: 0
```

Capture a normal AI Engineer screenshot. Move the pointer through the portrait and prove `is-pointer-active` plus changed depth-light offsets. Scroll through career stages until `data-stage-number="04"` is active, wait for `is-transitioning` to clear, and capture Production Engineer beside an adjacent portrait state for scale comparison.

- [ ] **Step 3: Verify mobile at `390 × 844`**

Reload in a `390 × 844` viewport and scroll through the timeline. Assert:

```text
Portrait wrappers: 8
ASCII canvases: 8
Rendered wrappers after traversal: 8
Opaque canvases: 8
Hidden source images: 8
Head-detail sources: 8
Broken images: 0
Horizontal overflow: 0
Production Engineer data scale: 0.84
```

Exercise one touch/pointer interaction without blocking vertical scrolling. At the page end, assert:

```text
.section-about padding-bottom: 0px
About-to-contact gap: 0px
Last-credential-to-contact gap: 0px
```

Capture one mobile embossed portrait screenshot and the final zero-gap state.

- [ ] **Step 4: Check diagnostics, stop the preview, and leave a clean runtime**

Read Browser console warnings/errors and require no relevant application entries. Reset the temporary viewport and close the QA tab.

Run: `npm run stop`

Expected: `Preview server stopped at http://127.0.0.1:4173`.

Run: `lsof -nP -iTCP:4173 -sTCP:LISTEN`

Expected: exit `1` with no listener output.

Run: `git status --short`

Expected: only the approved local source/spec/plan/test changes remain. Do not commit, push, or deploy.
