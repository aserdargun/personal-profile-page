# Physical-to-Digital Career Portraits Design

**Date:** 2026-08-15
**Status:** Implemented and browser-QA validated locally
**Delivery boundary:** Local only. Do not commit, push, trigger GitHub Actions, or deploy to Azure without a separate explicit publication instruction.

## Goal

Make the career portraits themselves explain the journey from physical engineering to digital intelligence.

- Stages `01` through `05` represent the physical and operational world as progressively finer green analog pixels.
- Stages `06` through `08` retain the existing detailed, embossed Matrix ASCII renderer.
- Every portrait receives one short transformation caption beneath it so the visual progression is understandable without explanation elsewhere on the page.

The result must feel like one continuous career transformation, not two unrelated portrait styles.

## Relationship to the Existing Portrait Design

This design extends and partially supersedes `2026-08-15-career-ascii-3d-depth-design.md`.

The following existing behavior remains unchanged:

- `08 → 01` timeline order.
- The existing single-Canvas architecture.
- The detailed, three-pass embossed ASCII renderer for stages `06`, `07`, and `08`.
- Pointer/touch lighting for the digital stages.
- The `680 ms` desktop Matrix transition.
- Off-screen animation suspension.
- Reduced-motion behavior with no recurring animation loop.
- Semantic `<img>` elements and normal-image fallback.
- Mobile vertical scrolling, zero horizontal overflow, and zero final about/contact gap.
- Production Engineer head-size normalization.

The following behavior changes:

- Stages `01` through `05` no longer draw ASCII characters.
- Those five stages use square green pixel blocks with a progressively finer sampling grid.
- Their pointer treatment becomes shallow phosphor movement rather than embossed ASCII extrusion.
- All eight portraits receive localized transformation captions.

## Source-Image Policy

The existing stage `01–05` portrait assets are already background-free, shoulder-free head silhouettes. They must be reused directly.

- Do not regenerate, retouch, redraw, or replace the faces.
- Preserve the existing PNG/WebP pixels, alpha channels, dimensions, identity, and alternative text.
- Do not create a second set of stylized portrait assets.
- Perform the analog-pixel transformation at runtime in Canvas.
- Keep the existing `0.84` Production Engineer normalization throughout this implementation. Any later scale change requires a separate user-approved visual adjustment.

## Visual Progression

Stages `01–05` use the `pixel-analog` mode. Stages `06–08` use the existing `ascii-depth` mode.

| Stage | Role | Mode | Nominal square cell | Green levels | Narrative function |
| --- | --- | --- | ---: | ---: | --- |
| `01` | Mechanical Engineering | `pixel-analog` | `14 CSS px` | `2` | Raw matter, mechanics, and physical foundations |
| `02` | Industrial Engineering | `pixel-analog` | `11 CSS px` | `3` | People, processes, and systems begin to connect |
| `03` | M.Sc. Materials and Manufacturing | `pixel-analog` | `8 CSS px` | `4` | Physical materials become structured evidence |
| `04` | Production Engineer | `pixel-analog` | `6 CSS px` | `4` | Production becomes measurable and repeatable |
| `05` | Production Manager | `pixel-analog` | `4 CSS px` | `5` | Operations reach the analog-to-digital threshold |
| `06` | Data Scientist | `ascii-depth` | Existing approximately `2.75 CSS px` | Existing palette | Data becomes models; the digital world begins |
| `07` | Full-Stack AI Engineer | `ascii-depth` | Existing | Existing palette | Models become complete software products |
| `08` | AI Engineer | `ascii-depth` | Existing | Existing palette | Intelligence becomes a working engineered system |

Cell sizes are nominal desktop targets at the existing `290 CSS px` portrait width. At narrower widths, compute `nominalCellSize × (portraitWidth / 290)` and clamp the result to `[3, nominalCellSize] CSS px`. This preserves the strict coarse-to-fine order `01 > 02 > 03 > 04 > 05`.

## Analog Pixel Renderer

### Sampling

The renderer continues to fit the transparent source head inside the existing portrait frame. In `pixel-analog` mode it samples the fitted source into square cells instead of the existing ASCII column/row grid.

Each visible sample produces a pixel cell containing:

- normalized alpha;
- luminance;
- palette level;
- row and column;
- pointer displacement weight.

Transparent samples are skipped. No character ramp or `fillText()` call is used for stages `01–05`.

### Drawing

Each visible cell is drawn as a sharp, axis-aligned square with `fillRect()`.

- Disable image smoothing for the pixel surface.
- Do not round cell corners.
- Do not use the dark 3D glyph extrusion pass.
- Use the ordered phosphor palette `#24420f`, `#4f7618`, `#82bd1d`, `#c8ff36`, `#efffb8`. Stage `01` uses `#4f7618` and `#c8ff36`; stage `02` adds `#82bd1d`; stages `03–04` use the first four ordered colors; stage `05` uses all five.
- Increase available luminance levels from stage `01` to `05` as specified in the progression table.
- Add a subtle Canvas-level glow, bounded so adjacent cells remain visually distinct.
- Add faint horizontal CRT scan lines through CSS or one non-animated Canvas overlay; never add a second display canvas.

