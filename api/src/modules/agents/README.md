# Marketplace assistant and storefront editor API

A run is scoped to a theme or it isn't.

- **No `themeId`:** Deep Agents is the marketplace assistant. It reads catalog and theme
  context and cannot change code.
- **With a `themeId`:** the run goes straight to OpenCode, with no assistant in between, so
  the user sees the coding agent's own work. OpenCode works on a sandbox copy of the Next.js
  theme. What it may do depends on the run's `mode`:

  | Mode | Behavior |
  | --- | --- |
  | `BUILD` (default) | Edits the theme, checks the build, saves a revision. |
  | `PLAN` | Read-only. Explores and replies with a plan. Saves nothing. |
  | `CHAT` | Read-only. Answers questions about the theme. Saves nothing. |

  Read-only modes are enforced three ways: the prompt, OpenCode's permission rules (edit, bash
  and web tools are denied), and a check afterwards. If a read-only run left any change in the
  workspace, the workspace is discarded and the run fails.

The browser's code view is read-only. Publishing returns HTTP 501.

The API owns authentication, tenant scope, jobs, cancellation, versions, snapshots
and model credentials. No platform database, R2, or OpenRouter credentials enter
the generated app or its sandbox.

The assistant and theme editor expose application-facing contracts; Prisma,
sandbox and model-provider adapters implement their I/O. The queue worker claims
and schedules jobs, while the agent-run use case owns execution and cancellation.
Storefront build validation belongs to the theme workspace; the OpenCode adapter
receives that operation and the coding instructions from its caller.
Reference uploads are coordinated by the assistant application service; its
repository serializes conversation changes, and its storage port handles private
objects and file-type detection.

## Development and hosted sandboxes

- Development defaults to `SANDBOX_PROVIDER=docker`. Docker must be running on
  the API machine. Each theme uses its own unprivileged container, with no host
  workspace or Docker socket mounted. Preview ports bind to `127.0.0.1` only.
  The first workspace prepares a cached Node 22 image with Git, Python, curl and
  `opencode-ai@1.19.5`. Model calls reach the API through
  `http://host.docker.internal:API_PORT/api`, so a tunnel is unnecessary.
- Production defaults to `SANDBOX_PROVIDER=daytona`; Docker is rejected outside
  development. Set `DAYTONA_API_KEY`, `DAYTONA_TARGET` (default `eu`) and optionally
  `DAYTONA_SNAPSHOT`. A prebuilt snapshot must contain Node 22+, Git, Python 3,
  curl and the same OpenCode CLI version. Otherwise Daytona builds the image.
  The Daytona organization must have a default region configured in its dashboard;
  an API key alone does not finish account setup.
- `AGENT_MODEL_PROXY_URL` is the public HTTPS API base, including `/api`, reachable
  from Daytona. It falls back to `API_URL`. Localhost URLs are rejected for cloud
  sandboxes. A temporary Cloudflare tunnel works while it is running; update the
  setting when its hostname changes. This setting is not used by local Docker.
- Set `OPENROUTER_API_KEY`, `AGENT_MODEL`, `CODING_AGENT_MODEL`, the existing private
  R2 settings, and apply Prisma migrations before running the API. Model defaults
  are `anthropic/claude-sonnet-4.6` and can be changed independently.
- The API must listen on an address reachable by local containers (the existing
  default `API_HOST=0.0.0.0` does this). Local Docker mode expects the API process
  to run on the Docker host. A remote Docker daemon or an API inside another
  container needs a different model-proxy network configuration.

## Editor endpoints

All routes below start with `/api/marketplaces/:slug/themes/:themeId/editor`
and require the marketplace owner's platform session.

| Method | Suffix | Behavior |
| --- | --- | --- |
| GET | `/` | Current revision/version, workspace status, read-only and publishing flags |
| POST | `/workspace` | Durably request a workspace; returns before provisioning finishes |
| POST | `/workspace/restart` | Discard the cached sandbox and queue a clean restore |
| GET | `/preview` | Preview URL, readiness and expiry; Docker URLs have no signed expiry |
| GET | `/files` | Sorted source file list (up to 5,000 files) |
| GET | `/file?path=app/page.tsx` | UTF-8 source file, up to 1 MiB |
| GET | `/revisions` | Current head, redo availability and latest 200 revisions |
| POST | `/undo` | Move to the parent revision |
| POST | `/redo` | Reapply the last undone revision; supports repeated undo/redo |
| POST | `/revisions/:revisionId/restore` | Select a saved revision and clear redo history |
| GET | `/export` | Five-minute private download URL for a Git snapshot archive |
| POST | `/publish` | HTTP 501; no deployment is started |

