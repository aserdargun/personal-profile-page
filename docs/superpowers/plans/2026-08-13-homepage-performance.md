# Homepage Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the root client-side navigation, improve repeat-visit caching, deliver a smaller AVIF portrait, defer portrait animation work, and clear the known Lighthouse accessibility findings.

**Architecture:** Azure Static Web Apps rewrites `/` to the existing English document and applies route-specific cache headers. The dependency-free local Node preview server reads the same route configuration so browser QA exercises production-like behavior. Existing static HTML/CSS/JavaScript remains the runtime; validation scripts define the deployment, image, scheduling, and accessibility contracts.

**Tech Stack:** Static HTML/CSS/JavaScript, Azure Static Web Apps `staticwebapp.config.json`, Node.js 20+ built-in test runner, `avifenc`, Browser plugin, Lighthouse 13.4.1.

## Global Constraints

- Preserve the dependency-free, no-build static-site architecture.
- Preserve `/en/` and `/tr/` as directly accessible localized routes.
- Serve English content immediately at `/` without a client-side navigation.
- Keep HTML on the short default cache policy.
- Cache CSS/JavaScript for exactly 86400 seconds and images/icons for exactly 604800 seconds.
- Keep WebP and PNG portrait fallbacks and explicit `720 × 952` dimensions.
- Do not add Azure Functions, Front Door, analytics, a framework, a bundler, a service worker, or runtime packages.
- Do not mutate Azure Portal resources manually; deployment remains GitHub Actions driven.
- Follow TDD: each production change must be preceded by a test that fails for the expected missing behavior.

---

### Task 1: Production route/cache contract and local emulation

**Files:**
- Modify: `tools/deployment.test.mjs`
- Modify: `tools/serve.test.mjs`
- Modify: `staticwebapp.config.json`
- Modify: `tools/serve.mjs`

**Interfaces:**
- Consumes: `staticwebapp.config.json` route objects with `route`, optional `rewrite`, and optional `headers`.
- Produces: production and local behavior where `/` serves `/en/index.html`, CSS/JS use `public, max-age=86400`, and images/icons use `public, max-age=604800`.

- [ ] **Step 1: Write the failing production-configuration test**

Add JSON loading and assertions to `tools/deployment.test.mjs`:

```js
const staticConfig = JSON.parse(
  await readFile(path.join(root, "staticwebapp.config.json"), "utf8"),
);

test("Azure serves the English homepage at root without client navigation", () => {
  assert.deepEqual(
    staticConfig.routes.find(({ route }) => route === "/"),
    { route: "/", rewrite: "/en/index.html" },
  );
});

test("Azure caches static assets without long-caching HTML", () => {
  const routeMap = new Map(staticConfig.routes.map((rule) => [rule.route, rule]));
  assert.equal(routeMap.get("/styles.css").headers["Cache-Control"], "public, max-age=86400");
  assert.equal(routeMap.get("/scripts.js").headers["Cache-Control"], "public, max-age=86400");
  assert.equal(routeMap.get("/images/*").headers["Cache-Control"], "public, max-age=604800");
  assert.equal(routeMap.get("/icons/*").headers["Cache-Control"], "public, max-age=604800");
  assert.equal(routeMap.get("/").headers, undefined);
});
```

- [ ] **Step 2: Write the failing local-server behavior tests**

Change the root test and add cache tests in `tools/serve.test.mjs`:

