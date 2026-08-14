# Codex Preview Stop Action Design

Date: 2026-08-14
Status: Approved in conversation; pending written-spec review

## Context

The repository exposes two Codex Desktop actions through the generated
`.codex/environments/environment.toml` file:

- `Run` starts the dependency-free local preview with `npm run dev`.
- `Validate` runs the repository checks with `npm test`.

The preview server runs in the foreground through `tools/serve.mjs`, defaults to
`127.0.0.1:4173`, and already handles `SIGINT` and `SIGTERM`. Today it can be
stopped from the terminal that owns the foreground process, but there is no
separate Codex action that can stop the currently managed preview.

## Goal

Add a `Stop` Codex action that safely stops only the preview server started for
the current repository worktree.

The action must:

1. Work with the default or overridden `HOST` and `PORT` values.
2. Keep different worktrees isolated.
3. Never kill a process merely because it owns port 4173 or has a matching
   command name.
4. Exit successfully with a clear message when no managed preview is running.
5. Leave Azure Static Web Apps, production hosting, DNS, and other external
   services unchanged.

## Selected Approach

Use an authenticated local control endpoint plus a per-worktree runtime record.

When `tools/serve.mjs` starts listening, it creates a random control token and
writes a private runtime record beneath the operating system's temporary
directory. `npm run stop` reads the record and sends a local authenticated stop
request to the recorded preview address. The server validates the request,
acknowledges it, closes its listener and active connections, removes its own
runtime record, and exits cleanly.

This is preferred over PID- or port-based termination because it proves that
the receiving process is the preview server that created the record. It does
not send a signal to an arbitrary process.

## User Experience

The Codex action order will be:

1. `Run` — `npm run dev`
2. `Stop` — `npm run stop`
3. `Validate` — `npm test`

`Stop` uses the supported `tool` icon because the environment schema has no
dedicated stop icon.

Expected terminal messages:

- Successful shutdown: `Preview server stopped at http://127.0.0.1:4173.`
- No managed server: `Preview server is not running.`
- Unsafe or inconsistent state: a concise error that explains why no shutdown
  was attempted.

Running `Stop` repeatedly is safe. The first invocation stops the preview; later
invocations report that it is not running and return status 0.

## Components

### Shared preview-control module

A small dependency-free Node.js module owns the runtime-record contract:

- Derive a stable worktree identifier from the canonical repository root using
  SHA-256.
- Store records under a private directory in `os.tmpdir()` rather than writing
  generated state into the repository.
- Allow a test-only control-directory override so integration tests remain
  isolated from a developer's active preview.
- Write records atomically with owner-only permissions.
- Validate the record version, root, PID, host, port, and token before use.
- Remove a record only when it belongs to the current server instance.

The record contains only local runtime metadata:

```json
{
  "version": 1,
  "root": "/canonical/worktree/path",
  "pid": 12345,
  "host": "127.0.0.1",
  "port": 4173,
  "token": "random-256-bit-value"
}
```

No credential, GitHub token, Azure token, or user data is stored.

### Preview server

`tools/serve.mjs` retains its existing static-file behavior and adds one local
control route:

```text
POST /__codex/preview/stop
X-Preview-Control-Token: <random token>
```

The route accepts a request only when:

- the request originates from a loopback address;
- the supplied token exactly matches the current server token; and
- the server's runtime record still identifies the current process and
  worktree.

Other POST requests continue to return `405`. An invalid control request cannot
stop the server.

After accepting a valid request, the server returns an acknowledgement, stops
accepting new requests, closes remaining connections, removes its runtime
record, and completes normal process shutdown. Existing `SIGINT` and `SIGTERM`
paths perform the same record cleanup.

Only one managed preview is registered per worktree. An active existing record
causes a second managed preview startup to fail with a clear message. A record
whose process no longer exists is treated as stale and can be replaced safely.

### Stop command

`tools/stop.mjs` implements `npm run stop`:

