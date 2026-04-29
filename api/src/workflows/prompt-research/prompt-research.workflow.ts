import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { Injectable } from "@nestjs/common";
import { classifyPrompts } from "./prompt-research.classification";
import { collectResearchDocuments } from "./prompt-research.collection";
import { deduplicatePrompts } from "./prompt-research.deduplication";
import { extractSignals } from "./prompt-research.extraction";
import { generatePrompts } from "./prompt-research.generation";
import {
  ClassifiedPromptsSchema,
  type PromptResearchInput,
  PromptResearchInputSchema,
  type PromptResearchResult,
  PromptResearchResultSchema,
  PromptSelectionResultSchema,
  ResearchCollectionSchema,
  ScoredPromptsSchema,
  SignalExtractionSchema,
  UnclassifiedPromptCollectionSchema,
} from "./prompt-research.schemas";
import { scorePrompts } from "./prompt-research.scoring";
import { selectPrompts } from "./prompt-research.selection";

@Injectable()
export class PromptResearchWorkflow {
  private readonly promptsBaseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "prompts",
  );

  constructor(
    private readonly groq: GroqService,
    private readonly openai: OpenAIService,
    private readonly exa: ExaService,
  ) {}

  async run(input: PromptResearchInput): Promise<PromptResearchResult> {
    const workflowInput = PromptResearchInputSchema.parse(input);
    const workflow = this.createMastraWorkflow();
    const run = await workflow.createRun();

    const unwatch = run.watch((event) => {
      console.log(
        "[prompt-research]",
        inspect(event, { depth: 6, maxArrayLength: 1, colors: true }),
      );
    });

    try {
      const result = await run.start({ inputData: workflowInput });

      if (result.status !== "success") {
        throw new Error(
          `Prompt research workflow failed with status ${result.status}`,
        );
      }

      return PromptResearchResultSchema.parse({
        prompts: result.result.prompts,
      });
    } finally {
      unwatch();
    }
  }

  private createMastraWorkflow() {
    const collectResearchDocumentsStep = createStep({
      id: "collect-research",
      inputSchema: PromptResearchInputSchema,
      outputSchema: ResearchCollectionSchema,
      execute: async ({ inputData }) => {
        const documents = await collectResearchDocuments({
          groq: this.groq,
          exa: this.exa,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData,
        });

        return ResearchCollectionSchema.parse({
          businessContext: inputData,
          documents,
        });
      },
    });

    const extractSignalsStep = createStep({
      id: "extract-signals",
      inputSchema: ResearchCollectionSchema,
      outputSchema: SignalExtractionSchema,
      execute: async ({ inputData }) => {
        const signals = await extractSignals({
          groq: this.groq,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData.businessContext,
          documents: inputData.documents,
        });

        return SignalExtractionSchema.parse({
          businessContext: inputData.businessContext,
          signals,
        });
      },
    });

    const generatePromptsStep = createStep({
      id: "generate-prompts",
      inputSchema: SignalExtractionSchema,
      outputSchema: UnclassifiedPromptCollectionSchema,
      execute: async ({ inputData }) => {
        const prompts = await generatePrompts({
          groq: this.groq,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData.businessContext,
          signals: inputData.signals,
        });

        return UnclassifiedPromptCollectionSchema.parse({
          businessContext: inputData.businessContext,
          prompts,
        });
      },
    });

    const deduplicatePromptsStep = createStep({
      id: "deduplicate-prompts",
      inputSchema: UnclassifiedPromptCollectionSchema,
      outputSchema: UnclassifiedPromptCollectionSchema,
      execute: async ({ inputData }) => {
        const prompts = await deduplicatePrompts({
          openai: this.openai,
          promptCandidates: inputData.prompts,
        });

        return UnclassifiedPromptCollectionSchema.parse({
          businessContext: inputData.businessContext,
          prompts,
        });
      },
    });

    const classifyPromptsStep = createStep({
      id: "classify-prompts",
      inputSchema: UnclassifiedPromptCollectionSchema,
      outputSchema: ClassifiedPromptsSchema,
      execute: async ({ inputData }) => {
        const promptCandidates = await classifyPrompts({
          groq: this.groq,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData.businessContext,
          prompts: inputData.prompts,
        });

        return ClassifiedPromptsSchema.parse({
          businessContext: inputData.businessContext,
          promptCandidates,
        });
      },
    });

    const scorePromptsStep = createStep({
      id: "score-prompts",
      inputSchema: ClassifiedPromptsSchema,
      outputSchema: ScoredPromptsSchema,
      execute: async ({ inputData }) => {
        const scoredCandidates = await scorePrompts({
          groq: this.groq,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData.businessContext,
          promptCandidates: inputData.promptCandidates,
        });

        return ScoredPromptsSchema.parse({
          businessContext: inputData.businessContext,
          promptCandidates: scoredCandidates,
        });
      },
    });

    const selectPromptsStep = createStep({
      id: "select-prompts",
      inputSchema: ScoredPromptsSchema,
      outputSchema: PromptSelectionResultSchema,
      execute: async ({ inputData }) => {
        const prompts = await selectPrompts({
          groq: this.groq,
          openai: this.openai,
          promptsBaseDir: this.promptsBaseDir,
          businessContext: inputData.businessContext,
          scoredCandidates: inputData.promptCandidates,
        });

        return PromptSelectionResultSchema.parse({
          businessContext: inputData.businessContext,
          prompts,
        });
      },
    });

    return createWorkflow({
      id: "prompt-research",
      inputSchema: PromptResearchInputSchema,
      outputSchema: PromptSelectionResultSchema,
    })
      .then(collectResearchDocumentsStep)
      .then(extractSignalsStep)
      .then(generatePromptsStep)
      .then(deduplicatePromptsStep)
      .then(classifyPromptsStep)
      .then(scorePromptsStep)
      .then(selectPromptsStep)
      .commit();
  }
}
