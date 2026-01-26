import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { TemplateIdSchema } from "@/workflows/blog-generation/schemas/roles.schema";
import { StateAnnotation } from "../blog-generation.state";

import {
  ContentStrategySchema,
  TODO,
  createStrategySkeleton,
  getStrategySchemaForTemplateId,
} from "@/workflows/blog-generation/schemas/strategy.schema";

import { GroqClient } from "@/clients/groq/groq.client";
import { JobsService } from "@/modules/jobs/jobs.service";
import { EditsSchema } from "@/workflows/blog-generation/schemas/edits.schema";
import { applyTodoEdits } from "@/workflows/blog-generation/utils/apply-todo-edits.util";
import { computePercent } from "@/workflows/blog-generation/utils/compute-percent.util";
import { findTodoPaths } from "@/workflows/blog-generation/utils/find-todo-paths.util";
import { RunnableConfig } from "@langchain/core/runnables";

type Repair = {
  path: string;
  note: string;
};

const editablePaths = [
  "audience.persona",
  "audience.sophistication",
  "audience.painPoints.*",
  "audience.primaryObjections.*",

  "keyMessage",

  "commerceHooks.*.featureToHighlight",
  "commerceHooks.*.benefitToEmphasize",
  "commerceHooks.*.objectionToAddress",
  "commerceHooks.*.ctaStyle",

  "comparison.axisType",
  "comparison.decisionHinge",
  "comparison.optionA",
  "comparison.optionB",
  "comparison.sharedBaselineFocus",
  "comparison.decisionLenses",
];

function getPrimaryProductId(products: { id: string }[]) {
  if (products.length < 1) {
    throw new Error("Strategy requires at least 1 product");
  }
  return products[0].id;
}

function getComparisonProductIds(products: { id: string }[]) {
  if (products.length < 1) {
    throw new Error("Comparison strategy requires at least 1 products");
  }
  return products.slice(0, 2).map((p) => p.id);
}

export async function strategy(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const jobs = configurable?.jobs as JobsService | undefined;
  const jobId = configurable?.jobId as string | undefined;
  if (!jobs) throw new Error("jobs service not provided");
  if (!jobId) throw new Error("jobId not provided");

  const percent = computePercent({
    phase: "strategy",
    prevPercent: state._progressPercent ?? 0,
  });

  await jobs.setRuntime(jobId, {
    percent,
    title: "Planning content",
  });

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const templateId = TemplateIdSchema.parse(state._context.core.contentType);
  const products = state._context.referenceMaterial.products;

  const prompt = await loadPromptHbs(
    "nodes/strategy",
    { metadata: { contentType: templateId } },
    {
      baseDir,
      partialsDir: baseDir,
      helpers: { concat: (...args: any[]) => args.slice(0, -1).join("") },
    },
  );

  const skeleton =
    templateId === "comparison"
      ? (() => {
          const featuredProductIds = getComparisonProductIds(products);
          return createStrategySkeleton({
            templateId: "comparison",
            featuredProductIds,
          });
        })()
      : (() => {
          const featuredProductId = getPrimaryProductId(products);
          return createStrategySkeleton({
            templateId: "problem-solution",
            featuredProductId,
          });
        })();

  const schemaForTemplate = getStrategySchemaForTemplateId(templateId);
  const strategyJsonSchema = z.toJSONSchema(schemaForTemplate);

  const groq = new GroqClient();

  const start = Date.now();

  let merged = skeleton;
  let repairs: Repair[] = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { edits } = await groq.chatJson<z.infer<typeof EditsSchema>>({
      name: "strategy_edits",
      schema: EditsSchema,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            context: state._context,
            strategySkeleton: merged,
            todoToken: TODO,
            editablePaths,
            outputFormat: {
              returnType: "edits_only",
              strategyJsonSchema,
            },
            repairs,
          }),
        },
      ],
      temperature: 0.1,
      topP: 0.9,
      reasoningEffort: "low",
    });

    merged = applyTodoEdits({
      skeleton: merged,
      edits,
      editablePaths,
      todoToken: TODO,
    });

    const remainingTodos = findTodoPaths({
      value: merged,
      todoToken: TODO,
    });

    if (remainingTodos.length === 0) break;

    repairs = remainingTodos.map((path) => ({
      path,
      note: "This field is still TODO. Fill it with a concrete, specific value.",
    }));
  }

  const parsed = ContentStrategySchema.parse(merged);

  const durationMs = Date.now() - start;

  console.debug("[strategy] generated", {
    blogId: state._blogId,
    templateId,
    durationMs,
    preview: {
      audience: parsed.audience,
      primaryGoal: parsed.primaryGoal,
    },
  });

  return { _strategy: parsed, _progressPercent: percent };
}
