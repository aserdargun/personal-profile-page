# Homepage Public Application Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six-item homepage Application Map with a number-neutral five-item public map, remove all visible Stackfolio map content, and link each remaining repository label to its exact public GitHub URL.

**Architecture:** Keep the existing static, localized HTML structure and responsive table implementation. Treat `tools/validate-site.mjs` as the canonical cross-locale contract: it will assert the five application mappings, exact link markup, localized number-neutral copy, Stackfolio absence, and equal-weight CSS before Browser QA verifies rendered desktop and mobile behavior.

**Tech Stack:** Static HTML5, shared CSS, Node.js 20+ ESM validation, built-in Node test runner through existing npm scripts, managed local preview on `127.0.0.1:4173`, and the in-app Browser skill for interaction QA.

## Global Constraints

- The approved specification is `docs/superpowers/specs/2026-08-15-homepage-public-repository-links-design.md`.
- Visible application order is exactly `aia`, `llm`, `usl`, `gpu`, `cld`.
- Root and English copy is exactly `Application map · live destinations` and `One portfolio. Focused applications.`.
- Turkish copy is exactly `Uygulama haritası · canlı adresler` and `Tek portföy. Odaklı uygulamalar.`.
- Current homepage source must contain no Stackfolio table row, `Stackfolio`, `stk-aserdargun-com`, `https://stk.aserdargun.com/`, or GitHub link for the Stackfolio repository.
- The old Stackfolio-first CSS emphasis must be removed, not transferred to AIA.
- Repository links use `target="_blank"`, `rel="noreferrer"`, a visible `<code>` label, and an `aria-hidden="true"` `↗` marker.
- Do not add runtime GitHub API calls, JavaScript link handlers, assets, fonts, dependencies, repository badges, or new application rows.
- Preserve the approved, unrelated career portrait work already present in the dirty worktree. Do not reset, checkout, stage, or rewrite unrelated changes.
- This delivery is local only: do not create commits, push branches, trigger GitHub Actions, change repository visibility, or deploy to Azure.
- Do not leave the managed preview or port `4173` listening after QA.

## File Structure

- Modify `tools/validate-site.mjs`: define the five-item canonical map and verify localized copy, repository-link structure, Stackfolio absence, and equal-weight styling.
- Modify `index.html`: update the root English map introduction, remove Stackfolio, and link the five repository labels.
- Modify `en/index.html`: mirror the root map structure and exact English copy.
- Modify `tr/index.html`: retain Turkish application descriptions while applying the same five mappings and localized introduction.
- Modify `styles.css`: remove the private-product first-row treatment and make nested repository `<code>` labels inherit the established link presentation.
- Do not modify `scripts.js`, portrait assets, icons, deployment workflows, or package dependencies for this feature.

---

### Task 1: Make the five-item public map the validated HTML contract

**Files:**
- Modify: `tools/validate-site.mjs:24-35, 107-127, 145-160, 175-205`
- Modify: `index.html:94-111`
- Modify: `en/index.html:94-111`
- Modify: `tr/index.html:94-111`

**Interfaces:**
- Consumes: the existing `matches(source, pattern)` helper and root/English/Turkish static Application Map markup.
- Produces: `expectedAppCodes`, `expectedAppUrls`, `expectedAppRepos`, and `expectedRepoUrls` arrays with matching indexes; an exact five-row DOM contract used by Task 2 and Browser QA.

- [ ] **Step 1: Replace the six-item validator constants and add exact repository URLs**

In `tools/validate-site.mjs`, replace the current application constants with:

```js
const expectedAppCodes = ["aia", "llm", "usl", "gpu", "cld"];
const expectedAppUrls = expectedAppCodes.map((code) => `https://${code}.aserdargun.com/`);
const expectedAppRepos = expectedAppCodes.map((code) => `${code}-aserdargun-com`);
const expectedRepoUrls = expectedAppRepos.map(
  (repository) => `https://github.com/aserdargun/${repository}`,
);
```

Keep `https://stackfolio.aserdargun.com/` in `retiredProjectUrls`; it is an old address and is independent of the removed `stk.aserdargun.com` row.

