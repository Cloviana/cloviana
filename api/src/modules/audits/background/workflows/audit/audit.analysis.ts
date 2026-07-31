import path from "node:path";
import { fileURLToPath } from "node:url";
import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { normalizeDomain } from "@/common/utils/normalize-domain.util";
import { extractMentions } from "@/common/visibility/extract-mentions";
import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import {
  type AuditInput,
  type AuditPrompt,
  type BusinessProfile,
  CONTENT_TYPES,
  type ContentIdea,
  type EngineResult,
  type SentimentClaim,
  type SentimentResponse,
  type SentimentResult,
} from "./audit.types";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts",
);
const GeneratePromptsSchema = z.object({
  prompts: z.array(z.string()).length(8),
});
const SentimentPromptsSchema = z.object({
  prompts: z.array(z.string()).length(5),
});
const ClaimsSchema = z.object({
  claims: z.array(
    z.object({
      label: z.string(),
      sentiment: z.enum(["positive", "negative"]),
      responseId: z.string(),
      sourceText: z.string(),
    }),
  ),
});
const ContentIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        contentType: z.enum(CONTENT_TYPES),
        title: z.string(),
        overview: z.string(),
      }),
    )
    .length(4),
});

@Injectable()
export class AuditAnalysis {
  private readonly logger = new Logger(AuditAnalysis.name);

  constructor(
    private readonly anthropic: AnthropicService,
    private readonly groq: GroqService,
  ) {}

  async generatePrompts(profile: BusinessProfile): Promise<AuditPrompt[]> {
    const system = await loadPromptHbs(
      "generate-prompts",
      {},
      { baseDir: PROMPT_DIRECTORY },
    );
    const result = await this.anthropic.parse({
      schema: GeneratePromptsSchema,
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: `<domain>${profile.domain}</domain>\n<profile>\n  <category>${profile.category}</category>\n  <icp>${profile.icp}</icp>\n  <description>${profile.description}</description>\n  <name>${profile.name}</name>\n</profile>`,
        },
      ],
    });

    return result.prompts.map((text, index) => ({
      id: `prompt-${index + 1}`,
      text,
    }));
  }

  async generateSentimentPrompts(profile: BusinessProfile): Promise<string[]> {
    const system = await loadPromptHbs(
      "generate-sentiment-prompts",
      {
        brandName: profile.name,
        category: profile.category,
        icp: profile.icp,
      },
      { baseDir: PROMPT_DIRECTORY },
    );
    const result = await this.groq.parse({
      name: "generate-sentiment-prompts",
      schema: SentimentPromptsSchema,
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            brandName: profile.name,
            icp: profile.icp,
            category: profile.category,
          }),
        },
      ],
    });

    return result.prompts;
  }

  async addMentions(
    input: AuditInput,
    responses: EngineResult[],
  ): Promise<EngineResult[]> {
    const brands = [
      { name: input.profile.name, domain: input.profile.domain },
      ...input.competitors.map(({ name, domain }) => ({ name, domain })),
    ];
    const brandNameByDomain = new Map(
      brands.map((brand) => [brand.domain, brand.name]),
    );

    return Promise.all(
      responses.map(async (response) => {
        if (!response.text) {
          return response;
        }

        try {
          const domains = await extractMentions(
            this.groq,
            response.text,
            brands,
          );

          return {
            ...response,
            mentions: domains.map((domain) => ({
              domain,
              name: brandNameByDomain.get(domain) ?? domain,
            })),
          };
        } catch (error) {
          this.logger.warn(
            `Mention extraction failed engine=${response.engine} promptId=${response.promptId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          return response;
        }
      }),
    );
  }

  async analyzeSentiment(
    profile: BusinessProfile,
    responses: SentimentResponse[],
  ): Promise<SentimentResult> {
    const nonEmptyResponses = responses.filter((response) => response.text);
    if (nonEmptyResponses.length === 0) {
      return {
        positivePercent: 0,
        negativePercent: 0,
        claims: [],
        responses,
      };
    }

    const claimsPerResponse = await Promise.all(
      nonEmptyResponses.map(async (response) => {
        const prompt = await loadPromptHbs(
          "extract-claims",
          {
            brandName: profile.name,
            id: response.id,
            prompt: response.prompt,
            text: response.text,
          },
          { baseDir: PROMPT_DIRECTORY },
        );
        const result = await this.groq.parse({
          name: "extract-claims",
          schema: ClaimsSchema,
          model: "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
        });

        return result.claims;
      }),
    );
    const claims: SentimentClaim[] = claimsPerResponse.flat();
    const positiveCount = claims.filter(
      (claim) => claim.sentiment === "positive",
    ).length;
    const positivePercent =
      claims.length > 0 ? Math.round((positiveCount / claims.length) * 100) : 0;

    return {
      positivePercent,
      negativePercent: claims.length > 0 ? 100 - positivePercent : 0,
      claims,
      responses,
    };
  }

  async generateContentIdeas(
    input: AuditInput,
    responses: EngineResult[],
  ): Promise<ContentIdea[]> {
    const targetDomain =
      normalizeDomain(input.profile.domain) ?? input.profile.domain;
    const missedPrompts = [
      ...new Set(
        responses
          .filter(
            (response) =>
              !response.mentions.some(
                (mention) =>
                  (normalizeDomain(mention.domain) ?? mention.domain) ===
                  targetDomain,
              ),
          )
          .map((response) => response.prompt),
      ),
    ].slice(0, 10);
    const system = await loadPromptHbs(
      "generate-content-ideas",
      {},
      { baseDir: PROMPT_DIRECTORY },
    );
    const result = await this.groq.parse({
      name: "generate-content-ideas",
      schema: ContentIdeasSchema,
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            brandName: input.profile.name,
            domain: input.profile.domain,
            category: input.profile.category,
            icp: input.profile.icp,
            missedPrompts,
          }),
        },
      ],
    });

    return result.ideas;
  }
}