1. Resolve the canonical repository root and its runtime-record path.
2. If no record exists, print the no-op message and exit 0.
3. Validate every record field and confirm that it belongs to the current
   worktree.
4. Send the authenticated loopback request with a short timeout.
5. Wait for the managed process and runtime record to disappear.
6. Exit 0 only after confirmed shutdown.

If the endpoint is unreachable and the recorded process no longer exists, the
command removes the stale record and exits successfully. If the recorded PID is
still alive but the authenticated endpoint does not confirm shutdown, the
command returns a nonzero status and does not send `SIGTERM`, `SIGKILL`, `pkill`,
or a port-based kill command.

### Codex environment

The generated Codex environment configuration will be updated through the
Codex environment editor so that the generated-file boundary is preserved. The
resulting tracked TOML entry will be verified as:

```toml
[[actions]]
name = "Stop"
icon = "tool"
command = "npm run stop"
```

The setup command and existing `Run` and `Validate` actions remain unchanged.

### Package and documentation

`package.json` gains the `stop` command and a focused stop-control test command.
The complete validation command includes the new tests so the `Validate` Codex
action protects the stop behavior. README development instructions describe
the new terminal command and Codex action without changing production deploy
instructions.

## Error Handling and Safety

- Missing record: success/no-op.
- Stale record with no live PID: remove only the record and return success.
- Malformed record: return nonzero; do not contact or terminate a process.
- Record from another worktree: return nonzero; do not contact or terminate a
  process.
- Non-loopback control request: reject it.
- Missing or incorrect token: reject it and keep serving.
- Endpoint timeout while the recorded PID is alive: return nonzero and leave the
  process untouched.
- Shutdown timeout after acknowledgement: return nonzero with the PID and
  preview address for diagnosis; do not escalate to a force kill.
- Runtime records use restrictive directory and file permissions and contain a
  random 256-bit token.

The Stop action never searches all processes, kills by command pattern, or
terminates whichever process owns a port.

## Testing

Tests exercise real child processes and local HTTP requests rather than mocking
the shutdown contract.

Required coverage:

1. `npm run stop` exits 0 when no managed preview exists.
2. A started preview creates a valid private runtime record.
3. `npm run stop` shuts down that preview and removes the record.
4. A second stop is a successful no-op.
5. An invalid token cannot stop the preview.
6. A non-control POST route still returns `405`.
7. A malformed or foreign-worktree record never terminates a process.
8. A stale record is removed only after its process is confirmed absent.
9. A custom port is discovered from the record and stops correctly.
10. Existing route, security, deployment, portrait, and site-validation tests
    continue to pass.

The TDD sequence must demonstrate each new behavior failing before its
implementation is added.

## Files in Scope

- `.codex/environments/environment.toml` through the Codex environment editor
- `package.json`
- `package-lock.json` if npm metadata changes it
- `tools/serve.mjs`
- `tools/stop.mjs`
- a small shared preview-control module under `tools/`
- focused Node.js tests under `tools/`
- `README.md`
- this design and its implementation plan

## Non-Goals

- Stopping, deleting, or modifying an Azure Static Web Apps environment
- Changing GitHub Actions deployment behavior
- Killing arbitrary processes by PID, port, or command-name pattern
- Supporting multiple simultaneous managed previews in one worktree
- Adding third-party runtime or development dependencies
- Changing production HTML, CSS, JavaScript, images, routing, or DNS

## Acceptance Criteria

Implementation is complete only when:

1. Codex Desktop exposes `Run`, `Stop`, and `Validate` in that order.
2. `Run` starts the existing preview and writes no generated state into the
   repository.
3. `Stop` shuts down only the current worktree's managed preview.
4. `Stop` is an idempotent success when no preview is running.
5. Unsafe or inconsistent state never triggers a signal or port-based kill.
6. All focused and existing tests pass without warnings.
7. The worktree is clean except for the intended committed changes.
8. No GitHub, Azure, DNS, or production-site state is changed.
