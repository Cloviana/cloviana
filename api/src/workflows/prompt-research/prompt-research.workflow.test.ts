import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PromptResearchWorkflow } from "./prompt-research.workflow";

const input = {
  brand: "ReplyFlow",
  category: "customer support software",
  description:
    "AI customer support software for Shopify ecommerce brands that automates repetitive support work and helps teams reduce ticket volume.",
  icp: "Shopify ecommerce brands doing $1M-$20M ARR",
  competitors: ["Gorgias", "Zendesk", "Richpanel"],
};

describe("PromptResearchWorkflow", () => {
  it("runs the full pipeline and returns prompts without internal state leaks", async () => {
    const textDocument = {
      url: "https://reddit.com/r/shopify/comments/support-tools",
      title: "Support tools for Shopify",
      content: "Gorgias gets expensive as ticket volume grows.",
    };
    const highlightsDocument = {
      url: "https://example.com/recharge-support",
      title: "Recharge support context",
      content:
        "Subscription brands need support tools that show Recharge data.",
    };

    const groq = {
      parse: async (args: {
        name: string;
        messages: Array<{ role: string; content: string }>;
      }) => {
        const payload = JSON.parse(args.messages.at(-1)?.content ?? "{}");

        if (args.name === "generate-queries") {
          return {
            queries: Array.from({ length: 12 }, (_, i) =>
              i === 0
                ? "shopify support software reddit"
                : `shopify support software query ${i}`,
            ),
          };
        }

        if (args.name === "extract-signals") {
          const document = payload.document as typeof textDocument;
          return {
            signals: [
              {
                snippet: document.content,
                insight: "Buyer is evaluating alternatives.",
                url: document.url,
              },
            ],
          };
        }

        if (args.name === "qualify-signals") {
          return {
            qualifications: (
              payload.signals as Array<{ signalId: number }>
            ).map(({ signalId }) => ({ signalId, qualified: true })),
          };
        }

        if (args.name === "generate-prompts") {
          return {
            prompts: Array.from(
              { length: 5 },
              (_, i) => `what is the best shopify helpdesk option ${i}`,
            ),
          };
        }

        if (args.name === "classify-prompts") {
          const stages = ["EXPLORE", "EVALUATE", "DECIDE"] as const;
          return {
            classifications: (
              payload.prompts as Array<{ promptId: number }>
            ).map(({ promptId }, i) => ({
              promptId,
              stage: stages[i % 3],
            })),
          };
        }

        if (args.name === "score-prompts") {
          return {
            scores: (payload.prompts as Array<{ promptId: number }>).map(
              ({ promptId }) => ({ promptId, score: 80 }),
            ),
          };
        }

        throw new Error(`Unexpected Groq call: ${args.name}`);
      },
    };

    const exa = {
      search: async (query: string) => {
        if (query === "shopify support software reddit") {
          return {
            results: [
              {
                url: textDocument.url,
                title: textDocument.title,
                text: textDocument.content,
              },
            ],
          };
        }
        return {
          results: [
            {
              url: highlightsDocument.url,
              title: highlightsDocument.title,
              highlights: [highlightsDocument.content],
            },
          ],
        };
      },
    };

    const openai = {
      embed: async (texts: string[]) =>
        texts.map((_, i) => {
          const vec = new Array(texts.length).fill(0);
          vec[i] = 1;
          return vec;
        }),
      parse: async (args: { schema: { parse: (v: unknown) => unknown } }) => {
        // Fill prompt generation — return a small set of prompts
        return args.schema.parse({ prompts: ["fill prompt 1"] });
      },
    };

    const workflow = new PromptResearchWorkflow(
      groq as never,
      openai as never,
      exa as never,
    );
    const result = await workflow.run(input);
    const resultJson = JSON.stringify(result);

    assert.ok(result.prompts.length > 0);
    assert.ok(result.prompts[0]?.prompt.length > 0);
    assert.ok(result.prompts[0]?.awarenessStage.length > 0);
    assert.ok(typeof result.prompts[0]?.active === "boolean");

    // No internal state leaks in the output
    assert.equal(resultJson.includes("businessContext"), false);
    assert.equal(resultJson.includes("documents"), false);
    assert.equal(resultJson.includes("signals"), false);
    assert.equal(resultJson.includes("promptCandidates"), false);
  });

  it("rejects invalid input", async () => {
    const workflow = new PromptResearchWorkflow(
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(() => workflow.run({ ...input, brand: "" }));
  });
});
