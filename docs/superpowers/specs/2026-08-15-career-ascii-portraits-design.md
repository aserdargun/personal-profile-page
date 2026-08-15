# Career ASCII Portraits Design

**Date:** 2026-08-15
**Status:** Approved by the user's selection of permanent ASCII portraits
**Scope:** The eight career portraits on root English, `/en/`, and `/tr/`

## Outcome

Render every career photograph as a persistent, recognizable Matrix-green ASCII portrait on desktop and mobile. Keep the existing `08 → 01` stage order, face normalization, transparent source assets, career copy, and layout. Restore the earlier portrait pointer interaction so mouse, pen, and touch movement locally displace the character field without replacing the portrait with ordinary pixels.

## Rendering Model

- Continue loading each normalized 640 × 800 WebP/PNG through its existing semantic `<img>`.
- With JavaScript and Canvas 2D available, visually hide the source pixels and draw the settled portrait entirely from monospace glyphs.
- Sample source alpha and luminance on a fixed character grid. Transparent cells remain empty; darker facial/clothing cells use denser glyphs and highlighted cells use lighter glyphs.
- Use a lime tonal range rather than full photographic color so every visible portrait is unmistakably ASCII.
- Preserve the real `<img>` alternative text. Generated canvases are decorative and `aria-hidden`.
- If JavaScript, image decoding, or Canvas 2D fails, reveal the existing normal photo rather than leaving an empty frame.

## Responsive Architecture

Desktop retains the sticky right-hand career stage and renders only the currently active portrait. Stage changes replace one ASCII portrait with the next and use the existing Matrix sweep language.

At `max-width: 900px`, keep the sticky aside hidden and upgrade each of the eight inline timeline pictures with its own ASCII canvas. Each canvas is sized from its actual rendered bounds, so glyph density remains readable on a 390-pixel phone without horizontal overflow. Off-screen renderers stop scheduling animation work.

## Pointer and Touch Effect

- Pointer movement creates a localized elastic displacement in nearby glyph columns, followed by a damped return to the original portrait.
- Pointer down and drag increase the displacement; release adds a small spring impulse.
- The same pointer-event path supports mouse, pen, and touch. Touch listeners remain passive and do not capture the pointer, prevent scrolling, or create a mobile scroll trap.
- The renderer animates only while a pointer impulse is settling, a Matrix stage transition is active, or the portrait has just become visible. A static settled canvas does not run a permanent animation loop.
- A soft lime radial signal may follow the pointer inside the portrait frame, but must not obscure facial features or text.

## Stage Transition

On desktop, changing the active stage cancels any stale frame, decodes the new source, and uses a 680-millisecond Matrix character sweep between the old and new ASCII sample grids. The final state remains the incoming ASCII portrait. Mobile portraits may reveal once with a short character sweep as they enter the viewport, but they never resolve to a normal photograph.

Rapid scrolling always settles on the latest active stage. A failed incoming image keeps the existing readable portrait and exposes the normal-image fallback for the failed stage.

## Motion, Accessibility, and Performance

- Under `prefers-reduced-motion: reduce`, render a static ASCII portrait immediately and disable sweep, elastic movement, pointer signal animation, and entrance motion.
- Cap device pixel ratio at 2 and adapt character columns to the frame width.
- Do not run timers or animation frames for off-screen mobile canvases.
- Canvas output is decorative; semantic role text and image alt text remain in the DOM.
- No flashing, rapidly alternating full-frame brightness, page-level pointer trail, or interaction that blocks scrolling.

## Implementation Boundaries

- Modify shared `scripts.js` and `styles.css`; do not add a framework or runtime dependency.
- Add canvases dynamically so all three localized HTML files retain their current semantic and no-JavaScript fallback markup.
- Extend `tools/validate-portrait-canvas.mjs` with real VM-based behavior checks for ASCII drawing, mobile inline enhancement, pointer redraw, reduced motion, and failure fallback.
- Extend `tools/validate-site.mjs` only for cross-page structural contracts that it can validate meaningfully.
- Do not modify or regenerate the accepted portrait assets.
- Do not change the career role mapping, reverse order, copy, unrelated page sections, or application map.
- On mobile only, remove the generic 82-pixel section padding that currently appears after the last credential and before the lime contact section. Do not change the About section's top padding or the spacing of other sections.
- Do not commit, push, deploy, or leave the preview server running without separate user authorization.

## Validation Contract

1. The portrait behavior test fails before implementation because no settled ASCII renderer exists, then passes after implementation.
2. Root English, `/en/`, and `/tr/` retain exact `08 → 01` parity and eight source-image mappings.
3. At desktop width, the sticky portrait consists visibly of lime glyphs, updates with the active stage, and responds to pointer movement.
4. At a 390 × 844 mobile viewport, all eight inline portraits are ASCII canvases rather than visible normal photos; at least one touch/pointer interaction changes its canvas state without blocking vertical scrolling.
5. Reduced motion produces stable ASCII portraits with no recurring animation.
6. Browser console has no relevant errors or warnings, no images fail, and there is no horizontal overflow.
7. At mobile width, the last credential's bottom edge meets the contact section without the current 82-pixel blank paper-colored band.
8. The full repository test suite passes, preview is stopped, and Git reports only intended local changes.