- [ ] **Step 2: Add failing per-locale assertions for repository links, number-neutral copy, and Stackfolio absence**

Inside the existing `for (const [locale, html] of Object.entries(pages))` Application Map block, replace the plain repository-presence loop with these exact checks:

```js
  for (const [index, repository] of expectedAppRepos.entries()) {
    const repositoryUrl = expectedRepoUrls[index];
    const repositoryLink = `<a href="${repositoryUrl}" target="_blank" rel="noreferrer"><code>${repository}</code> <span aria-hidden="true">↗</span></a>`;
    check(html.includes(repositoryLink), `${locale}: repository link is missing or malformed: ${repository}`);
  }

  const appMapHtml = html.match(/<section class="app-map"[\s\S]*?<\/section>/)?.[0] ?? "";
  const repositoryUrls = matches(
    appMapHtml,
    /<a href="(https:\/\/github\.com\/aserdargun\/[^"]+-aserdargun-com)" target="_blank" rel="noreferrer"><code>/g,
  );
  check(
    JSON.stringify(repositoryUrls) === JSON.stringify(expectedRepoUrls),
    `${locale}: repository links or order differ`,
  );

  const appMapIntro = html.match(/<div class="app-map-intro">([\s\S]*?)<\/div>/)?.[1] ?? "";
  const expectedKicker = locale === "tr"
    ? "Uygulama haritası · canlı adresler"
    : "Application map · live destinations";
  const expectedHeading = locale === "tr"
    ? "Tek portföy. Odaklı uygulamalar."
    : "One portfolio. Focused applications.";
  check(appMapIntro.includes(expectedKicker), `${locale}: number-neutral application map kicker is missing`);
  check(appMapIntro.includes(expectedHeading), `${locale}: number-neutral application map heading is missing`);
  check(!/\b(?:06|six|altı)\b/i.test(appMapIntro), `${locale}: numeric application count remains in the map introduction`);

  check(!html.includes('<th scope="row"><code>stk</code></th>'), `${locale}: Stackfolio application code remains`);
  check(!html.includes("Stackfolio"), `${locale}: Stackfolio product content remains`);
  check(!html.includes("stk-aserdargun-com"), `${locale}: Stackfolio repository name remains`);
  check(!html.includes("https://stk.aserdargun.com/"), `${locale}: Stackfolio product URL remains`);
  check(!html.includes("https://github.com/aserdargun/stk-aserdargun-com"), `${locale}: Stackfolio repository URL remains`);
```

Replace the two old global heading checks:

```js
check(pages.en.includes("One portfolio, six focused applications."), "English application map definition is missing");
check(pages.tr.includes("Tek portföy, altı odaklı uygulama."), "Turkish application map definition is missing");
```

with:

```js
check(pages.en.includes("One portfolio. Focused applications."), "English application map definition is missing");
check(pages.tr.includes("Tek portföy. Odaklı uygulamalar."), "Turkish application map definition is missing");
```

After `const rootPage = ...`, add the root repository-array and Stackfolio-negative contract:

```js
const rootAppMapHtml = rootPage.match(/<section class="app-map"[\s\S]*?<\/section>/)?.[0] ?? "";
const rootRepositoryUrls = matches(
  rootAppMapHtml,
  /<a href="(https:\/\/github\.com\/aserdargun\/[^"]+-aserdargun-com)" target="_blank" rel="noreferrer"><code>/g,
);
const rootAppCodes = matches(rootAppMapHtml, /<th scope="row"><code>([^<]+)<\/code><\/th>/g);
const rootAppMapIntro = rootAppMapHtml.match(/<div class="app-map-intro">([\s\S]*?)<\/div>/)?.[1] ?? "";
check(JSON.stringify(rootAppCodes) === JSON.stringify(expectedAppCodes), "Root application codes or order differ");
check(JSON.stringify(rootRepositoryUrls) === JSON.stringify(expectedRepoUrls), "Root repository links or order differ");
check(rootAppMapIntro.includes("Application map · live destinations"), "Root number-neutral application map kicker is missing");
check(rootAppMapIntro.includes("One portfolio. Focused applications."), "Root number-neutral application map heading is missing");
check(!/\b(?:06|six)\b/i.test(rootAppMapIntro), "Root numeric application count remains in the map introduction");
check(!rootPage.includes('<th scope="row"><code>stk</code></th>'), "Root Stackfolio application code remains");
check(!rootPage.includes("Stackfolio"), "Root Stackfolio product content remains");
check(!rootPage.includes("stk-aserdargun-com"), "Root Stackfolio repository name remains");
check(!rootPage.includes("https://stk.aserdargun.com/"), "Root Stackfolio product URL remains");
```

