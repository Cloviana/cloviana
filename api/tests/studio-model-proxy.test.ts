import "reflect-metadata";
import assert from "node:assert/strict";
import test from "node:test";
import type { AgentModelAccess } from "../src/modules/agents/application/ports/agent-model-access.port";
import { OpenRouterModelGateway } from "../src/modules/agents/infrastructure/engine/openrouter-model-gateway";
import type { AppConfiguration } from "../src/platform/config/app.configuration";

const config = {
  openrouterApiKey: "provider-secret",
  codingAgentModel: "configured-model",
} as AppConfiguration;
const token = "a".repeat(64);

test("model proxy rejects expired tokens and pins model, provider routing and output limits", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let authorized = false;
  let calls = 0;
  let forwarded: Record<string, unknown> | undefined;
  globalThis.fetch = async (_url, input) => {
    calls++;
    assert.equal(
      (input?.headers as Record<string, string>).Authorization,
      "Bearer provider-secret",
    );
    forwarded = JSON.parse(input?.body as string);
    return new Response(JSON.stringify({ choices: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  };
  const store = {
    authorizeModelRequest: async () => authorized,
  } as unknown as AgentModelAccess;
  const gateway = new OpenRouterModelGateway(store, config);
  const request = {
    model: "attacker-model",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 999999,
    provider: { only: ["attacker"] },
  };
  await assert.rejects(
    gateway.forward("run", token, request, new AbortController().signal),
    /expired/i,
  );
  assert.equal(calls, 0);
  authorized = true;
  const response = await gateway.forward(
    "run",
    token,
    request,
    new AbortController().signal,
  );
  assert.equal(forwarded?.model, "configured-model");
  assert.equal(forwarded?.max_tokens, 16384);
  assert.deepEqual(forwarded?.provider, { allow_fallbacks: false });
  const reader = response.body.getReader();
  while (!(await reader.read()).done) {
    /* Drain the proxied response. */
  }
  await assert.rejects(
    gateway.forward(
      "run",
      token,
      { messages: [] },
      new AbortController().signal,
    ),
    /Invalid model request/,
  );
  assert.equal(calls, 1);
});

test("cancelling a model stream releases its concurrency slot", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () =>
    new Response(
      new ReadableStream<Uint8Array>({
        start() {
          /* Remain open until cancelled. */
        },
      }),
    );
  const store = {
    authorizeModelRequest: async () => true,
  } as unknown as AgentModelAccess;
  const gateway = new OpenRouterModelGateway(store, config);
  const request = {
    stream: true,
    messages: [{ role: "user", content: "Hello" }],
  };
  const first = await gateway.forward(
    "run",
    token,
    request,
    new AbortController().signal,
  );
  const second = await gateway.forward(
    "run",
    token,
    request,
    new AbortController().signal,
  );
  await assert.rejects(
    gateway.forward("run", token, request, new AbortController().signal),
    /already in progress/,
  );
  await first.body.cancel();
  const third = await gateway.forward(
    "run",
    token,
    request,
    new AbortController().signal,
  );
  await second.body.cancel();
  await third.body.cancel();
});
