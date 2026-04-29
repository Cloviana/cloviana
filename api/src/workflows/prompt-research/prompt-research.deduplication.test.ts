import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cosineSimilarity,
  deduplicateByGreedy,
  deduplicatePrompts,
} from "./prompt-research.deduplication";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const v = [1, 2, 3];
    assert.equal(cosineSimilarity(v, v), 1);
  });

  it("returns 0 for orthogonal vectors", () => {
    assert.equal(cosineSimilarity([1, 0, 0], [0, 1, 0]), 0);
  });

  it("returns 0 when a vector is all zeros", () => {
    assert.equal(cosineSimilarity([0, 0, 0], [1, 2, 3]), 0);
  });

  it("returns -1 for opposite vectors", () => {
    assert.ok(Math.abs(cosineSimilarity([1, 0], [-1, 0]) - -1) < 1e-10);
  });
});

describe("deduplicateByGreedy", () => {
  it("keeps all candidates when none are similar", () => {
    const embeddings = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const candidates = [
      { promptId: 0, prompt: "prompt a" },
      { promptId: 1, prompt: "prompt b" },
      { promptId: 2, prompt: "prompt c" },
    ];

    const result = deduplicateByGreedy(embeddings, candidates, 0.92);
    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((c) => c.promptId),
      [0, 1, 2],
    );
  });

  it("removes a near-duplicate keeping the first", () => {
    const embeddings = [
      [1, 0.05, 0],
      [1, 0.02, 0],
      [0, 0, 1],
    ];
    const candidates = [
      { promptId: 0, prompt: "best helpdesk software for small business" },
      { promptId: 1, prompt: "top helpdesk tools for SMBs" },
      { promptId: 2, prompt: "customer support overwhelm" },
    ];

    const result = deduplicateByGreedy(embeddings, candidates, 0.9);
    assert.equal(result.length, 2);
    assert.equal(result[0].prompt, "best helpdesk software for small business");
    assert.equal(result[1].prompt, "customer support overwhelm");
  });

  it("collapses all candidates when all are identical", () => {
    const embeddings = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 0, 0],
    ];
    const candidates = [
      { promptId: 0, prompt: "same prompt" },
      { promptId: 1, prompt: "same prompt rephrased" },
      { promptId: 2, prompt: "same prompt again" },
    ];

    const result = deduplicateByGreedy(embeddings, candidates, 0.92);
    assert.equal(result.length, 1);
    assert.equal(result[0].promptId, 0);
  });

  it("reassigns promptIds sequentially after dedup", () => {
    const embeddings = [
      [1, 0, 0, 0],
      [1, 0, 0, 0], // dup of 0
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0], // dup of 3
    ];
    const candidates = [
      { promptId: 10, prompt: "a" },
      { promptId: 11, prompt: "a dup" },
      { promptId: 12, prompt: "b" },
      { promptId: 13, prompt: "c" },
      { promptId: 14, prompt: "c dup" },
    ];

    const result = deduplicateByGreedy(embeddings, candidates, 0.92);
    assert.equal(result.length, 3);
    assert.deepEqual(
      result.map((c) => c.promptId),
      [0, 1, 2],
    );
    assert.deepEqual(
      result.map((c) => c.prompt),
      ["a", "b", "c"],
    );
  });
});

describe("deduplicatePrompts", () => {
  it("returns empty array for empty input", async () => {
    const openai = { embed: async () => [] };
    const result = await deduplicatePrompts({
      openai: openai as never,
      promptCandidates: [],
    });
    assert.deepEqual(result, []);
  });

  it("returns single candidate with promptId 0", async () => {
    const openai = { embed: async () => [[1, 0, 0]] };
    const result = await deduplicatePrompts({
      openai: openai as never,
      promptCandidates: [{ promptId: 5, prompt: "best helpdesk for shopify" }],
    });

    assert.equal(result.length, 1);
    assert.equal(result[0].promptId, 0);
    assert.equal(result[0].prompt, "best helpdesk for shopify");
  });
});
