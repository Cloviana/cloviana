import assert from "node:assert/strict";
import test from "node:test";
import { DocumentTag } from "@prisma/client";
import { KnowledgeService } from "./knowledge.service";

test("failed ingestion removes the document record", async (t) => {
  let deletedIds: string[] = [];
  const document = {
    id: "6fb8293e-b660-4c8b-8bce-f112dbd93178",
    businessId: "business-1",
    name: "positioning",
    extension: "txt",
    tag: DocumentTag.business,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    document: {
      create: async () => document,
      deleteMany: async ({ where }: any) => {
        deletedIds = where.id.in;
      },
    },
  };
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response("embedding failed", { status: 500 }),
  );

  const service = new KnowledgeService(
    prisma as any,
    {
      knowledgeBaseUrl: "http://localhost:8080",
    } as any,
  );

  await assert.rejects(
    service.upload("business-1", [
      {
        name: "positioning",
        extension: "txt",
        filename: "positioning.txt",
        mimetype: "text/plain",
        buffer: Buffer.from("Cloviana context"),
        tag: DocumentTag.business,
      },
    ]),
    /Knowledge base request failed/,
  );
  assert.deepEqual(deletedIds, [document.id]);
});

test("search forwards the knowledge-base contract", async (t) => {
  let requestUrl = "";
  let requestBody: unknown;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    requestUrl = String(input);
    requestBody = JSON.parse(String(init?.body));
    return Response.json([
      {
        text: "Cloviana context",
        score: 0.82,
        documentId: "document-1",
        businessId: "business-1",
        tag: "business",
        filename: "positioning.txt",
        chunkIndex: 0,
        title: null,
        section: null,
        okfType: null,
        resource: null,
      },
    ]);
  });
  const service = new KnowledgeService(
    {} as any,
    {
      knowledgeBaseUrl: "http://localhost:8080",
    } as any,
  );

  const results = await service.search({
    businessId: "business-1",
    query: "What is Cloviana?",
    tags: [DocumentTag.business],
  });

  assert.equal(requestUrl, "http://localhost:8080/search");
  assert.deepEqual(requestBody, {
    businessId: "business-1",
    query: "What is Cloviana?",
    tags: ["business"],
    limit: 5,
  });
  assert.equal(results[0].documentId, "document-1");
});