Undo, redo and restore require `{ "expectedRevisionId": "uuid" }`. Stale revisions,
an active coding run, or another workspace writer return HTTP 409. After navigation,
poll editor state until `workspace.status` is `RUNNING`, then fetch the preview URL.
`RUNNING` means the sandbox process was launched; `preview.ready` confirms HTTP
readiness. Refresh signed preview URLs before their one-hour expiry. If a cached
Daytona sandbox auto-stops, request `/workspace/restart` to restore it.

There are no source file write endpoints. `.git`, `.env*`, dependencies, runtime
configuration and build output are excluded from the code view. Paths are checked
both before provider execution and against resolved paths inside the sandbox.

## Assistant endpoints

All routes below start with `/api/marketplaces/:slug/assistant` and require the
marketplace owner's platform session.

| Method | Suffix | Behavior |
| --- | --- | --- |
| GET / POST | `/conversations` | List latest 100 conversations (`?themeId=` keeps those with a run on that theme) / create with optional `title` |
| GET | `/conversations/:id/messages?after=0` | Messages in sequence order, pages of 200 |
| POST | `/conversations/:id/runs` | Persist a message and queue a run in one transaction |
| GET | `/conversations/:id/runs/active` | `{ run }`, the queued or running run to reattach to, or `null` |
| GET | `/runs/:id` | Durable run status, errors, base and saved revision IDs |
| POST | `/runs/:id/cancel` | Cancel a queued run immediately or request active-run cancellation |
| GET | `/runs/:id/events?after=0` | Durable event replay, pages of 200 |
| GET | `/runs/:id/stream?after=0` | SSE events with sequence IDs and heartbeat events |
| GET | `/runs/:id/usage` | Reported token counts by provider/model; unavailable cost is `null` |

Create a run with:

```json
{
  "prompt": "Build a warm, minimalist clothing storefront using these references",
  "mode": "BUILD",
  "idempotencyKey": "a-client-generated-unique-key",
  "themeId": "the-theme-uuid",
  "attachmentIds": []
}
```

Omit `themeId` for a general assistant conversation. General runs can read catalog
data and answer questions; they do not have business mutation tools. Adding more
product capabilities means exporting a permission-checked public use case from
its owning module and exposing it as a tool. Do not give the assistant raw SQL or
host shell access.

An idempotency key is unique per marketplace. Replaying an identical request returns
the same run; reusing a key for different content returns 409. A conversation and a
theme can each have only one active run. Sequences and token counts use decimal
strings where PostgreSQL uses BigInt. The assistant loads the latest bounded
conversation context, rather than silently dropping the newest user message.

SSE supports `Last-Event-ID` or `after`. Reconnecting replays persisted events, so
the UI can survive disconnects.

### The transcript

What the assistant did is an ordered list of typed parts (`domain/transcript.ts`): `text`,
`reasoning`, `tool` (with a short input, truncated output and, for edits, a diff), `todos`
and `notice`. Two events carry them:

- `part.upsert` `{ part }`: the part's complete current state. A later one with the same id
  replaces it.
- `part.delta` `{ id, text }`: text appended to a `text` or `reasoning` part.

The browser applies these in order, so it needs no other rules. When the run ends, the same
parts are saved with the assistant message as `content: { text, parts, mode }`, so a reload shows
what the stream showed. A run that is stopped or fails keeps what it had done, with a final
`notice`. Older messages that have only `text` render as a single text part.

Other events: `run.queued`, `revision.saved`, `run.succeeded`, `run.failed`, `run.cancelled`.
Everything is bounded (`TRANSCRIPT_LIMITS`) and file contents never reach the browser: a read
reports a line count, an edit reports its diff.

OpenCode's progress comes from its live event stream, with polling as the fallback. The
mapping from its parts to ours is `infrastructure/engine/opencode-part-mapper.ts`.

## Screenshot and text references

