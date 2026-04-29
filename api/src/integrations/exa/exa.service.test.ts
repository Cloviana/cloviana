import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ExaService } from "./exa.service";
import type { DeepOutputSchema } from "./exa.types";

function createService(search: (query: string, options: unknown) => unknown) {
  const service = new ExaService({ exaApiKey: "test-key" } as never);
  (
    service as unknown as {
      exa: { search: (query: string, options: unknown) => unknown };
    }
  ).exa = { search };

  return service;
}

describe("ExaService", () => {
  it("passes documented search options through and returns the full response", async () => {
    const outputSchema: DeepOutputSchema = {
      type: "object",
      required: ["answer"],
      properties: {
        answer: { type: "string" },
      },
    };
    const calls: unknown[] = [];
    const response = {
      requestId: "request-1",
      resolvedSearchType: "auto",
      searchTime: 12,
      costDollars: { total: 0.001 },
      results: [
        {
          id: "https://example.com",
          url: "https://example.com",
          title: "Example",
          text: "Full text",
          highlights: ["Relevant excerpt"],
          summary: "Summary",
          extras: { links: ["https://example.com/about"] },
        },
      ],
      output: {
        content: { answer: "typed answer" },
        grounding: [],
      },
    };

    const service = createService(async (query, options) => {
      calls.push({ query, options });
      return response;
    });

    const result = await service.search<
      {
        text: { maxCharacters: number };
        highlights: { query: string; maxCharacters: number };
        summary: { query: string };
        maxAgeHours: number;
        livecrawlTimeout: number;
        subpages: number;
        subpageTarget: string[];
        extras: { links: number; imageLinks: number };
      },
      { answer: string }
    >("latest product analytics platforms", {
      type: "deep",
      numResults: 10,
      category: "news",
      userLocation: "US",
      includeDomains: ["example.com"],
      excludeDomains: ["ignore.example"],
      startPublishedDate: "2026-01-01",
      endPublishedDate: "2026-04-01",
      startCrawlDate: "2026-01-01",
      endCrawlDate: "2026-04-01",
      includeText: ["analytics"],
      excludeText: ["casino"],
      moderation: true,
      additionalQueries: ["product analytics alternatives"],
      systemPrompt: "Prefer primary sources.",
      outputSchema,
      contents: {
        text: { maxCharacters: 5000 },
        highlights: {
          query: "buyer evaluation criteria",
          maxCharacters: 1200,
        },
        summary: { query: "summarize for product research" },
        maxAgeHours: 0,
        livecrawlTimeout: 15000,
        subpages: 2,
        subpageTarget: ["pricing", "features"],
        extras: { links: 3, imageLinks: 2 },
      },
    });

    assert.deepEqual(calls, [
      {
        query: "latest product analytics platforms",
        options: {
          type: "deep",
          numResults: 10,
          category: "news",
          userLocation: "US",
          includeDomains: ["example.com"],
          excludeDomains: ["ignore.example"],
          startPublishedDate: "2026-01-01",
          endPublishedDate: "2026-04-01",
          startCrawlDate: "2026-01-01",
          endCrawlDate: "2026-04-01",
          includeText: ["analytics"],
          excludeText: ["casino"],
          moderation: true,
          additionalQueries: ["product analytics alternatives"],
          systemPrompt: "Prefer primary sources.",
          outputSchema,
          contents: {
            text: { maxCharacters: 5000 },
            highlights: {
              query: "buyer evaluation criteria",
              maxCharacters: 1200,
            },
            summary: { query: "summarize for product research" },
            maxAgeHours: 0,
            livecrawlTimeout: 15000,
            subpages: 2,
            subpageTarget: ["pricing", "features"],
            extras: { links: 3, imageLinks: 2 },
          },
        },
      },
    ]);
    assert.equal(result, response);
    assert.equal(result.output?.content.answer, "typed answer");
  });

  it("retries retryable errors", async () => {
    let attempts = 0;
    const service = createService(async () => {
      attempts += 1;

      if (attempts === 1) {
        throw Object.assign(new Error("temporary failure"), { status: 500 });
      }

      return {
        requestId: "request-2",
        results: [],
      };
    });

    const response = await service.search("retryable query", { type: "auto" });

    assert.equal(response.requestId, "request-2");
    assert.equal(attempts, 2);
  });

  it("does not retry non-429 client errors", async () => {
    let attempts = 0;
    const service = createService(async () => {
      attempts += 1;
      throw Object.assign(new Error("bad request"), { status: 400 });
    });

    await assert.rejects(
      () => service.search("invalid query", { type: "auto" }),
      /bad request/,
    );
    assert.equal(attempts, 1);
  });
});