```js
test("serves the English homepage at root without client navigation", async () => {
  const response = await request("/");
  assert.equal(response.statusCode, 200);
  assert.match(response.body, /<html lang="en" data-locale="en">/);
  assert.doesNotMatch(response.body, /window\.location\.replace/);
});

test("emulates Azure cache headers for shared assets", async () => {
  const expectations = new Map([
    ["/styles.css", "public, max-age=86400"],
    ["/scripts.js", "public, max-age=86400"],
    ["/images/serdar-gundogdu-ascii-480.webp", "public, max-age=604800"],
    ["/icons/stackfolio.svg", "public, max-age=604800"],
  ]);
  for (const [pathname, cacheControl] of expectations) {
    const response = await request(pathname, "HEAD");
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], cacheControl);
  }
});
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```bash
node --test tools/deployment.test.mjs tools/serve.test.mjs
```

Expected: FAIL because `staticwebapp.config.json` has no `routes`, `/` still serves the language chooser, and local assets return `no-store`.

- [ ] **Step 4: Implement the Azure route rules**

Replace `staticwebapp.config.json` with a `routes` array preceding the existing `globalHeaders`:

```json
{
  "routes": [
    { "route": "/", "rewrite": "/en/index.html" },
    { "route": "/styles.css", "headers": { "Cache-Control": "public, max-age=86400" } },
    { "route": "/scripts.js", "headers": { "Cache-Control": "public, max-age=86400" } },
    { "route": "/images/*", "headers": { "Cache-Control": "public, max-age=604800" } },
    { "route": "/icons/*", "headers": { "Cache-Control": "public, max-age=604800" } }
  ],
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Frame-Options": "DENY"
  }
}
```

- [ ] **Step 5: Make the preview server emulate configured routes**

In `tools/serve.mjs`, read and parse `staticwebapp.config.json`, add `.avif` to `mimeTypes`, match exact routes or suffix `*` wildcards in order, use a matched `rewrite` as the served path, and merge matched route headers into the response. Preserve `no-store` for unmatched routes and error responses.

Use these helpers:

```js
function matchesRoute(route, pathname) {
  return route.endsWith("*") ? pathname.startsWith(route.slice(0, -1)) : pathname === route;
}

function configuredRoute(pathname) {
  return staticConfig.routes?.find(({ route }) => matchesRoute(route, pathname));
}
```

- [ ] **Step 6: Run the focused tests and verify GREEN**

Run:

```bash
node --test tools/deployment.test.mjs tools/serve.test.mjs
```

Expected: all deployment and server tests PASS.

- [ ] **Step 7: Commit Task 1**

```bash
git add staticwebapp.config.json tools/deployment.test.mjs tools/serve.mjs tools/serve.test.mjs
git commit -m "perf: serve homepage directly and cache assets"
```

### Task 2: AVIF portrait delivery

**Files:**
- Modify: `tools/validate-site.mjs`
- Modify: `tools/deployment.test.mjs`
- Modify: `en/index.html`
- Modify: `tr/index.html`
- Create: `images/serdar-gundogdu-ascii-480.avif`
- Create: `images/serdar-gundogdu-ascii-720.avif`

**Interfaces:**
- Consumes: `images/serdar-gundogdu-ascii.png` as the 720 × 952 source.
- Produces: AVIF `srcset` candidates at 480 px and 720 px with WebP and PNG fallbacks unchanged.

- [ ] **Step 1: Add failing markup, file, and budget validation**

Update `tools/validate-site.mjs` so each locale must include:

```html
<source type="image/avif" srcset="/images/serdar-gundogdu-ascii-480.avif 480w, /images/serdar-gundogdu-ascii-720.avif 720w"
```

Add both AVIF paths to required assets. Read AVIF/WebP stats and assert:

```js
check(portrait480AvifStats.size < portrait480Stats.size, "480px AVIF portrait must be smaller than WebP");
check(portrait720AvifStats.size < portrait720Stats.size, "720px AVIF portrait must be smaller than WebP");
```

Add both AVIF paths to `requiredPaths` in `tools/deployment.test.mjs`.

- [ ] **Step 2: Run validation and verify RED**

Run:

```bash
node tools/validate-site.mjs && node --test tools/deployment.test.mjs
```

Expected: FAIL because AVIF markup and files are missing.

- [ ] **Step 3: Generate AVIF candidates**

Use an isolated temporary directory and `avifenc`:

```bash
tmp_dir=$(mktemp -d)
sips --resampleWidth 480 images/serdar-gundogdu-ascii.png --out "$tmp_dir/portrait-480.png"
avifenc --min 20 --max 30 --speed 6 --jobs all "$tmp_dir/portrait-480.png" images/serdar-gundogdu-ascii-480.avif
avifenc --min 20 --max 30 --speed 6 --jobs all images/serdar-gundogdu-ascii.png images/serdar-gundogdu-ascii-720.avif
rm "$tmp_dir/portrait-480.png"
rmdir "$tmp_dir"
```

- [ ] **Step 4: Inspect AVIF dimensions, sizes, and appearance**

Run `sips -g pixelWidth -g pixelHeight` and `ls -lh` for both files. Inspect each AVIF with the local image viewer; compare the face, fine ASCII strokes, lime/black contrast, and crop with the WebP/PNG source. If an AVIF is not smaller or shows visible artifacts, adjust quantizer bounds and regenerate before continuing.

- [ ] **Step 5: Add AVIF before WebP in both localized pages**

Insert the exact AVIF `<source>` before the existing WebP source in `en/index.html` and `tr/index.html`. Do not change the WebP source or PNG `<img>` fallback.

- [ ] **Step 6: Run focused validation and verify GREEN**

Run:

```bash
node tools/validate-site.mjs && node --test tools/deployment.test.mjs
```

Expected: both commands PASS and AVIF files are smaller than WebP.

- [ ] **Step 7: Commit Task 2**

```bash
git add en/index.html tr/index.html images/serdar-gundogdu-ascii-480.avif images/serdar-gundogdu-ascii-720.avif tools/validate-site.mjs tools/deployment.test.mjs
git commit -m "perf: add responsive AVIF portrait"
```

### Task 3: Idle portrait initialization

**Files:**
- Modify: `tools/validate-portrait-canvas.mjs`
- Modify: `scripts.js`

**Interfaces:**
- Consumes: existing `initializePortrait()` with no arguments.
- Produces: `schedulePortraitInitialization()` that uses `window.requestIdleCallback(initializePortrait, { timeout: 800 })` or `window.setTimeout(initializePortrait, 300)`.

- [ ] **Step 1: Refactor the test fixture and write failing idle/fallback tests**

Create a test helper that runs `scripts.js` in a VM with controllable `requestIdleCallback` and `setTimeout` queues. Keep the existing complete-bitmap canvas assertions. Add two tests:

```js
test("portrait initialization waits for browser idle time", async () => {
  const fixture = await createFixture({ supportsIdleCallback: true });
  fixture.fireDOMContentLoaded();
  assert.equal(fixture.activeClasses.has("is-interactive"), false);
  assert.deepEqual(fixture.idleTimeouts, [800]);
  fixture.runIdleCallback();
  assert.equal(fixture.activeClasses.has("is-interactive"), true);
});