The source photograph must remain hidden only after the pixel portrait draws successfully.

## Digital ASCII Renderer

Stages `06–08` continue using the approved existing renderer without visual regression:

- approximately `2.75 CSS px` cells;
- `78–112` columns;
- one dark extrusion pass;
- one luminance-mapped Matrix front pass;
- one selective pale edge-highlight pass;
- bounded pointer light;
- crisp glyphs and the current whole-canvas shadow.

No analog square cells may appear in these three stages.

## Pointer and Motion Behavior

### Physical stages (`01–05`)

Pointer/touch input retains interactivity but uses a physical-display response:

- a phosphor-brightness increase within a radius of `max(36 CSS px, cellSize × 5)` around the pointer;
- positional displacement capped at `0.6 CSS px` per axis and snapped to backing-store pixels so square edges stay crisp;
- no ASCII glyph deformation;
- no 3D extrusion or edge-highlight pass;
- passive handlers that never prevent vertical scrolling.

### Digital stages (`06–08`)

The current damped pointer-light and elastic ASCII displacement remain unchanged.

### Reduced motion

Under `prefers-reduced-motion: reduce`:

- analog portraits draw one static pixel frame;
- digital portraits draw one static three-layer ASCII frame;
- pointer input does not schedule animation;
- no recurring `requestAnimationFrame` remains queued.

## Transition Between Worlds

The existing Matrix sweep remains the transition mechanism for every desktop stage change.

The `05 → 06` boundary is the conceptual pivot:

- stage `05` settles as the finest analog pixel mosaic;
- the existing Matrix sweep runs for `680 ms`;
- stage `06` settles as detailed embossed ASCII.

No additional transition canvas, WebGL effect, asset cross-fade system, or long-running animation is required. The difference between the two settled render modes provides the transformation story.

## Portrait Captions

Each portrait has one compact transformation caption directly beneath the portrait and before the role heading on mobile. On desktop the caption appears inside the existing portrait information card below the Canvas.

The caption consists of:

1. a small world label;
2. one short transformation statement.

| Stage | World label (TR / EN) | Turkish caption | English caption |
| --- | --- | --- | --- |
| `01` | `FİZİKSEL DÜNYA` / `PHYSICAL WORLD` | `Madde ve mekanik` | `Matter and mechanics` |
| `02` | `FİZİKSEL DÜNYA` / `PHYSICAL WORLD` | `Sistemler ve akış` | `Systems and flow` |
| `03` | `FİZİKSEL DÜNYA` / `PHYSICAL WORLD` | `Malzemeden kanıta` | `From materials to evidence` |
| `04` | `FİZİKSEL DÜNYA` / `PHYSICAL WORLD` | `Üretimi ölçülebilir kılmak` | `Making production measurable` |
| `05` | `FİZİKSEL DÜNYA` / `PHYSICAL WORLD` | `Operasyondan veriye` | `From operations to data` |
| `06` | `DİJİTAL DÜNYA` / `DIGITAL WORLD` | `Veriden modellere` | `From data to models` |
| `07` | `DİJİTAL DÜNYA` / `DIGITAL WORLD` | `Modellerden ürünlere` | `From models to products` |
| `08` | `DİJİTAL DÜNYA` / `DIGITAL WORLD` | `Zekâyı çalışan sistemlere dönüştürmek` | `Turning intelligence into working systems` |

Caption presentation:

- small monospace type;
- physical-stage world labels use `#82bd1d`; digital-stage world labels use `#c8ff36`; caption text uses the existing muted portrait-card text color;
- a square-pixel marker for physical stages;
- an ASCII-cursor marker for digital stages;
- a single line above `480 CSS px` viewport width and at most two short lines at or below `480 CSS px`;
- subordinate to the role heading and not styled as another paragraph.

The root and English pages use the English copy. The Turkish page uses the Turkish copy.

## Metadata and Data Flow

Portrait behavior is explicit metadata, not inferred from filenames.

Each timeline stage provides:

- portrait render mode;
- analog cell size when applicable;
- analog palette-level count when applicable;
- world label;
- transformation caption;
- existing portrait scale metadata where applicable.

Desktop stage changes pass the active stage's complete portrait presentation data into the existing renderer. Mobile inline renderers read the same data from their containing timeline stage. The renderer switches mode without replacing the semantic image element or adding another display canvas.

## Fallback and Failure Behavior

If Canvas is unavailable or sampling/drawing fails:

- keep the semantic source image visible;
- preserve the stage's normalized scale;
- apply `grayscale(1) sepia(1) saturate(5) hue-rotate(36deg) brightness(0.78)` to physical-stage fallback images;
- do not expose broken or partially drawn Canvas content;
- leave captions visible because they are semantic HTML, not Canvas content.

A failure in one portrait must not prevent other timeline portraits from enhancing.

## Accessibility

- Preserve every existing image `alt` value.
- Keep captions as visible HTML text.
- Do not put narrative text inside Canvas.
- Keep pointer listeners passive and keyboard-independent.
- Do not rely on color alone: physical/digital world labels and different pixel/glyph shapes carry the distinction.
- Maintain current reduced-motion behavior.

