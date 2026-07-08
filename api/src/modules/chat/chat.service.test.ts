import assert from "node:assert/strict";
import test from "node:test";
import { ChatMessageRole } from "@prisma/client";
import { ChatService } from "./chat.service";

test("send forwards database history through the ask-only agent contract", async (t) => {
  let requestUrl = "";
  let requestHeaders: Headers | undefined;
  let requestBody: Record<string, unknown> | undefined;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requestUrl = String(input);
    requestHeaders = new Headers(init?.headers);
    requestBody = JSON.parse(String(init?.body));
    return Response.json({ response: "The answer.", actions: [] });
  });

  const prisma = {
    chat: {
      findFirst: async () => ({
        id: "chat-1",
        title: "Existing chat",
        messages: [
          {
            role: ChatMessageRole.user,
            content: [{ type: "text", text: "Trusted question" }],
          },
          {
            role: ChatMessageRole.assistant,
            content: [
              { type: "reasoning", text: "Not forwarded" },
              { type: "text", text: "Trusted answer" },
            ],
          },
        ],
      }),
      upsert: async () => undefined,
    },
    chatMessage: {
      createMany: async () => undefined,
    },
    $transaction: async (operation: (client: unknown) => Promise<void>) =>
      operation(prisma),
  };
  const service = new ChatService(
    prisma as never,
    {
      agentUrl: "http://agent:8000",
      agentInternalToken: "service-secret",
    } as never,
  );

  const response = await service.send("business-1", {
    chatId: "chat-1",
    messages: [
      {
        role: "assistant",
        content: [{ type: "text", text: "Untrusted browser history" }],
      },
      {
        role: "user",
        content: [{ type: "text", text: "Latest question" }],
      },
    ],
  });

  assert.equal(requestUrl, "http://agent:8000/agent/chat");
  assert.equal(requestHeaders?.get("x-agent-internal-token"), "service-secret");
  assert.deepEqual(requestBody, {
    businessId: "business-1",
    chatId: "chat-1",
    messages: [
      { role: "user", content: "Trusted question" },
      { role: "assistant", content: "Trusted answer" },
      { role: "user", content: "Latest question" },
    ],
  });
  assert.deepEqual(response, {
    chatId: "chat-1",
    title: "Existing chat",
    content: [{ type: "text", text: "The answer." }],
    actions: [],
  });
});

test("stream forwards agent SSE and returns the app chat envelope", async (t) => {
  let upstreamUrl = "";
  let upstreamBody: Record<string, unknown> | undefined;
  let upstreamToken: string | null = null;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    upstreamUrl = String(input);
    upstreamBody = JSON.parse(String(init?.body));
    upstreamToken = new Headers(init?.headers).get("x-agent-internal-token");
    return new Response(
      [
        'event: action\ndata: {"id":"call-1","label":"Searched the web","tool":"web_search","detail":"latest"}\n\n',
        'event: action_result\ndata: {"id":"call-1","count":1,"results":[{"title":"Source","url":"https://example.com","source":"example.com"}]}\n\n',
        'event: delta\ndata: {"text":"The answer."}\n\n',
        'event: done\ndata: {"response":"The answer.","actions":["Searched the web"]}\n\n',
      ].join(""),
      { headers: { "content-type": "text/event-stream" } },
    );
  });

  const persisted: unknown[] = [];
  const prisma = {
    chat: {
      findFirst: async () => ({
        id: "chat-1",
        title: "Existing chat",
        messages: [],
      }),
      upsert: async () => undefined,
    },
    chatMessage: {
      createMany: async (args: unknown) => {
        persisted.push(args);
      },
    },
    $transaction: async (operation: (client: unknown) => Promise<void>) =>
      operation(prisma),
  };
  const service = new ChatService(
    prisma as never,
    {
      agentUrl: "http://agent:8000",
      agentInternalToken: "service-secret",
    } as never,
  );

  let output = "";
  let ended = false;
  const reply = {
    hijack: () => undefined,
    request: { headers: { origin: "http://app.localhost" } },
    raw: {
      writeHead: () => undefined,
      write: (chunk: string) => {
        output += chunk;
        return true;
      },
      end: () => {
        ended = true;
      },
    },
  };

  await service.stream(
    "business-1",
    {
      chatId: "chat-1",
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Latest question" }],
        },
      ],
    },
    reply as never,
  );

  assert.equal(upstreamToken, "service-secret");
  assert.equal(
    upstreamUrl,
    "http://agent:8000/agent/chats/chat-1/messages/stream",
  );
  assert.deepEqual(upstreamBody, {
    businessId: "business-1",
    messages: [{ role: "user", content: "Latest question" }],
  });
  assert.match(output, /event: action\n/);
  assert.match(output, /event: action_result\n/);
  assert.match(output, /event: delta\n/);
  assert.match(output, /event: done\n/);
  assert.match(output, /"chatId":"chat-1"/);
  assert.match(output, /"text":"The answer\."/);
  assert.equal(persisted.length, 1);
  assert.equal(ended, true);
});

test("remove cleans up the agent workspace before deleting the chat", async (t) => {
  const operations: string[] = [];
  t.mock.method(globalThis, "fetch", async (_input, init) => {
    operations.push(String(init?.method));
    return Response.json({ status: "ok" });
  });

  const prisma = {
    chat: {
      findFirst: async () => ({ id: "chat-1" }),
      delete: async () => {
        operations.push("prisma-delete");
      },
    },
  };
  const service = new ChatService(
    prisma as never,
    {
      agentUrl: "http://agent:8000",
      agentInternalToken: "service-secret",
    } as never,
  );

  const response = await service.remove("business-1", "chat-1");

  assert.deepEqual(operations, ["DELETE", "prisma-delete"]);
  assert.deepEqual(response, { id: "chat-1" });
});
