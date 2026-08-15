# Homepage Public Application Map and Repository Links Design

**Date:** 2026-08-15
**Status:** Implemented and browser-QA validated locally
**Delivery boundary:** Local only. Do not commit, push, trigger GitHub Actions, or deploy to Azure without a separate explicit publication instruction.

## Goal

Present only the five public portfolio applications in the homepage Application Map, connect each visible repository name to its public GitHub repository, and remove numeric application counts from the map introduction.

Stackfolio is private and must not be visible anywhere in the homepage Application Map.

## Public Application Map

The visible map contains exactly these five applications and keeps this order:

| Code | Application | Visible repository name | GitHub URL | Product URL |
| --- | --- | --- | --- | --- |
| `aia` | AI Ecosystem Atlas | `aia-aserdargun-com` | `https://github.com/aserdargun/aia-aserdargun-com` | `https://aia.aserdargun.com/` |
| `llm` | LLM Runtime & Serving Atlas | `llm-aserdargun-com` | `https://github.com/aserdargun/llm-aserdargun-com` | `https://llm.aserdargun.com/` |
| `usl` | Unsloth Studio Learning | `usl-aserdargun-com` | `https://github.com/aserdargun/usl-aserdargun-com` | `https://usl.aserdargun.com/` |
| `gpu` | GPU Kernel Engineering — Kernel Atlas | `gpu-aserdargun-com` | `https://github.com/aserdargun/gpu-aserdargun-com` | `https://gpu.aserdargun.com/` |
| `cld` | Cloud Provider Cost Comparison | `cld-aserdargun-com` | `https://github.com/aserdargun/cld-aserdargun-com` | `https://cld.aserdargun.com/` |

The Turkish page retains its existing localized application names and descriptions. The root and English pages retain their existing English content. Application descriptions, three-letter codes, and product URLs for these five rows do not otherwise change.

## Stackfolio Removal Boundary

Remove the complete Stackfolio table row from:

- `index.html`;
- `en/index.html`;
- `tr/index.html`.

The visible Application Map must therefore contain none of the following:

- the `stk` application code;
- the `Stackfolio` product name or description;
- the `stk-aserdargun-com` repository name;
- the `https://stk.aserdargun.com/` product link;
- a Stackfolio GitHub repository link.

This is a homepage visibility change. It does not delete the Stackfolio icon, historical documentation, deployment files, or assets that may still be referenced by independent tests or historical records.

## Number-Neutral Introduction

Remove both explicit application counts from the map introduction so the wording does not need to change when the public portfolio changes again.

Use this exact copy:

| Locale | Kicker | Heading |
| --- | --- | --- |
| Root / English | `Application map · live destinations` | `One portfolio. Focused applications.` |
| Turkish | `Uygulama haritası · canlı adresler` | `Tek portföy. Odaklı uygulamalar.` |

The Application Map introduction must not contain `06`, `six`, or `altı`. The existing descriptive paragraph about the three-letter code remains unchanged.

## Repository-Link Markup

In the Repository column, replace each remaining plain `<code>` element with a direct external link that wraps the existing code label and a decorative outbound arrow:

```html
<a href="https://github.com/aserdargun/aia-aserdargun-com"
   target="_blank"
   rel="noreferrer">
  <code>aia-aserdargun-com</code>
  <span aria-hidden="true">↗</span>
</a>
```

Apply the exact repository-to-URL mapping to all five rows in all three homepage documents. The documents remain structurally identical for the table except for existing localized application names, descriptions, headers, and surrounding copy.

## Interaction and Accessibility

- The repository name itself is the interactive target.
- Each repository link opens in a new tab with `target="_blank"`.
- Use `rel="noreferrer"`, matching the existing external product links.
- Keep the repository name as visible monospace `<code>` text.
- Mark the `↗` arrow `aria-hidden="true"`; it must not duplicate the accessible name.
- Preserve a clearly visible keyboard-focus state.
- Do not add an icon-only link, GitHub logo, tooltip, visibility badge, or JavaScript click handler.

## Styling

Repository links should read as code first and links second:

- retain the existing monospace repository label;
- use the current table text color at rest;
- show the existing lime accent on hover and keyboard focus;
- underline on hover/focus or use the table's established bottom-border treatment;
- keep the outbound arrow small and aligned with the code label;
- allow wrapping on narrow screens without producing horizontal overflow.

Remove the Stackfolio-specific `.app-map tbody tr:first-child` visual treatment instead of transferring it to AIA. All five public applications have equal visual weight.

No new icon asset, font, dependency, or JavaScript is required.

## Validation

Update the site validator so the canonical Application Map contract is exactly `aia`, `llm`, `usl`, `gpu`, `cld`.

Required automated checks:

1. Application order is exactly `aia`, `llm`, `usl`, `gpu`, `cld` in root, English, and Turkish pages.
2. Each of the five visible repository names remains unchanged.
3. Each repository name is wrapped by its matching GitHub URL.
4. Every repository link contains `target="_blank"` and `rel="noreferrer"`.
5. Every repository link contains an `aria-hidden="true"` outbound arrow.
6. Root, English, and Turkish repository URL arrays are identical.
7. Existing product links for the five public applications remain unchanged.
8. The map introduction contains the exact number-neutral localized copy.
9. The current homepage source contains no Stackfolio row data: the exact `<th scope="row"><code>stk</code></th>` cell, `Stackfolio`, `stk-aserdargun-com`, or `https://stk.aserdargun.com/`.
10. The obsolete Stackfolio-first CSS selector is absent.
11. No retired project URL is reintroduced.

The Stackfolio-negative check must be scoped to current homepage source, current map validation data, and active Application Map CSS. It must not reject unrelated historical documentation, assets, or independent asset-serving tests.

Browser QA must confirm:

- exactly five application rows are visible in the Application Map;
- Stackfolio is not visible in root, English, or Turkish homepages;
- all five repository links are visible and have the correct resolved `href`, `target`, and `rel`;
- keyboard focus is visible on every repository link;
- AIA does not inherit Stackfolio's old first-row emphasis;
- desktop and mobile layouts do not gain horizontal overflow beyond the established responsive table behavior;
- no relevant console error is introduced.

## Non-Goals

- No GitHub API data loading at runtime.
- No repository stars, forks, language, visibility badges, or README previews.
- No change to the five public repository names or application branding.
- No change to the five public product-address links.
- No new application rows.
- No deletion or visibility mutation of any GitHub repository.
- No removal of historical documentation or unused Stackfolio assets under this change.
- No site deployment under this design task.

## Acceptance Criteria

The change is complete when all three homepage variants:

- show exactly the five approved public applications;
- contain no visible Stackfolio content in the Application Map;
- use number-neutral introduction copy;
- expose the five exact public GitHub repositories through accessible repository-name links;
- give all five rows equal visual weight;
- pass automated site validation and desktop/mobile Browser QA;
- leave the local preview stopped; and
- create no commit, push, GitHub Actions run, or Azure deployment.
