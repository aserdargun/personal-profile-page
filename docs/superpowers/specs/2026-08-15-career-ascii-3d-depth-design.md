# Career ASCII 3D Depth Design

**Date:** 2026-08-15
**Status:** Implemented locally; browser QA pending
**Scope:** Career portraits on `/`, `/en/`, and `/tr/`

## Goal

Make the eight permanent Matrix-green ASCII career portraits more detailed and dimensional without sacrificing facial recognition, mobile clarity, accessibility, or the existing `08 → 01` journey. Bring the Production Engineer portrait into the same perceived head-size range as the other seven portraits.

## Measured Baseline

All current portrait assets are transparent `640 × 800` PNG/WebP pairs. Vision face detection measured the Production Engineer face at approximately `51.5%` of canvas height. Most peer portraits measure approximately `40.8–44.7%`, with a median near `43.4%`. The renderer currently samples a `78–112` column character grid and draws every settled glyph once in a flat lime tonal range.

## Chosen Direction

Use a crisp, multi-pass Canvas 2D treatment called **Embossed Matrix**. Derive a small virtual depth value for every sampled glyph, then draw a dark extrusion, a lime front face, and a selective pale edge highlight. Keep the existing Matrix stage sweep and elastic pointer behavior, but let pointer position subtly change the depth-light direction.

CSS-only duplicated canvases are rejected because they give every glyph the same depth and blur facial features. WebGL is rejected because its runtime, fallback, and maintenance cost are disproportionate to these small portrait surfaces.

## Production Engineer Scale Normalization

- Apply a Production Engineer–specific visual scale of `0.84` around the portrait center.
- Preserve the existing source pixels, identity, alpha channel, `640 × 800` assets, and semantic alternative text.
- Do not generate or retouch the face.
- Apply the same scale to desktop sticky rendering, mobile inline rendering, the Matrix transition source, and the normal-image fallback.
- Represent the scale as explicit career-stage metadata rather than inferring it from filenames inside the renderer.
- Default all stages without scale metadata to `1`.

The expected visual result is a Production Engineer face height near `43–44%` of the portrait canvas while its center and top alignment remain consistent with the cohort.

## Per-Glyph Depth Model

The source sampling pass continues to collect alpha and Rec. 709 luminance. It additionally computes local contrast from neighboring samples. Each cell receives:

- `luminance`: source brightness in the `0–1` range;
- `edge`: local luminance-gradient strength in the `0–1` range;
- `depth`: a bounded combination of shadow density and local edge strength;
- `glyph`: the existing density-ramp character;
- `alpha`, `row`, and `column`.

The depth calculation must keep broad skin tones relatively shallow while making eyes, brows, nose edges, lips, beard, hair, and the outer facial contour more pronounced. Depth remains bounded so no layer offset exceeds `2 CSS px` in the settled state.

## Rendering Layers

Draw cells back-to-front in three visual passes:

1. **Extrusion and contact shadow** — dark olive green at a positive light-vector offset, with opacity and distance derived from cell depth.
2. **Front glyph** — the current Matrix lime tonal mapping at the normal cell position plus existing elastic column displacement.
3. **Edge highlight** — pale yellow-green at a small negative light-vector offset, drawn only for cells whose edge strength clears the highlight threshold.

Keep glyph edges crisp. Do not use a large canvas blur, full-frame duplicated canvas, RGB split, or continuous glowing haze. A restrained canvas shadow may support the front glyph, but it must not erase character shapes.

## Interaction

- Retain the existing localized elastic column displacement.
- While pointer input is active, map the pointer’s position relative to portrait center to a light vector bounded to approximately `±1.2 CSS px` per axis.
- Use the pointer-derived vector for extrusion and highlight direction; do not move the portrait container.
- On pointer leave, damp the light vector back to the default fixed diagonal together with the existing elastic return.
- Mouse, pen, and touch input use the same pointer-event path and must not prevent vertical page scrolling.
- No page-level pointer trail is introduced.

## Motion and Transition

- Preserve the existing `680 ms` Matrix character sweep between desktop stages.
- The transition settles directly on the incoming embossed ASCII portrait, never on ordinary photo pixels.
- Rapid scrolling continues to cancel stale stage work and settle on the latest active step.
- Do not add a permanent animation loop. Schedule frames only while a pointer/light impulse is settling, a Matrix transition is active, a portrait becomes visible, or its size/source changes.
- Under `prefers-reduced-motion: reduce`, render a static three-layer embossed portrait with a fixed diagonal light vector and disable pointer, sweep, and elastic motion.

