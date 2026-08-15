# Career Photo Timeline Design

**Date:** 2026-08-15
**Status:** Approved and implemented
**Scope:** Root English, `/en/`, and `/tr/` career journey surfaces

## Outcome

Replace the current nine-stage career timeline and single ASCII portrait with an eight-stage, reverse-chronological career journey. The experience starts at the current role, AI Engineer, and moves backward to Mechanical Engineering. Every stage uses the matching user-supplied photograph, while Matrix-inspired ASCII characters appear only during transitions between otherwise normal photographs.

## Career Data and Display Order

The underlying career progression and photo mapping remain chronological:

| Stage | Role | Photograph |
| --- | --- | --- |
| 01 | Mechanical Engineering | Photo 1 |
| 02 | Industrial Engineering | Photo 2 |
| 03 | M.Sc. Materials and Manufacturing | Photo 3 |
| 04 | Production Engineer | Photo 4 |
| 05 | Production Manager | Photo 5 |
| 06 | Data Scientist | Photo 6 |
| 07 | Full-Stack AI Engineer | Photo 7 |
| 08 | AI Engineer | Photo 8 |

The rendered timeline reverses that progression and displays `08 → 01`. The first visible and initially active stage is AI Engineer with Photo 8; the last stage is Mechanical Engineering with Photo 1.

## Portrait Asset Treatment

Create one optimized portrait asset per career stage from the supplied photographs.

- Remove the photographic background and export with transparency.
- Preserve the person’s identity, facial proportions, hair, expression, and age in each source image.
- Do not convert the photographs themselves into ASCII art.
- Normalize the visual face size, eye line, and head-and-shoulders crop across the eight portraits.
- Preserve natural source detail. Do not invent sharp facial detail for small source files.
- Place all portraits on the same dark site-controlled stage so the eight source images feel like one visual sequence.
- Use stable, descriptive filenames under `images/career/` and provide intrinsic dimensions in the HTML.
- Prepare each normalized portrait on a transparent 640 × 800 canvas, then provide an alpha-enabled WebP plus a transparent PNG fallback without overwriting the supplied originals.

## Desktop Interaction

Retain the current two-column journey structure: narrative timeline on the left, sticky portrait stage on the right.

As an intersection observer changes the active timeline step, the portrait stage updates:

1. The outgoing normal portrait breaks into short vertical fragments.
2. A temporary field of green monospace characters such as `0`, `1`, `/`, `\\`, `|`, `<`, `>`, `{`, `}`, `#`, `+`, and `*` crosses the portrait stage.
3. The incoming normal portrait resolves beneath the characters.

The full desktop transition lasts 680 milliseconds. The effect runs once per active-stage change and does not become a continuously moving decorative background. Rapid scrolling cancels or supersedes the previous transition so the stage always settles on the current timeline item.

The portrait summary updates in the same state change and displays the stage number, role, and concise focus text. The progress line descends from stage 08 toward stage 01.

## Mobile Interaction

On narrow viewports, the portrait stage is not viewport-sticky. It becomes a compact career visual near the active narrative content so it does not consume most of the screen or create a scroll trap. The same transition language is retained with fewer character columns and a 420-millisecond duration.

All eight stages remain readable without JavaScript. If JavaScript is unavailable, each timeline item still contains its role, description, skills, and corresponding normal photograph.

## Motion and Accessibility

- Mark the transition canvas and decorative characters as hidden from assistive technology.
- Keep the semantic career sequence in the ordered list and make its accessible label explicitly describe the reverse chronology.
- Use `Portrait associated with the [role] career stage` in English and `Kariyerin [rol] aşamasına ait portre` in Turkish as the localized alternative-text pattern.
- Respect `prefers-reduced-motion: reduce`: disable fragment and character animation and use an immediate or minimal cross-fade state change.
- Do not use flashing, high-frequency flicker, or a continuously moving character field.
- Keep text contrast, keyboard behavior, and existing anchor navigation intact.
- The transition is progressive enhancement; content and images remain present when canvas or `IntersectionObserver` is unavailable.

## Copy and Identity Changes

Remove AI Practitioner as a personal role and as a standalone career stage. Rewrite every personal-title occurrence in the following surfaces to identify the current role as AI Engineer:

- Document title and search/social metadata
- Hero status and introduction
- Person JSON-LD `jobTitle` and description
- Career summary, direction copy, and stage data
- Footer identity line
- Root English, `/en/`, and `/tr/` variants

Keep `AWS Certified AI Practitioner` unchanged because it is the official name of a credential, not the current personal title. Preserve other historical role descriptions unless they conflict with the new eight-stage sequence.

## Implementation Boundaries

- Update `index.html`, `en/index.html`, and `tr/index.html` consistently.
- Update the shared `styles.css` and `scripts.js` rather than adding a framework or runtime dependency.
- Remove the existing single portrait-stage assumptions from the career interaction without disturbing unrelated hero, application-map, approach, about, credential, or contact sections.
- Update `tools/validate-site.mjs` and relevant tests to enforce the eight exact keys, `08 → 01` order, image mappings, localized parity, AI Engineer identity, and absence of the standalone AI Practitioner stage.
- Do not remove the AWS credential because its name contains AI Practitioner.
- Do not commit, push, deploy, or leave the local preview server running.

## Validation Contract

The implementation is complete only when all of the following pass:

1. Static validation confirms eight stages in exact `08 → 01` order across root, English, and Turkish pages.
2. Every stage maps to its intended image, with Photo 8 on AI Engineer and Photo 1 on Mechanical Engineering.
3. Personal-title occurrences of AI Practitioner are gone while the official AWS credential remains.
4. JavaScript syntax and the repository test suite pass.
5. Desktop browser QA verifies page identity, meaningful rendering, active-step updates, normal-photo display, ASCII-only transition overlays, and clean console output.
6. Mobile browser QA verifies readable crops, non-sticky behavior, no overlap or clipping, and the lighter transition.
7. Reduced-motion QA verifies that the ASCII/fragment animation does not run.
8. The preview server is stopped and the final Git status clearly reports only intended local changes.

## Error and Fallback Behavior

- If a portrait asset fails to load, keep the career text visible and show a neutral stage rather than a broken-image icon.
- If canvas initialization fails, switch portraits with a normal image state change.
- If a visitor scrolls faster than the animation duration, cancel the stale animation and render the latest active stage.
- If background removal produces an identity-changing or visibly artificial result, reject that asset and use a conservative crop of the original rather than shipping the altered image.