The existing root `expectedAppUrls` loop automatically switches from six to five because it consumes the updated constant.

- [ ] **Step 3: Run the focused validator and prove the new contract fails against the old HTML**

Run:

```bash
npm run validate:site
```

Expected: FAIL. The output must include failures for application code order, missing GitHub repository links, old numeric map copy, and remaining Stackfolio content. If it fails first for an unrelated portrait or pre-existing dirty-worktree issue, record that exact failure and verify the new Application Map failures are also present before proceeding.

- [ ] **Step 4: Update the map introduction and remove the complete Stackfolio row in all three homepages**

In both `index.html` and `en/index.html`, use:

```html
<p class="app-map-kicker">Application map · live destinations</p>
<h2 id="app-map-title">One portfolio. Focused applications.</h2>
```

In `tr/index.html`, use:

```html
<p class="app-map-kicker">Uygulama haritası · canlı adresler</p>
<h2 id="app-map-title">Tek portföy. Odaklı uygulamalar.</h2>
```

Delete this entire row from `index.html` and `en/index.html`:

```html
<tr><th scope="row"><code>stk</code></th><td><strong>Stackfolio</strong><span>A private workspace for tracking digital investments, memberships, and recurring costs.</span></td><td><code>stk-aserdargun-com</code></td><td><a href="https://stk.aserdargun.com/" target="_blank" rel="noreferrer">stk.aserdargun.com <span aria-hidden="true">↗</span></a></td></tr>
```

Delete this entire row from `tr/index.html`:

```html
<tr><th scope="row"><code>stk</code></th><td><strong>Stackfolio</strong><span>Dijital yatırımları, üyelikleri ve yinelenen maliyetleri izlemek için özel çalışma alanı.</span></td><td><code>stk-aserdargun-com</code></td><td><a href="https://stk.aserdargun.com/" target="_blank" rel="noreferrer">stk.aserdargun.com <span aria-hidden="true">↗</span></a></td></tr>
```

Do not alter the five remaining application names, descriptions, codes, or product-address anchors.

- [ ] **Step 5: Replace the five plain repository labels with exact GitHub anchors in every homepage**

Apply these exact Repository-column replacements to `index.html`, `en/index.html`, and `tr/index.html`:

```html
<a href="https://github.com/aserdargun/aia-aserdargun-com" target="_blank" rel="noreferrer"><code>aia-aserdargun-com</code> <span aria-hidden="true">↗</span></a>
<a href="https://github.com/aserdargun/llm-aserdargun-com" target="_blank" rel="noreferrer"><code>llm-aserdargun-com</code> <span aria-hidden="true">↗</span></a>
<a href="https://github.com/aserdargun/usl-aserdargun-com" target="_blank" rel="noreferrer"><code>usl-aserdargun-com</code> <span aria-hidden="true">↗</span></a>
<a href="https://github.com/aserdargun/gpu-aserdargun-com" target="_blank" rel="noreferrer"><code>gpu-aserdargun-com</code> <span aria-hidden="true">↗</span></a>
<a href="https://github.com/aserdargun/cld-aserdargun-com" target="_blank" rel="noreferrer"><code>cld-aserdargun-com</code> <span aria-hidden="true">↗</span></a>
```

