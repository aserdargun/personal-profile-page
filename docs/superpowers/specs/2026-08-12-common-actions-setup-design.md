# Common Actions and Setup Design

## Context

The repository is a dependency-free static portfolio built with HTML, CSS, and
vanilla JavaScript. It already has three Node.js validation commands, but it has
no package manifest, no standard local preview command, and no configured Codex
actions. A generated Codex environment file and an empty npm lockfile are
currently present as untracked files.

## Goals

- Give contributors one predictable setup command through the Codex environment.
- Provide shared terminal commands for local preview and full validation.
- Expose matching `Run` and `Validate` buttons in the Codex app.
- Keep the site dependency-free and preserve its static Azure deployment model.
- Make local serving safe and deterministic without relying on a globally
  installed utility.

## Non-goals

- Introduce a frontend framework, bundler, transpiler, or package dependency.
- Change production site content, styling, routes, or Azure deployment behavior.
- Add publishing or deployment actions.
- Open a browser automatically from the server process.

## Selected Approach

Add a minimal npm command surface backed by a small Node.js static server. The
package has no runtime or development dependencies. Codex setup runs `npm ci`,
which verifies that the manifest and lockfile agree and gives future dependency
changes a standard installation path.

This approach uses Node.js for both serving and validation. It avoids requiring
Python or a globally installed static-server package and ensures that terminal
commands and Codex actions invoke the same project-owned entrypoints.

## Command Contract

`package.json` will define these scripts:

| Command | Responsibility |
| --- | --- |
| `npm run dev` | Start the local static server through `tools/serve.mjs`. |
| `npm run check:js` | Check `scripts.js` syntax with `node --check`. |
| `npm run test:portrait` | Run `tools/validate-portrait-canvas.mjs` with the Node test runner. |
| `npm run validate:site` | Run `tools/validate-site.mjs`. |
| `npm test` | Run all three existing validation gates in the order shown above. |

The package name will be `aserdargun.com`, its version will be `1.0.0`, the
package will be private, and it will declare Node.js 20 or newer as its supported
engine. There will be no dependency entries. The `test` script will be exactly
`npm run check:js && npm run test:portrait && npm run validate:site`. The
existing untracked `package-lock.json` will be regenerated from the manifest
rather than discarded.

## Local Server

`tools/serve.mjs` will use only Node.js standard-library modules.

- Default address: `http://127.0.0.1:4173`.
- `HOST` and `PORT` environment variables may override the defaults.
- `/` and directory URLs such as `/en/` and `/tr/` resolve to their local
  `index.html` files.
- Regular assets are served with an appropriate MIME type.
- `GET` and `HEAD` are supported; other HTTP methods return `405`.
- Missing resources return `404`; unexpected filesystem failures return `500`.
- Decoding errors and attempts to escape the repository root are rejected.
- Local responses use `Cache-Control: no-store` so edits are visible on refresh.
- `SIGINT` and `SIGTERM` stop the server cleanly.
- The process logs the preview URL and clear startup or shutdown errors.

The server provides exact static-file behavior. It will not add a single-page
application fallback because the production site consists of real files and
directories.

## Codex Environment

`.codex/environments/environment.toml` will retain its generated version and
project name and receive this command mapping:

```toml
[setup]
script = "npm ci"

[[actions]]
name = "Run"
icon = "run"
command = "npm run dev"

[[actions]]
name = "Validate"
icon = "tool"
command = "npm test"
```

The setup command is intentionally limited to deterministic local installation.
The actions do not deploy, publish, or mutate external services.

## Documentation

The README development section will document:

1. `npm ci` for initial setup.
2. `npm run dev` and the default preview URL.
3. `npm test` as the complete validation gate.
4. The individual validation scripts for focused troubleshooting.

The existing project description and deployment documentation will remain
unchanged.

## Error Handling and Safety

- The setup step fails immediately if Node/npm is missing or the lockfile does
  not match the package manifest.
- The preview command exits nonzero when its host or port is invalid or the
  listener cannot start.
- Static path resolution is confined to the repository root.
- Validation stops on the first failing gate because npm command chaining uses
  `&&`.
- No credentials or environment secrets are stored in project files.

## Verification

Implementation is complete only after fresh runs confirm all of the following:

1. `npm ci` exits successfully with the committed lockfile.
2. `npm test` passes the JavaScript syntax check, portrait test, and bilingual
   site validator.
3. The preview server starts through `npm run dev`.
4. HTTP requests to `/`, `/en/`, and `/tr/` return successful HTML responses.
5. A missing path returns `404`, and a traversal-style request cannot read a
   file outside the repository.
6. `git diff --check` reports no whitespace errors.

## Files in Scope

- `.codex/environments/environment.toml`
- `package.json`
- `package-lock.json`
- `tools/serve.mjs`
- `README.md`

No production HTML, CSS, JavaScript, image, sitemap, Azure workflow, or Static
Web Apps configuration file is in scope.