test("portrait initialization uses a bounded timer fallback", async () => {
  const fixture = await createFixture({ supportsIdleCallback: false });
  fixture.fireDOMContentLoaded();
  assert.equal(fixture.activeClasses.has("is-interactive"), false);
  assert.deepEqual(fixture.timerDelays, [300]);
  fixture.runTimer();
  assert.equal(fixture.activeClasses.has("is-interactive"), true);
});
```

- [ ] **Step 2: Run the portrait tests and verify RED**

Run:

```bash
node --test tools/validate-portrait-canvas.mjs
```

Expected: FAIL because `initializePortrait()` currently runs synchronously in the DOMContentLoaded handler.

- [ ] **Step 3: Implement minimal scheduling**

Add before the DOMContentLoaded listener:

```js
function schedulePortraitInitialization() {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(initializePortrait, { timeout: 800 });
    return;
  }
  window.setTimeout(initializePortrait, 300);
}
```

Call `schedulePortraitInitialization()` instead of `initializePortrait()` inside the existing DOMContentLoaded handler.

- [ ] **Step 4: Run the portrait and syntax tests and verify GREEN**

Run:

```bash
node --check scripts.js && node --test tools/validate-portrait-canvas.mjs
```

Expected: syntax check and both scheduling/canvas tests PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add scripts.js tools/validate-portrait-canvas.mjs
git commit -m "perf: defer portrait interaction until idle"
```

### Task 4: Lighthouse accessibility findings

