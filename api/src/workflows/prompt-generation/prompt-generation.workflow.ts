import { AnthropicService } from "@/clients/anthropic/anthropic.service";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { Injectable, Logger } from "@nestjs/common";
import { graph } from "./prompt-generation.graph";
import type { PromptGenerationInput } from "./prompt-generation.types";

@Injectable()
export class PromptGenerationWorkflow {
  private readonly logger = new Logger(PromptGenerationWorkflow.name);

  constructor(
    private readonly exa: ExaService,
    private readonly groq: GroqService,
    private readonly openai: OpenAIService,
    private readonly anthropic: AnthropicService,
  ) {}

  async run(input: PromptGenerationInput) {
    const { businessId, competitors, extraContext = [], profile } = input;

    this.logger.log(`Starting prompt generation for businessId=${businessId}`);

    const result = await graph.invoke(
      {
        _businessId: businessId,
        competitors,
        extraContext,
        profile,
      },
      {
        configurable: {
          exa: this.exa,
          groq: this.groq,
          openai: this.openai,
          anthropic: this.anthropic,
          logger: this.logger,
        },
      },
    );

    this.logger.log(
      `Completed prompt generation for businessId=${businessId} promptCount=${result.prompts.length}`,
    );

    return {
      businessId,
      promptUniverse: result.promptUniverse,
    };
  }
}
