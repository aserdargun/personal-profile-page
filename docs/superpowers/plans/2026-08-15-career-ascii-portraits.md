# Career ASCII Portraits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn all eight settled career photos into permanent interactive ASCII portraits on desktop and mobile while preserving semantic image fallbacks and the `08 → 01` career journey.

**Architecture:** Add one reusable Canvas 2D renderer in `scripts.js` that samples a loaded portrait into a glyph grid, renders a static lime ASCII likeness, and applies damped pointer displacement only while interaction is active. The sticky desktop stage owns one renderer whose source changes with the active timeline item; mobile timeline pictures each receive a renderer dynamically. Existing HTML remains the semantic and no-JavaScript fallback, while shared CSS controls enhancement and reduced motion.

**Tech Stack:** Semantic HTML, shared CSS, browser JavaScript, Canvas 2D, Pointer Events, IntersectionObserver, ResizeObserver, Node.js test runner, VM test harness, Browser plugin QA

## Global Constraints

- Render the settled portrait entirely as lime ASCII glyphs wherever JavaScript and Canvas 2D work.
- Preserve exact stage order `08 → 01`, existing localized copy, and all accepted image assets.
- Keep source `<img>` elements and alt text as accessible/failure fallbacks; mark canvases `aria-hidden`.
- Support desktop mouse/pen and mobile touch through passive pointer events without blocking scroll.
- Respect `prefers-reduced-motion: reduce` with a static ASCII rendering and no pointer/sweep animation.
- Add no framework or runtime dependency.
- Do not commit, push, deploy, or leave the preview server running.
- Remove only the mobile About-section bottom padding between the last credential and contact section; preserve every other section's spacing.

---

### Task 1: Define the failing ASCII behavior contract

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs`

**Interfaces:**
- Consumes: `scripts.js`, `styles.css`, and a controlled DOM/Canvas VM harness.
- Produces: behavior tests proving canvas creation, glyph drawing, pointer-driven redraw, mobile inline enhancement, reduced-motion static behavior, and normal-image fallback.

- [ ] **Step 1: Add a VM test named `renders settled career portraits as glyphs`**

Create a realistic portrait element fixture, run the initialization, resolve its image load, flush one animation frame, and assert the real fake canvas context records `fillText` calls from the approved glyph palette while the wrapper gains `is-ascii-rendered`.

- [ ] **Step 2: Add a VM test named `enhances every mobile inline portrait and responds to pointer movement`**

Return two `.timeline-step-portrait` fixtures from `querySelectorAll`, emulate `(max-width: 900px)`, dispatch `pointermove`, and assert both receive canvases and the interacted canvas schedules and performs another glyph draw.

- [ ] **Step 3: Add a VM test named `uses a static fallback path for reduced motion and canvas failure`**

Emulate reduced motion, confirm glyphs draw once without a recurring frame, then emulate `getContext()` returning null and confirm the source photo is not assigned the enhancement class.

- [ ] **Step 4: Run the targeted test and observe RED**

Run: `npm run test:portrait`

Expected: FAIL because `initializeAsciiPortraits()` and the persistent glyph behavior do not exist.

### Task 2: Implement the reusable ASCII portrait renderer

**Files:**
- Modify: `scripts.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: `createAsciiPortraitRenderer({ wrap, image, transition }) -> { setImage(image), drawStatic(), destroy() }` and `initializeAsciiPortraits() -> { setDesktopStage(index), destroy() } | null`.
- Renderer state: sampled RGBA cells, column offsets/velocities, pointer coordinates, visibility flag, reduced-motion flag, and at most one active animation frame.

- [ ] **Step 1: Implement image sampling and static glyph drawing**

Rasterize the decoded source into an offscreen canvas, sample a width-adaptive `columns × rows` grid, skip transparent cells, select glyphs from `" .:-=+*#%@"`, and draw with lime alpha derived from luminance. Use `fillText`, not pixel fragments, for the settled state.

- [ ] **Step 2: Add bounded animation scheduling**

Redraw immediately after image load/resize. Schedule recurring frames only while velocity energy exceeds a small threshold or a transition is active; cancel on invisibility, document hiding, destruction, and stale stage tokens.

- [ ] **Step 3: Restore pointer/touch elasticity**

Use passive `pointerenter`, `pointermove`, `pointerleave`, `pointerdown`, and window `pointerup` listeners. Apply horizontal velocity to nearby columns with distance falloff and damped spring return. Do not call `preventDefault()` or capture touch pointers.

- [ ] **Step 4: Connect the desktop stage**

Replace settled normal-photo rendering in `initializeCareerPortraitTransition()` with the reusable ASCII renderer. Preserve image preloading, alt updates, stale-token cancellation, and the 680-millisecond Matrix sweep; settle on the incoming glyph grid.

- [ ] **Step 5: Enhance mobile inline portraits**

At mobile width, create a decorative canvas and signal layer inside every `.timeline-step-portrait`, bind the existing child image as its source, observe visibility, and leave normal images visible until each renderer successfully draws.

- [ ] **Step 6: Style permanent enhancement and fallbacks**

Show `.ascii-portrait-canvas` above the image; hide only the image pixels inside `.is-ascii-rendered`; add the soft pointer signal; preserve current aspect ratios and borders. In reduced motion, disable signal/transition animation but keep the static canvas visible.

- [ ] **Step 7: Remove the diagnosed mobile bottom gap**

Inside the existing `max-width: 760px` rules, set only `.section-about { padding-bottom: 0; }`. The pre-fix browser measurement is 82 pixels from the last credential bottom to the About section bottom; the post-fix measurement must be zero while `.section-about` retains 82 pixels of top padding.

- [ ] **Step 8: Run targeted tests and observe GREEN**

Run: `npm run check:js && npm run test:portrait && npm run validate:site`

Expected: all targeted checks pass.

### Task 3: Complete repository and rendered QA

**Files:**
- Verify: `scripts.js`, `styles.css`, `tools/validate-portrait-canvas.mjs`, root/EN/TR pages
- Do not create committed screenshots or reports.

**Interfaces:**
- Consumes: completed implementation.
- Produces: automated, desktop, mobile, interaction, accessibility, console, and cleanup evidence.

- [ ] **Step 1: Run the full repository suite**

Run: `npm test && npm run test:server && git diff --check`

Expected: zero failures and no whitespace errors.

- [ ] **Step 2: Start the managed preview**

Run: `npm run dev`

Expected: loopback preview accepts HTTP on the project port.

- [ ] **Step 3: Run desktop Browser QA**

Flow: `/` loads → career portrait displays lime characters → pointer movement deforms and settles the character field → scroll activates stage 07 → Matrix sweep ends on Photo 7 rendered as characters → summary and console remain correct.

- [ ] **Step 4: Run mobile Browser QA**

At 390 × 844: scroll through stages 08 and 07 → each inline portrait is visibly glyph-based → touch/pointer movement changes the nearby glyph field → page still scrolls vertically → no clipping, image error, or horizontal overflow.

At the page bottom, measure the last credential and contact section boundaries. Expected: the About section has `padding-bottom: 0px`, its bottom equals the contact section top, and there is no blank paper-colored band.

- [ ] **Step 5: Run reduced-motion QA**

Emulate reduced motion and verify the portrait is immediately static ASCII with no transition/pointer animation.

- [ ] **Step 6: Stop and inspect**

Run: `npm run stop && git status --short`

Expected: no project listener/control record remains and only intended uncommitted files are listed.
