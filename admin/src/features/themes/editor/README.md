# Theme editor

The editor for a theme: the agent chat on the left, the preview and code view on the right.

## The chat

```
chat/
  model/        Pure logic. No React, no network. Everything here has a test.
  components/   Transcript, messages, plan approval, conversation picker.
components/
  chat/         The thread: messages, empty state, scrolling.
  composer/     The message box: chips, the @ menu, modes, queue, attachments.
hooks/
  use-agent-thread.ts   Sends messages, follows a run's stream, queues, retries.
  use-run-context.ts    What the user is looking at, as removable chips.
  use-reference-uploads.ts
```

### How a run reaches the screen

The API streams a run as a list of typed **parts** (`chat/model/part.ts`: text, reasoning, tool,
todos, notice). Two events carry them, `part.upsert` (the part's whole state) and `part.delta`
(text to append). `applyPartEvent` applies them in order; nothing else is needed. When the run
ends the API saves the same parts with the message, so a reload looks like the stream did.

The chat library (assistant-ui) is used for scrolling, the message box and its menus. It is given
the answer text; the transcript is drawn by our own components from the parts, carried in the
message's `metadata.custom`. That is what lets steps, diffs and tasks look like Claude Code
rather than flattened text.

### Rules

- Put logic in `chat/model` and test it. Components should only arrange and draw.
- Everything from the network is parsed with the schemas in `part.ts` before it is shown.
- The part types mirror `api/.../domain/transcript.ts`. Change both together.
- File contents never come through the stream: a read is a line count, an edit is a diff. File
  contents are read from stored, immutable files (`/source/blobs/...`).

### Modes and context

A message is sent in one of three modes: **Chat** and **Plan** are read-only, **Build** edits. A
plan ends with "Build this plan", which sends a Build run. Alongside the words, a message carries
what the user was looking at (page, open file, selected lines, `@` files). It is shown as chips
the user can remove, and the API passes it to the agent as data, never instructions.

### Other behaviour worth knowing

- Messages typed while the agent works are queued and sent in order. Esc stops the agent.
- Up and Down in an empty box recall earlier messages.
- Restoring "to before this message" goes back to the revision before that run, using the
  `revisionId` saved with the run's reply.
- A stopped build run keeps its work as an "Interrupted" revision when the project still builds.

## Tests

`pnpm test` runs the Vitest suite. It covers the pure logic only; behaviour that needs the API and
a sandbox is checked by running the editor.
