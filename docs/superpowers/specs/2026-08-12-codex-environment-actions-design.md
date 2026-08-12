# Codex Environment Actions Design

Date: 2026-08-12
Status: Approved

## Context

`aserdargun.com` is a dependency-free static site. Local development needs only Node.js for the existing validation tools and Python 3 for a lightweight static file server. The repository does not need a package installation or build step.

Codex Desktop reads repository-local environment configuration from `.codex/environments/environment.toml`. The supported schema provides a setup script, an optional cleanup script, and named actions with `tool`, `run`, `debug`, or `test` icons.

## Goal

Provide a minimal, repeatable local Codex environment that:

1. Fails early when Node.js or Python 3 is unavailable.
2. Starts the static site on a predictable local address.
3. Runs the repository's complete documented validation gate with one action.
4. Does not install dependencies or perform external deployment.

## Selected Approach

Use one repository-local `.codex/environments/environment.toml` file with an idempotent setup script and two common actions.

This keeps the configuration discoverable by Codex Desktop and avoids adding a package manager, Makefile, task runner, or project-specific wrapper script to a site that does not otherwise need them.

## Setup Script

The setup script will run in fail-fast mode and print the available tool versions:

```sh
set -eu
node --version
python3 --version
```

Running the setup repeatedly must be safe. It must not write generated files, install packages, start background processes, or access the network.

## Common Actions

### Preview Site

- Icon: `run`
- Command: `python3 -m http.server 4173 --bind 127.0.0.1`
- Behavior: serves the worktree root in the foreground at `http://127.0.0.1:4173/`
- Shutdown: the user stops the foreground action from its terminal

### Validate Site

- Icon: `test`
- Command:

```sh
node --check scripts.js &&
node --test tools/validate-portrait-canvas.mjs &&
node tools/validate-site.mjs
```

- Behavior: stops on the first failure and returns a nonzero status to Codex Desktop
- Coverage: main JavaScript syntax, responsive portrait canvas behavior, TR/EN route parity, timeline metadata, links, and assets

## Alternatives Considered

### Add a task runner or package manager

Rejected because the site has no runtime dependencies or build step. Introducing `package.json`, Make, Just, or another task layer would add maintenance without improving the two required workflows.

### Add Git or Azure deployment actions

Rejected for this scope. Deployment changes external state and should remain in the reviewed GitHub Actions workflow rather than a one-click local action.

### Leave setup empty

Rejected because an explicit tool check produces a clear worktree-setup failure when Node.js or Python 3 is missing, instead of failing later during preview or validation.

## Error Handling

- `set -eu` makes setup fail immediately when a required command fails or an unset variable is used.
- The validation action uses `&&`, so later checks do not run after an earlier failure.
- Preview binds only to `127.0.0.1`, preventing accidental exposure on other network interfaces.
- No secrets, credentials, environment variables, or deployment tokens are required.

## Verification

Implementation is complete only when all of the following are demonstrated from the worktree:

1. The TOML file parses successfully.
2. The setup script exits with status 0 and reports Node.js and Python 3 versions.
3. Validate Site exits with status 0 and reports one passing canvas test plus successful site validation.
4. Preview Site serves `/`, `/en/`, and `/tr/` with HTTP success on `127.0.0.1:4173`.
5. The worktree contains only the intended environment configuration and documentation changes.

## Non-Goals

- Installing or updating Node.js, Python, npm packages, or system packages
- Creating `package.json` or modifying the unrelated untracked `package-lock.json` in the main checkout
- Starting the preview server during every worktree setup
- Deploying to Azure Static Web Apps
- Committing secrets or changing global Codex settings
