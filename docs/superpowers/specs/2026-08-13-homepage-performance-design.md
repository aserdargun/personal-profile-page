# Homepage Performance Design

Date: 2026-08-13
Status: Approved by the user

## Context

The production site is a dependency-free bilingual static site hosted on Azure Static Web Apps. Live Chrome and Lighthouse 13.4.1 checks found that both custom domains work, the rendered page has no console errors, and the site already scores 99-100 for performance. The largest remaining opening delay is the root document's client-side language selection: `/` returns a small HTML document, reads `localStorage` and `navigator.language`, and then performs a second navigation to `/en/` or `/tr/`. Lighthouse attributed about 760 ms of simulated mobile delay to that navigation.

All HTML, CSS, JavaScript, images, and icons currently use a 30-second cache lifetime. Lighthouse also reports an accessibility score of 96 because muted text does not always meet contrast thresholds and three links have visible-label/accessibility-name mismatches.

## Goal

Improve initial and repeat-visit opening performance without adding a build framework or changing the site's visual direction:

1. Remove the root page's client-side redirect and its second navigation.
2. Serve the English homepage immediately at `/`, while retaining `/en/` and `/tr/` as explicit language routes.
3. Give static assets useful cache lifetimes without risking indefinitely stale same-name files.
4. Add a smaller AVIF portrait source while retaining WebP and PNG fallbacks.
5. Defer interactive portrait setup until the browser is idle, with a bounded fallback delay.
6. Resolve the Lighthouse contrast and accessible-name findings.
7. Preserve the root-deployment contract, bilingual parity, responsive layout, and no-build Azure workflow.

## Selected Approach

### Root request

Add an Azure Static Web Apps route rule that rewrites `/` to `/en/index.html`. A rewrite returns the English document without changing the visible address and without a second browser navigation. The existing root language-selector document remains in the repository as a direct-file fallback, but production `/` requests no longer execute its language redirect.

The English document keeps its `/en/` canonical URL and the existing `hreflang` set. The root remains the `x-default` entry point. Explicit `TR` and `EN` controls continue to navigate to the localized routes and store the user's choice, but visiting `/` always renders the default English page immediately. Conditional edge language detection is deliberately excluded because Azure Static Web Apps route rules cannot inspect browser `localStorage`, and adding a Function or proxy would add disproportionate complexity and latency.

### Cache policy

Keep HTML on Azure's short default cache policy. Add route-specific response headers:

- `/styles.css` and `/scripts.js`: `public, max-age=86400`
- `/images/*` and `/icons/*`: `public, max-age=604800`

The assets retain stable filenames in this change, so they do not receive a one-year `immutable` policy. Content-hashed filenames are a separate future optimization.

### Portrait delivery

Create 480 px and 720 px AVIF variants from the existing lossless portrait source. Insert AVIF `<source>` elements before the existing WebP source in both localized pages. Keep the current WebP `srcset`, PNG fallback, explicit dimensions, and `fetchpriority="high"` behavior.

The AVIF variants must be visually inspected and must be smaller than their corresponding WebP variants. If either condition fails, that AVIF variant is not shipped.

### Portrait initialization

Keep the existing interaction implementation. Change only its startup scheduling:

- Language switching and timeline behavior initialize on `DOMContentLoaded` as before.
- Portrait initialization runs through `requestIdleCallback` with an 800 ms timeout when supported.
- Browsers without `requestIdleCallback` use a 300 ms `setTimeout` fallback.
- The portrait's current `IntersectionObserver`, page-visibility pause, responsive canvas, and reduced-motion behavior remain intact.

### Accessibility

Adjust only the selectors identified by Lighthouse:

- Increase inactive timeline heading and paragraph contrast on the dark background.
- Increase section-kicker, lab-card metadata, and credentials metadata contrast on light backgrounds.
- Make the wordmark, language-switch, and Stackfolio accessibility names contain their visible labels, or remove redundant labels when visible text already provides the correct name.

The changes must preserve the intentional visual hierarchy; inactive items may remain visually muted but must meet the relevant WCAG contrast threshold.

## Alternatives Considered

### Server redirect from `/` to `/en/`

Lower risk than client-side language selection and preserves the final `/en/` URL, but still requires a second HTTP request. Rejected because a rewrite removes the extra navigation entirely.

### Retain automatic browser-language selection

Preserves the current convenience for Turkish browsers, but necessarily keeps the measured second navigation unless a new edge/function layer is introduced. Rejected because the user approved prioritizing opening speed and the site already provides an explicit language switch.

### Add Azure Functions or Front Door language logic

Could inspect request headers, but adds operational complexity, possible cold-start or routing latency, and another system to maintain. Rejected as unnecessary for a static portfolio.

### Fingerprint every static asset now

Would allow one-year immutable caching, but introduces a build or manual versioning workflow and broadens the change. Rejected for this iteration; moderate safe cache lifetimes provide most repeat-visit benefit without changing the no-build architecture.

## Testing Strategy

Follow test-driven development for every changed behavior.

1. Extend deployment validation so it requires the root rewrite and route-specific cache headers.
2. Extend site validation so both locales require AVIF sources and the generated files exist within size budgets.
3. Extend the portrait VM test so it proves initialization is deferred and then starts through the idle callback; add fallback coverage for browsers without that API.
4. Add static assertions for the accessibility-name changes and contrast tokens/selectors.
5. Run each new test before implementation and confirm it fails for the intended missing behavior.
6. Apply the smallest production changes that make the tests pass.
7. Run the complete `npm test` gate.
8. Serve the site locally through `tools/serve.mjs` and verify `/`, `/en/`, `/tr/`, shared assets, and route behavior.
9. Use the Browser plugin for desktop and mobile rendered QA: identity, meaningful DOM, no framework overlay, clean console, screenshot, language interaction, image loading, and horizontal overflow.
10. Run fresh Lighthouse mobile and desktop audits and compare the root-navigation warning, performance, LCP, TBT, CLS, accessibility, best-practices, and SEO scores with the recorded baseline.

## Success Criteria

- `/` renders meaningful English homepage content without executing `window.location.replace`.
- Local route emulation and production configuration both represent the root rewrite correctly.
- `/tr/` and `/en/` remain directly accessible and language switching works.
- CSS/JS receive a one-day cache policy; images/icons receive a seven-day cache policy.
- AVIF portrait variants are present, smaller than WebP, selected by supporting browsers, and visually acceptable.
- Portrait interaction is scheduled through idle/fallback startup without breaking the canvas effect.
- Lighthouse no longer reports the root client-side redirect opportunity.
- Accessibility audits no longer report the known contrast or label-content-name findings.
- Mobile has no horizontal overflow and console logs remain clean.
- `npm test` passes completely.

## Error Handling and Rollback

- If AVIF generation is unavailable or produces inferior artifacts, retain the existing WebP/PNG chain and report the skipped sub-change rather than shipping poor imagery.
- If Azure rewrite emulation differs from production behavior, preserve `/en/` and `/tr/` direct routes and remove only the rewrite rule.
- If deferred initialization breaks the portrait test or interaction, restore eager portrait initialization while keeping the independent route, cache, image, and accessibility improvements.
- Every change is isolated to static configuration, markup, styles, scripts, generated image assets, and validation tests; no Azure Portal mutation is required.

## Non-Goals

- Adding a framework, bundler, API, analytics product, service worker, or runtime dependency
- Deploying or changing Azure resources manually
- Redirecting the `www` host to the apex host
- Reworking content, layout, typography, or the portfolio information architecture
- Introducing one-year immutable caching before asset filenames are content-versioned
