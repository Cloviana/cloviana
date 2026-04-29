import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { OpenAIService } from "@/clients/openai/openai.service";
import type { AppConfiguration } from "@/config/app.configuration";
import { ExaService } from "@/integrations/exa/exa.service";
import {
  type PromptResearchInput,
  PromptResearchInputSchema,
} from "@/workflows/prompt-research/prompt-research.schemas";
import { PromptResearchWorkflow } from "@/workflows/prompt-research/prompt-research.workflow";

const DEFAULT_INPUT: PromptResearchInput = {
  brand: "Rexi",
  category: "AI-powered reconciliation software",
  description:
    "Rexi is AI-powered reconciliation infrastructure for fintechs, neobanks, and payment companies. It connects financial systems, applies visual no-code rules, resolves exceptions with AI, and helps teams reconcile and close faster.",
  icp: "Fintechs, neobanks, and payment companies that need to reconcile transactions across payment processors, banks, ERPs, and accounting systems with higher accuracy and less manual finance work.",
  competitors: ["FloQast", "BlackLine", "Numeric", "Adra"],
};

function getInput(): PromptResearchInput {
  if (!process.env.PROMPT_RESEARCH_INPUT) {
    return DEFAULT_INPUT;
  }

  return PromptResearchInputSchema.parse(
    JSON.parse(process.env.PROMPT_RESEARCH_INPUT),
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

async function main() {
  requireEnv("GROQ_API_KEY");
  requireEnv("OPENAI_API_KEY");
  const exaApiKey = requireEnv("EXA_API_KEY");

  const input = getInput();
  const config = { exaApiKey } as AppConfiguration;
  const groq = new GroqService(config as AppConfiguration);
  const openai = new OpenAIService(config);
  const exa = new ExaService(config);
  const workflow = new PromptResearchWorkflow(groq, openai, exa);

  console.log("Running prompt research workflow with input:");
  console.log(JSON.stringify(input, null, 2));

  const result = await workflow.run(input);

  console.log("\nPrompt research result:");
  console.log(JSON.stringify(result.prompts, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