Each anchor replaces only the corresponding `<code>…-aserdargun-com</code>` node inside the Repository cell. Keep the Address-cell product anchor unchanged.

- [ ] **Step 6: Run the focused validator and verify the five-item HTML contract passes**

Run:

```bash
npm run validate:site
```

Expected at the end of this task: PASS with `Site validation passed: TR/EN routes, application map, timeline parity, metadata, links, and assets are consistent.` The existing Stackfolio-first CSS assertion is intentionally unchanged until Task 2, so if it is later converted to a negative assertion before this step, defer the final PASS expectation to Task 2 and confirm all HTML-specific failures are gone.

- [ ] **Step 7: Review only the Task 1 diff and confirm unrelated content is untouched**

Run:

```bash
git diff -- index.html en/index.html tr/index.html tools/validate-site.mjs
git diff --check -- index.html en/index.html tr/index.html tools/validate-site.mjs
```

Expected: only the Application Map intro, Stackfolio-row removal, five repository anchors, and matching validator contract appear; `git diff --check` prints nothing. Do not stage or commit the files.

---

### Task 2: Give all public rows equal visual weight and style nested repository code

**Files:**
- Modify: `tools/validate-site.mjs:155-165`
- Modify: `styles.css:350-480`

**Interfaces:**
- Consumes: the Task 1 Repository-cell structure `<td><a …><code>…</code> <span …>↗</span></a></td>` and the existing generic `.app-map a` hover/focus behavior.
- Produces: equal resting row presentation and `.app-map tbody td:nth-of-type(2) a code` inheritance used on both desktop and mobile.

- [ ] **Step 1: Replace the old Stackfolio-first style assertion with failing equal-weight assertions**

In `tools/validate-site.mjs`, replace:

```js
check(styles.includes(".app-map tbody tr:first-child"), "Stackfolio-first application map styling is missing");
```

with:

```js
check(!styles.includes(".app-map tbody tr:first-child"), "Stackfolio-first application map styling remains");
check(
  styles.includes(".app-map tbody td:nth-of-type(2) a code"),
  "Repository code labels do not inherit application map link styling",
);
```

- [ ] **Step 2: Run the focused validator and prove both CSS requirements fail**

Run:

```bash
npm run validate:site
```

Expected: FAIL with both `Stackfolio-first application map styling remains` and `Repository code labels do not inherit application map link styling`.

- [ ] **Step 3: Remove the old first-row presentation without changing hover/focus feedback**

Delete this complete rule from `styles.css`:

```css
.app-map tbody tr:first-child {
  background: rgba(200, 255, 54, 0.055);
  box-shadow: inset 3px 0 var(--lime);
}
```

Keep `.app-map tbody tr:hover` and `.app-map tbody tr:focus-within` unchanged so interactive feedback remains available for every row.

- [ ] **Step 4: Add a focused inheritance rule for Repository-column code labels**

Immediately after the existing `.app-map td > code` rule, add:

```css
.app-map tbody td:nth-of-type(2) a code {
  color: inherit;
  font: inherit;
  overflow-wrap: anywhere;
  white-space: inherit;
}
```

This keeps the code label visually consistent with the existing `.app-map a` state, including lime hover and keyboard focus, while the existing mobile `.app-map a { white-space: normal; overflow-wrap: anywhere; }` rule continues to control narrow layouts.

- [ ] **Step 5: Run the focused validator and full automated suite**

Run:

```bash
npm run validate:site
npm test
git diff --check
```

Expected: all commands PASS; `git diff --check` prints nothing. A failure in an unrelated pre-existing portrait contract must be diagnosed from the first exact error and must not be bypassed by weakening Application Map assertions.

- [ ] **Step 6: Review the CSS and validator diff for selector scope**

Run:

```bash
git diff -- styles.css tools/validate-site.mjs
```

Expected: the special first-row block is deleted, one Repository-cell code inheritance rule is added, and the validator now rejects any return of the special first-row selector. There must be no global `code`, `a`, `tr`, or `:first-child` rewrite and no JavaScript change.