1. POST `/conversations/:id/attachments` with `{ name, mimeType, size }`.
2. PUT the bytes to the returned private `uploadUrl`, with matching Content-Type.
3. POST `/conversations/:id/attachments/:attachmentId/complete`.
4. Include the ready attachment ID in a run. GET the same attachment path for its
   status and a private preview/download URL.

PNG, JPEG, WebP, UTF-8 plain text and Markdown are supported. Each reference is
limited to 2 MiB, with up to four per run. Completion checks actual bytes and copies
them to a new immutable key: the upload URL cannot alter a ready reference. IDs
are checked against both the marketplace and conversation. The main assistant
can see image references, and OpenCode receives reference files inside the sandbox.
References are excluded from the generated app's Git snapshots. Configure the
private bucket's lifecycle to expire abandoned objects under `agent-upload-pending/`.

## Job and persistence guarantees

The durable queue is `agent_runs` plus requested `theme_sandboxes`. `AgentWorker`
polls PostgreSQL at application bootstrap; it does not depend on an Inngest event
being delivered after a transaction. Multiple API replicas claim runs with
`FOR UPDATE SKIP LOCKED`. Per-replica concurrency defaults to two. Run tokens,
heartbeats, and an independently renewed theme lease fence stale workers.

Browser disconnects do not stop jobs. Runs have a 30-minute limit. A worker lost for
two minutes marks its run interrupted (or cancelled if cancellation was requested),
revokes model access, and requests a clean workspace restore. Arbitrary tool effects are not automatically replayed after a
process crash. Review `resultRevisionId` on interrupted or cancelled runs: a save
that completed before cancellation remains durable.

In build mode the coding agent runs the app's checks; the platform additionally requires
`npm run build` to pass, asking OpenCode to repair failures up to twice. The API
then commits Git changes, uploads an immutable archive containing tracked source and Git history to
private R2, and atomically advances the database head with a snapshot-version and
lease check. A failed/cancelled edit discards its sandbox. R2 plus the DB head is
authoritative; a sandbox is a disposable cache. Every new revision has its own
archive, so exports and undo/redo refer to the selected version's actual source.
If a database commit has an uncertain outcome, its uploaded archive is retained
to avoid deleting a snapshot that may already be the committed head.

OpenCode runs with Basic auth on its private server. Its model credential is a
random, run-scoped bearer token whose hash is stored in the DB. The model proxy
accepts only that active run, the configured coding model, bounded output, and at
most 80 requests. It rejects cancelled, expired, or stale runs. The provider key
stays on the API. Model costs are not a billing ledger; only reported costs are
returned.

The existing generic Inngest sender remains separate from this PostgreSQL-backed
worker. No Vercel deployment, checkout/payment implementation, or admin UI is added
by this feature.

## Focused verification

`RUN_STUDIO_DB_TESTS=1 node --import tsx --test tests/studio-persistence.test.ts tests/studio-model-proxy.test.ts`
checks source-path safety and real PostgreSQL tenant scoping, idempotency,
undo/redo, cancellation, model-token revocation and lease fencing. Fixtures are
rolled back in one transaction. Without the environment flag, only the pure path
and model-proxy tests run. `pnpm check-types` checks the API without building it.

`node --import tsx scripts/verify-studio-workspace.ts` exercises the configured
sandbox, template restore, source reading, live preview and Git/R2 checkpoint.
It removes its own container and snapshot afterwards.

With a development API already running,
`node --import tsx scripts/verify-studio-api.ts` creates isolated test credentials
and a marketplace, signs in, uploads a reference, runs both real agents, verifies
the saved source and preview, then exercises undo/redo and disabled publishing.
It uses the configured model provider and removes only its own fixtures. Neither
script starts the API server.

`node --import tsx scripts/verify-studio-stream.ts` checks the real SSE endpoint's
authentication, tenant scoping, terminal replay, `Last-Event-ID`, and disconnect
behavior without model calls. It also removes its own fixtures and requires an
already-running development API.

Provider references: [Deep Agents customization](https://docs.langchain.com/oss/javascript/deepagents/customization),
[OpenCode server](https://opencode.ai/docs/server/),
[OpenCode configuration](https://opencode.ai/docs/config/), and
[Daytona regions](https://www.daytona.io/docs/en/regions/).
