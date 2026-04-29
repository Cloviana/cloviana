import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { BusinessResearchService } from "./business-research.service";

type TestProfile = {
  name: string;
  description: string;
  icp: string;
  category: string;
};

const promptsBaseDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../prompts",
);

function createCache() {
  const keys: string[] = [];

  return {
    keys,
    buildKey: (...parts: unknown[]) => {
      const key = JSON.stringify(parts);
      keys.push(key);
      return key;
    },
    remember: async <T>({ loader }: { loader: () => Promise<T> }) => loader(),
  };
}

type TestCache = ReturnType<typeof createCache>;

function createService({
  cache = createCache(),
  exa = {},
  groq = {},
  openai = {},
}: {
  cache?: TestCache;
  exa?: unknown;
  groq?: unknown;
  openai?: unknown;
}) {
  return new BusinessResearchService(
    cache as never,
    exa as never,
    groq as never,
    openai as never,
  );
}

describe("BusinessResearchService", () => {
  it("scrapes the homepage and parses a profile with Groq", async () => {
    const expectedPrompt = await readFile(
      path.join(promptsBaseDir, "business-profile.hbs"),
      "utf-8",
    );
    const calls: unknown[] = [];
    const service = createService({
      groq: {
        parse: async (args: unknown) => {
          calls.push(args);

          return {
            name: "Cloviana",
            description: "AI visibility platform",
            icp: "SaaS marketing teams",
            category: "AI search visibility software",
          };
        },
      },
    });

    (
      service as unknown as {
        scrapeHomepageText: (domain: string) => Promise<string>;
      }
    ).scrapeHomepageText = async (domain: string) => `Homepage for ${domain}`;

    const result = await service.enrichProfile("https://www.cloviana.com");

    assert.deepEqual(result, {
      name: "Cloviana",
      description: "AI visibility platform",
      icp: "SaaS marketing teams",
      category: "AI search visibility software",
    });
    assert.equal(calls.length, 1);
    const [call] = calls as Array<{
      name: string;
      schema: unknown;
      model: string;
      messages: Array<{ role: string; content: string }>;
    }>;
    assert.equal(call.name, "business-profile");
    assert.ok(call.schema);
    assert.equal(call.model, "openai/gpt-oss-20b");
    assert.deepEqual(call.messages, [
      { role: "system", content: expectedPrompt },
      {
        role: "user",
        content: JSON.stringify({
          domain: "cloviana.com",
          homepageText: "Homepage for cloviana.com",
        }),
      },
    ]);
  });

  it("finds competitors and filters invalid or duplicate domains", async () => {
    const expectedPrompt = await readFile(
      path.join(promptsBaseDir, "find-competitors.hbs"),
      "utf-8",
    );
    const calls: unknown[] = [];
    const service = createService({
      openai: {
        parse: async (args: unknown) => {
          calls.push(args);

          return {
            parsed: {
              competitors: [
                { domain: "cloviana.com" },
                { domain: "https://www.peec.ai" },
                { domain: "peec.ai" },
                { domain: "athenahq.ai" },
                { domain: "" },
              ],
            },
          };
        },
      },
    });

    (
      service as unknown as {
        enrichProfile: (domain: string) => Promise<TestProfile>;
      }
    ).enrichProfile = async () => ({
      name: "Cloviana",
      description: "AI visibility platform",
      icp: "SaaS marketing teams",
      category: "AI search visibility software",
    });

    const result = await service.findCompetitors("https://cloviana.com");

    assert.deepEqual(result, ["peec.ai", "athenahq.ai"]);
    assert.equal(calls.length, 1);
    const [call] = calls as Array<{
      name: string;
      schema: unknown;
      model: string;
      reasoning: { effort: string };
      temperature: number;
      input: Array<{ role: string; content: string }>;
    }>;
    assert.equal(call.name, "find-business-competitors");
    assert.ok(call.schema);
    assert.equal(call.model, "gpt-5.4-mini-2026-03-17");
    assert.deepEqual(call.reasoning, { effort: "none" });
    assert.equal(call.temperature, 0.2);
    assert.deepEqual(call.input, [
      {
        role: "system",
        content: expectedPrompt.replaceAll("{{count}}", "8"),
      },
      {
        role: "user",
        content: JSON.stringify({
          domain: "cloviana.com",
          profile: {
            name: "Cloviana",
            description: "AI visibility platform",
            icp: "SaaS marketing teams",
            category: "AI search visibility software",
          },
        }),
      },
    ]);
  });

  it("uses requested competitor count for prompt, schema, cache, and result limit", async () => {
    const cache = createCache();
    const calls: unknown[] = [];
    const service = createService({
      cache,
      openai: {
        parse: async (args: unknown) => {
          calls.push(args);

          return {
            parsed: {
              competitors: Array.from({ length: 35 }, (_, index) => ({
                domain: `competitor-${index + 1}.com`,
              })),
            },
          };
        },
      },
    });

    (
      service as unknown as {
        enrichProfile: (domain: string) => Promise<TestProfile>;
      }
    ).enrichProfile = async () => ({
      name: "Cloviana",
      description: "AI visibility platform",
      icp: "SaaS marketing teams",
      category: "AI search visibility software",
    });

    const defaultResult = await service.findCompetitors("cloviana.com");
    const auditResult = await service.findCompetitors("cloviana.com", 30);

    assert.equal(defaultResult.length, 8);
    assert.equal(auditResult.length, 30);
    assert.notEqual(cache.keys[0], cache.keys[1]);
    assert.match(cache.keys[0], /"count":8/);
    assert.match(cache.keys[1], /"count":30/);

    const [defaultCall, auditCall] = calls as Array<{
      schema: { parse: (value: unknown) => unknown };
      input: Array<{ role: string; content: string }>;
    }>;

    assert.match(defaultCall.input[0].content, /exactly 8/);
    assert.match(auditCall.input[0].content, /exactly 30/);
    assert.doesNotThrow(() =>
      defaultCall.schema.parse({
        competitors: Array.from({ length: 8 }, (_, index) => ({
          domain: `default-${index + 1}.com`,
        })),
      }),
    );
    assert.throws(() =>
      defaultCall.schema.parse({
        competitors: Array.from({ length: 30 }, (_, index) => ({
          domain: `audit-${index + 1}.com`,
        })),
      }),
    );
    assert.doesNotThrow(() =>
      auditCall.schema.parse({
        competitors: Array.from({ length: 30 }, (_, index) => ({
          domain: `audit-${index + 1}.com`,
        })),
      }),
    );
  });
});