---

### Task 3: Verify repository state, rendered behavior, localization, and cleanup

**Files:**
- Verify: `index.html`
- Verify: `en/index.html`
- Verify: `tr/index.html`
- Verify: `styles.css`
- Verify: `tools/validate-site.mjs`
- Do not create repository screenshots or reports.

**Interfaces:**
- Consumes: the five-row validated HTML contract from Task 1 and equal-weight responsive styling from Task 2.
- Produces: live read-only GitHub visibility evidence, desktop/mobile Browser QA evidence, a clean preview shutdown, and final local-only handoff state.

- [ ] **Step 1: Reconfirm the five linked repositories are public without changing repository state**

Run each read-only command:

```bash
gh repo view aserdargun/aia-aserdargun-com --json name,url,visibility,isPrivate
gh repo view aserdargun/llm-aserdargun-com --json name,url,visibility,isPrivate
gh repo view aserdargun/usl-aserdargun-com --json name,url,visibility,isPrivate
gh repo view aserdargun/gpu-aserdargun-com --json name,url,visibility,isPrivate
gh repo view aserdargun/cld-aserdargun-com --json name,url,visibility,isPrivate
```

Expected for every command: the exact `https://github.com/aserdargun/<repository>` URL, `"visibility":"PUBLIC"`, and `"isPrivate":false`. If any result differs, stop this feature before exposing that repository and report the exact repository state; do not mutate visibility.

- [ ] **Step 2: Prove source-level absence and five-link parity**

Run:

```bash
rg -n 'Stackfolio|stk-aserdargun-com|https://stk\.aserdargun\.com/|<th scope="row"><code>stk</code></th>' index.html en/index.html tr/index.html
rg -n 'https://github\.com/aserdargun/(aia|llm|usl|gpu|cld)-aserdargun-com' index.html en/index.html tr/index.html
```

Expected: the first command prints no matches. The second prints exactly fifteen matches: five GitHub URLs in each of the three homepage files.

- [ ] **Step 3: Read the complete Browser skill and start the managed preview**

Before browser work, read the complete `browser:control-in-app-browser` skill. Then ensure no stale preview record from this checkout remains:

```bash
npm run stop
```

Start the checkout-managed preview with:

```bash
npm run dev
```

Expected: the preview reports `http://127.0.0.1:4173`. Keep the running command in its managed execution session; do not launch an unmanaged background server.

- [ ] **Step 4: Verify the root desktop Application Map at 1440 × 1000**

Open `http://127.0.0.1:4173/` in a fresh Browser tab and set the viewport to `1440 × 1000`. Evaluate the Application Map DOM using this exact shape:

```js
const expected = [
  ["aia", "https://github.com/aserdargun/aia-aserdargun-com"],
  ["llm", "https://github.com/aserdargun/llm-aserdargun-com"],
  ["usl", "https://github.com/aserdargun/usl-aserdargun-com"],
  ["gpu", "https://github.com/aserdargun/gpu-aserdargun-com"],
  ["cld", "https://github.com/aserdargun/cld-aserdargun-com"],
];
const rows = [...document.querySelectorAll(".app-map tbody tr")];
const actual = rows.map((row) => {
  const code = row.querySelector('th[scope="row"] code')?.textContent.trim();
  const repositoryLink = row.querySelector("td:nth-of-type(2) a");
  return [
    code,
    repositoryLink?.href,
    repositoryLink?.target,
    repositoryLink?.rel,
    repositoryLink?.querySelector('span[aria-hidden="true"]')?.textContent.trim(),
  ];
});
({
  heading: document.querySelector("#app-map-title")?.textContent.trim(),
  kicker: document.querySelector(".app-map-kicker")?.textContent.trim(),
  rowCount: rows.length,
  actual,
  expected,
  hasStackfolio: document.querySelector(".app-map")?.textContent.includes("Stackfolio"),
  firstRowBackground: getComputedStyle(rows[0]).backgroundColor,
  secondRowBackground: getComputedStyle(rows[1]).backgroundColor,
  firstRowBoxShadow: getComputedStyle(rows[0]).boxShadow,
  documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
});
```