**Files:**
- Modify: `tools/validate-site.mjs`
- Modify: `en/index.html`
- Modify: `tr/index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: existing wordmark, language-link, Stackfolio, timeline, lab, and credentials markup/classes.
- Produces: accessible names containing visible labels and contrast-safe inactive/metadata colors.

- [ ] **Step 1: Add failing static accessibility assertions**

Require in `tools/validate-site.mjs` for each locale:

```js
check(!html.includes('class="stackfolio-entry" href=') || !html.match(/class="stackfolio-entry"[^>]+aria-label=/), `${locale}: Stackfolio must use its visible content as the accessible name`);
check(!html.match(/class="wordmark"[^>]+aria-label=/), `${locale}: wordmark must use its visible content as the accessible name`);
check(html.includes('aria-label="TR —') && html.includes('aria-label="EN —'), `${locale}: language labels must contain their visible abbreviations`);
```

Require exact contrast-safe CSS declarations:

```js
check(styles.includes(".has-js .timeline-step {\n  opacity: 1;"), "Inactive timeline steps must not reduce descendant contrast with parent opacity");
check(styles.includes("color: rgba(18, 19, 16, 0.7);"), "Light-surface metadata contrast token is missing");
check(styles.includes("color: rgba(18, 19, 16, 0.65);"), "Section metadata contrast token is missing");
```

- [ ] **Step 2: Run site validation and verify RED**

Run:

```bash
node tools/validate-site.mjs
```

Expected: FAIL for the current wordmark/Stackfolio labels, missing `EN` descriptive label on one page, timeline parent opacity, and light-surface contrast values.

- [ ] **Step 3: Fix accessible names in both locales**

- Remove `aria-label` from `.wordmark` and `.stackfolio-entry` anchors so their visible text becomes their accessible name.
- Give every language link an `aria-label` beginning with its visible abbreviation, for example `TR — Türkçe sürüme geç` and `EN — Switch to English`, localized appropriately.

- [ ] **Step 4: Fix only the audited contrast selectors**

- Change `.has-js .timeline-step` from `opacity: 0.45` to `opacity: 1` and retain the translate reveal.
- Set `.section-kicker` to `rgba(18, 19, 16, 0.65)`.
- Set `.lab-index`, `.lab-type`, `.credentials-heading`, and `.credentials small` to `rgba(18, 19, 16, 0.7)`.
- Set dark hover metadata to at least `rgba(255, 253, 247, 0.72)` where the same metadata becomes light-on-dark.

- [ ] **Step 5: Run site validation and verify GREEN**

Run:

```bash
node tools/validate-site.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add en/index.html tr/index.html styles.css tools/validate-site.mjs
git commit -m "fix: improve homepage accessibility contrast"
```

### Task 5: Complete verification and rendered QA

**Files:**
- Verify: all modified files
- Temporary evidence only: `/tmp/aserdargun-performance-*.json`, `/tmp/aserdargun-*.png`

**Interfaces:**
- Consumes: production-ready static files and local preview server.
- Produces: fresh test, browser, and Lighthouse evidence without repository artifacts.

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
npm test
npm run test:server
git diff --check
```

Expected: every test passes, site validation passes, and diff check emits no errors.

- [ ] **Step 2: Start the production-like preview server**

Run `npm run dev` in a persistent terminal. Verify with `curl`:

```bash
curl -sSI http://127.0.0.1:4173/
curl -sSI http://127.0.0.1:4173/styles.css
curl -sSI http://127.0.0.1:4173/images/serdar-gundogdu-ascii-480.avif
```

Expected: root HTML success, one-day CSS cache, seven-day AVIF cache, and `image/avif` MIME type.

- [ ] **Step 3: Run Browser-plugin desktop QA**

The flow under test is: `/` loads → English first screen renders at the root URL → `TR` is selected → `/tr/` renders without runtime errors.

Verify page identity, meaningful DOM, no framework overlay, console warnings/errors, loaded AVIF/WebP image dimensions, screenshot evidence, and language interaction.

- [ ] **Step 4: Run Browser-plugin mobile QA**

At 390 × 844, verify no horizontal overflow, readable hero/header, working language link, loaded portrait, and clean console. Reset the viewport after the check.

- [ ] **Step 5: Run Lighthouse mobile and desktop audits against local root**

Use Lighthouse 13.4.1 with headless Chrome for performance, accessibility, best-practices, and SEO. Save JSON under `/tmp`. Confirm:

- no `redirects` audit item for `/`;
- performance remains at least 95;
- LCP remains below 2500 ms;
- TBT remains below 200 ms;
- CLS remains at or below 0.1;
- accessibility reaches 100 or any remaining audit is identified with exact nodes.

- [ ] **Step 6: Review repository state and requirements**

Run:

```bash
git status --short --branch
git log -6 --oneline --decorate
git diff HEAD~4 --stat
```

Map every design success criterion to fresh evidence. Do not push or deploy unless the user separately authorizes that external action.

- [ ] **Step 7: Final commit if verification required a corrective edit**

If and only if verification required a code correction, stage only the corrective files and commit with a scoped message. Otherwise create no empty commit.