## Responsive and Performance Requirements

- Keep the existing `78–112` column sampling range and `2.75 CSS px` target cell width.
- Desktop renders only the active sticky portrait.
- Mobile creates one renderer for each inline portrait, but off-screen renderers stop scheduling animation frames.
- The multi-pass renderer may increase individual `fillText` calls, but it must not create another full-size DOM canvas per depth layer.
- Keep device-pixel-ratio clamped to `2`.
- Preserve zero horizontal overflow at `390 × 844` and the existing zero-gap transition from the final credential to the contact section.

## Fallback and Accessibility

- Generated canvases remain decorative and `aria-hidden="true"`.
- Preserve real `<img>` elements and alternative text.
- Hide source pixels only after all three ASCII layers draw successfully.
- If image decode, source sampling, Canvas 2D, or layer rendering fails, reveal the scaled normal portrait fallback.
- Reduced motion keeps the static embossed ASCII result rather than reverting to a normal photograph.

## Testing Strategy

Extend the VM-based portrait contract before production code changes:

1. A failing Production Engineer fixture proves stage metadata applies a `0.84` source scale while ordinary stages remain at `1`.
2. A failing embossed-render test proves settled glyphs produce extrusion, front-face, and edge-highlight draw passes with distinct offsets and colors.
3. A pointer test proves movement changes the light-vector offsets and schedules a bounded redraw without removing the existing elastic response.
4. A reduced-motion test proves the three static passes render without a recurring animation frame.
5. Existing mobile `8/8`, image fallback, stage-change, and site-parity tests continue to pass.

Run the complete local contract:

- `npm run test:portrait`
- `npm test`
- `npm run test:server`
- `git diff --check`

## Browser QA Contract

The target flow is: `/` loads → AI Engineer appears as crisp embossed ASCII → pointer movement changes local depth lighting → scroll activates the next career stage through the existing Matrix sweep → Production Engineer appears at the normalized head scale → mobile renders all eight embossed portraits with no overflow or bottom gap.

Validate with the in-app Browser plugin at:

- desktop `1440 × 1000`;
- mobile `390 × 844`.

Collect page identity, meaningful DOM snapshot, framework-overlay absence, console health, screenshots, pointer interaction evidence, stage-source evidence, `8/8` mobile canvas/source-state counts, broken-image count, horizontal overflow, and final credential/contact gap.

## Acceptance Criteria

1. Production Engineer no longer appears larger than the neighboring career portraits and renders with scale metadata `0.84` on desktop and mobile.
2. All eight settled portraits visibly contain crisp extrusion, lime front glyphs, and selective edge highlights.
3. Facial features remain more readable than the current flat renderer at both target viewports.
4. Pointer movement changes the local 3D light direction and preserves the elastic glyph response.
5. Reduced motion produces a stable embossed portrait with no recurring animation.
6. Matrix transitions, `08 → 01` ordering, multilingual parity, normal-image fallback, mobile scrolling, zero horizontal overflow, and zero bottom gap remain intact.
7. All automated tests and local browser checks pass.

## Delivery Boundary

This change is implemented and validated locally only. Do not commit, push, run GitHub Actions, or deploy to Azure unless the user gives a separate explicit publication instruction.

## Implementation Note

- Production Engineer metadata: `data-stage-portrait-scale="0.84"` and `data-portrait-scale="0.84"`.
- Depth palette: extrusion `#24420f`, luminance-mapped Matrix front glyphs, and edge highlight `#efffb8`.
- Pointer light vector: clamped to `[-1.2, 1.2]` per axis and damped to default `{ x: 0.72, y: 0.64 }` on leave.
- Automated coverage: scaled source fitting, three glyph passes, pointer light movement, reduced motion, mobile enhancement, and Canvas failure fallback.

## Superseding Visual Scope

The physical-to-digital portrait design supersedes the settled visual renderer for stages `01–05`. The three-pass embossed ASCII specification remains authoritative for stages `06–08`, and all scale, fallback, motion, transition, and responsive contracts remain in force.