Expected:

- heading `One portfolio. Focused applications.`;
- kicker `Application map · live destinations`;
- `rowCount: 5`;
- each `actual` item matches the paired code/URL plus `_blank`, `noreferrer`, and `↗`;
- `hasStackfolio: false`;
- first and second resting backgrounds match and the first-row box shadow is `none`;
- `documentOverflow: 0`.

- [ ] **Step 5: Verify keyboard focus and repository link presentation**

Tab to each of the five Repository-column links. For every link, verify `document.activeElement` is that anchor and `getComputedStyle(document.activeElement)` shows a visible focus indication through outline and/or the lime border/color treatment. Confirm the nested `<code>` uses the same computed color and font family as its parent link.

Do not activate the links during local QA; the exact destination, target, rel, and public visibility are already verified independently.

- [ ] **Step 6: Verify English and Turkish localization parity**

Open `http://127.0.0.1:4173/en/` and repeat the row-count/code/repository-link checks. Expected English copy is:

```text
Application map · live destinations
One portfolio. Focused applications.
```

Open `http://127.0.0.1:4173/tr/` and repeat the checks. Expected Turkish copy is:

```text
Uygulama haritası · canlı adresler
Tek portföy. Odaklı uygulamalar.
```

Expected on both routes: five rows in `aia`, `llm`, `usl`, `gpu`, `cld` order; the same five GitHub URLs; no visible Stackfolio text; no Browser console error.

- [ ] **Step 7: Verify the mobile card layout at 390 × 844**

Set the Browser viewport to `390 × 844` on the Turkish route, then verify:

```js
const map = document.querySelector(".app-map");
const rows = [...map.querySelectorAll("tbody tr")];
({
  rowCount: rows.length,
  codes: rows.map((row) => row.querySelector('th[scope="row"] code')?.textContent.trim()),
  repoLinks: rows.map((row) => row.querySelector("td:nth-of-type(2) a")?.href),
  mapOverflow: map.scrollWidth - map.clientWidth,
  documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  stackfolioVisible: map.textContent.includes("Stackfolio"),
});
```

Expected: five ordered codes and five exact GitHub URLs; `documentOverflow: 0`; no clipped repository label; `stackfolioVisible: false`. `mapOverflow` must be `0` because the mobile table switches to the existing card grid. Visually confirm long repository labels wrap inside their cards and the `↗` marker remains adjacent to the label.

- [ ] **Step 8: Inspect Browser console state and close the QA tab**

Inspect console messages for the root, English, and Turkish routes. Expected: no uncaught exception, failed local resource, CSP error, accessibility-name warning caused by the new links, or layout assertion failure. Close only the Browser tab created for this QA.

- [ ] **Step 9: Stop the preview and prove the checkout no longer owns a listener**

Run:

```bash
npm run stop
curl --silent --show-error --max-time 2 http://127.0.0.1:4173/
```

Expected: `npm run stop` reports the managed preview stopped or already absent. The `curl` command fails to connect. If port `4173` is owned by another checkout, do not terminate it; report the foreign listener and verify this checkout's preview control record is absent.

- [ ] **Step 10: Run the final automated and worktree audits**

Run:

```bash
npm test
git diff --check
git status --short
git diff -- index.html en/index.html tr/index.html styles.css tools/validate-site.mjs
```

Expected:

- all automated tests pass;
- `git diff --check` prints nothing;
- only approved existing local portrait changes, the approved specs/plans, and the five Application Map implementation files are modified or untracked;
- no screenshot, generated asset, dependency file, staged file, commit, push, workflow run, or deployment artifact was created;
- the implementation diff contains only number-neutral copy, Stackfolio removal, five repository links, equal-weight CSS, and matching validation.

Update the specification status to `Implemented and browser-QA validated locally` only after every automated and Browser QA assertion above passes. Keep the delivery boundary unchanged.