## Responsive Behavior

At `390 × 844`:

- all eight portrait wrappers and Canvas elements must render after traversal;
- stages `01–05` must visibly preserve their coarse-to-fine square-pixel ordering;
- stages `06–08` must retain detailed embossed ASCII;
- captions must not cause horizontal overflow;
- portrait cells must remain sharp at device-pixel-ratio up to the existing cap;
- vertical portrait interaction must not block page scrolling;
- the final credential/contact boundary must remain at `0 px` gap.

## Automated Validation

Extend the portrait VM fixture so Canvas records both `fillRect()` pixel blocks and `fillText()` ASCII glyph calls.

Required automated contracts:

1. Stages `01–05` select `pixel-analog` and produce square `fillRect()` cells without portrait `fillText()` calls.
2. Their effective cell sizes are strictly ordered from coarsest `01` to finest `05`.
3. Palette-level counts follow `2, 3, 4, 4, 5`.
4. Stages `06–08` select `ascii-depth` and preserve extrusion, front, and highlight glyph calls.
5. Stage `04` retains normalized head scale, and an unannotated stage resets scale to `1`.
6. Analog pointer input changes phosphor rendering without blocking scrolling.
7. Digital pointer input continues changing extrusion/light coordinates.
8. Reduced motion draws both modes statically with zero recurring frames.
9. Canvas failure keeps normal images visible in both modes.
10. All localized pages contain matching mode/cell/palette/caption metadata.

## Browser QA

### Desktop: `1440 × 1000`

- Capture stage `01`, stage `05`, and stage `06` after settling.
- Confirm `01` is clearly coarser than `05`.
- Confirm `05` is still square-pixel analog and `06` is detailed embossed ASCII.
- Traverse `05 → 06` and confirm the existing Matrix transition activates and clears.
- Confirm the five physical heads are centered, uncropped, and visually balanced.
- Exercise pointer behavior in one analog and one digital stage.
- Confirm captions and world labels match the active stage.

### Mobile: `390 × 844`

- Traverse all eight stages until all eight Canvas portraits are rendered.
- Confirm no horizontal overflow.
- Confirm analog square cells remain visually distinct.
- Confirm digital ASCII remains legible.
- Confirm portrait-originated vertical scrolling works.
- Confirm captions remain compact and readable.
- Confirm the final about/contact and credential/contact gaps remain `0 px`.

### Diagnostics and cleanup

- Require no relevant console warning or error.
- Stop the checkout-scoped preview.
- Confirm no listener remains on port `4173`.
- Keep screenshots outside the repository.

## Non-Goals

- No face regeneration or image-generation edits.
- No source-asset replacement.
- No WebGL or shader pipeline.
- No second portrait canvas.
- No video or sprite-sheet transition.
- No permanent animation loop.
- No change to career order, role content, application map, navigation, or contact layout.
- No publication action under this design task.

## Acceptance Criteria

The design is complete when a viewer can understand the career transformation from the portraits alone:

- `01` begins as a visibly coarse physical-world pixel head.
- resolution and tonal detail increase steadily through `05`;
- `05 → 06` is an unmistakable transition from square pixels to embossed ASCII;
- `06–08` retain the approved digital portrait appearance;
- all eight captions narrate the same progression in the active language;
- face identity, head-only silhouettes, scaling, fallbacks, accessibility, motion preferences, and mobile layout remain intact;
- automated tests and desktop/mobile Browser QA pass;
- the preview is stopped and no commit, push, GitHub Actions run, or Azure deployment occurs.

## Implementation Note

- Physical stages `01–05`: square `fillRect()` phosphor cells at nominal `14, 11, 8, 6, 4 CSS px`.
- Digital stages `06–08`: preserved three-pass embossed ASCII.
- Runtime assets: unchanged transparent `640 × 800` PNG/WebP heads; no regenerated images.
- Narrative: localized physical/digital world labels and eight semantic transformation captions.
- Automated coverage: mode routing, progressive cell sizes, palette limits, pointer response, reduced motion, scale reset, fallback, and localized parity.

## QA Note — 2026-08-15

- Desktop `1440 × 1000`: verified stages `01`, `05`, and the `05 → 06` physical-to-digital boundary; stage `01` settled at `14 px / 2` levels, stage `05` at `4 px / 5` levels, stage `04` retained `0.84` scale, and stages `06–08` selected `ascii-depth`.
- Desktop pointer traversal activated the analog portrait interaction and the transition settled back to a fully opaque rendered Canvas.
- Mobile `390 × 844`: all `8/8` portrait Canvases rendered; physical effective cell sizes remained strictly progressive, digital stages remained in `ascii-depth`, stage `04` retained `0.84` scale, and no broken portrait images were found.
- English and Turkish transformation captions and the five public repository links were present; Stackfolio and numbered `six/altı` copy were absent from the application map.
- Horizontal overflow, final footer gap, and relevant console warnings/errors were all `0`; the checkout-scoped preview was stopped and port `4173` had no remaining listener.
