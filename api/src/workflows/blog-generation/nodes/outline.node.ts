import path from "path";
import { fileURLToPath } from "url";
import { RunnableConfig } from "@langchain/core/runnables";
import pLimit from "p-limit";
import { z } from "zod";

import { GroqClient } from "@/clients/groq/groq.client";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { JobsService } from "@/modules/jobs/jobs.service";
import { EditsSchema } from "@/workflows/blog-generation/schemas/edits.schema";
import {
  ImageSchema,
  Outline,
  OutlineSchema,
  TODO,
  createOutlineSkeleton,
  getOutlineSchemaForTemplateId,
} from "@/workflows/blog-generation/schemas/outline";
import { applyTodoEdits } from "@/workflows/blog-generation/utils/apply-todo-edits.util";
import { buildImagePrompt } from "@/workflows/blog-generation/utils/build-image-prompt.util";
import { computePercent } from "@/workflows/blog-generation/utils/compute-percent.util";
import { findSecondaryKeywordUsage } from "@/workflows/blog-generation/utils/find-secondary-keyword-usage.util";
import { findTodoPaths } from "@/workflows/blog-generation/utils/find-todo-paths.util";
import { generateImage } from "@/workflows/blog-generation/utils/generate-image.util";
import { StateAnnotation } from "../blog-generation.state";

type ImageRef = z.infer<typeof ImageSchema>;
type OutlineSection = Outline["sections"][number];
type Context = (typeof StateAnnotation.State)["_context"];

type Repair = {
  path: string;
  note: string;
};

function hasContextualImage(
  section: OutlineSection,
): section is OutlineSection & { contextualImage: ImageRef } {
  return "contextualImage" in section && !!(section as any).contextualImage;
}

function toReferenceImageUrls(
  referencedAssetIds: ImageRef["referencedAssetIds"],
  context: Context,
): string[] {
  if (!referencedAssetIds?.length) return [];

  const products = context.referenceMaterial?.products ?? [];
  const urls = referencedAssetIds
    .map((id) => products.find((p) => p.id === id)?.imageUrl)
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  return Array.from(new Set(urls)).slice(0, 3);
}

const editablePaths = [
  "title",
  "metaData.description",
  "thumbnail.sceneDescription",
  "thumbnail.altText",

  "sections.*.goal",
  "sections.*.heading",

  "sections.*.blocks.*.goal",
  "sections.*.blocks.*.points.*",

  "sections.*.commerceHookIds",

  "sections.*.keywords",

  "sections.*.subsections.*.estimatedWordCount",
  "sections.*.subsections.*.goal",
  "sections.*.subsections.*.blocks.*.goal",
  "sections.*.subsections.*.blocks.*.points.*",

  "sections.*.contextualImage.sceneDescription",
  "sections.*.contextualImage.altText",
];

export async function outline(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const storage = configurable?.storage as StorageService | undefined;
  const jobs = configurable?.jobs as JobsService | undefined;
  const jobId = configurable?.jobId as string | undefined;
  if (!jobs) throw new Error("jobs service not provided");
  if (!jobId) throw new Error("jobId not provided");
  if (!storage) throw new Error("Storage service not provided");

  const percent = computePercent({
    phase: "outline",
    prevPercent: state._progressPercent ?? 0,
  });

  await jobs.setRuntime(jobId, {
    percent,
    title: "Building outline",
  });

  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts",
  );

  const templateId = state._strategy.templateId;

  const outlineSkeleton =
    templateId === "comparison"
      ? createOutlineSkeleton({
          templateId: "comparison",
          thumbnailReferencedAssetIds: null,
          totalWordCount: state._context.core.wordCount,
          featuredProductReferencedAssetIds: state._strategy.featuredProductIds,
          seo: { primaryKeyword: state._context.seo.primaryKeyword },
        })
      : createOutlineSkeleton({
          templateId: "problem-solution",
          totalWordCount: state._context.core.wordCount,
          thumbnailReferencedAssetIds: [state._strategy.featuredProductId],
          productRecommendationReferencedAssetId:
            state._strategy.featuredProductId,
          seo: { primaryKeyword: state._context.seo.primaryKeyword },
        });

  const prompt = await loadPromptHbs(
    "nodes/outline",
    { metadata: { contentType: templateId } },
    {
      baseDir,
      partialsDir: baseDir,
      helpers: { concat: (...args: any[]) => args.slice(0, -1).join("") },
    },
  );

  const strictSchema = getOutlineSchemaForTemplateId(templateId);
  const outlineJsonSchema = z.toJSONSchema(strictSchema);

  const groq = new GroqClient();

  const start = Date.now();

  let merged = outlineSkeleton;
  let repairs: Repair[] = [];

  const secondaryKeywords = state._context.seo.secondaryKeywords ?? [];
  const primaryKeyword = state._context.seo.primaryKeyword;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    console.debug(`[outline] attempt ${attempt + 1}: invoking base model`);

    const { edits } = await groq.chatJson<z.infer<typeof EditsSchema>>({
      name: "outline_edits",
      schema: EditsSchema,
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: JSON.stringify({
            context: state._context,
            strategy: state._strategy,
            skeleton: merged,
            todoToken: TODO,
            editablePaths,
            outputFormat: {
              returnType: "edits_only",
              outlineJsonSchema,
            },
            repairs,
          }),
        },
      ],
      temperature: 0,
      reasoningEffort: "low",
    });

    console.debug(`[outline] attempt ${attempt + 1}: edits returned`, {
      editCount: edits.length,
    });

    const safeEdits = edits.filter((e) => {
      if (e.op === "set" && e.value === primaryKeyword) return false;
      if (e.op === "push") {
        const vals = Array.isArray(e.value) ? e.value : [e.value];
        if (vals.includes(primaryKeyword)) return false;
      }
      return true;
    });

    merged = applyTodoEdits({
      skeleton: merged,
      edits: safeEdits,
      editablePaths,
      todoToken: TODO,
    });

    const todoPaths = findTodoPaths(merged);
    const usage = findSecondaryKeywordUsage(merged, secondaryKeywords);
    const missingSecondary = usage
      .filter((x) => x.count === 0)
      .map((x) => x.keyword);
    const overusedSecondary = usage.filter((x) => x.count > 1);

    console.debug(`[outline] attempt ${attempt + 1}: convergence check`, {
      todoCount: todoPaths.length,
      missingSecondaryCount: missingSecondary.length,
      overusedSecondaryCount: overusedSecondary.length,
    });

    if (
      todoPaths.length === 0 &&
      missingSecondary.length === 0 &&
      overusedSecondary.length === 0
    ) {
      console.debug(`[outline] converged on attempt ${attempt + 1}`);
      break;
    }

    const todoRepairs: Repair[] = todoPaths.map((path) => ({
      path,
      note: "This field is still TODO. Fill it with a concrete, specific value.",
    }));

    const missingRepairs: Repair[] = missingSecondary.map((keyword) => ({
      path: "sections.*.keywords",
      note: `This secondary keyword is missing. Place "${keyword}" exactly once in the single most relevant sections.*.keywords array.`,
    }));

    const overusedRepairs: Repair[] = overusedSecondary.map(
      ({ keyword, count }) => ({
        path: "sections.*.keywords",
        note: `This secondary keyword appears ${count} times. Adjust sections.*.keywords so that "${keyword}" appears exactly once in total, removing extra occurrences as needed.`,
      }),
    );

    repairs = [...todoRepairs, ...missingRepairs, ...overusedRepairs];

    console.debug(`[outline] attempt ${attempt + 1}: requesting repairs`, {
      repairCount: repairs.length,
    });
  }

  console.debug(`[outline] strict validation`);

  const outline = OutlineSchema.parse(merged);

  /*
  outline.thumbnail.url =
    "https://cloviana-media-dev-f8b6ajcdbudyfxef.z01.azurefd.net/uploads/blogs/85bc1da3-d010-43e3-8621-2a999466f205/thumbnail.png";
  for (const section of outline.sections) {
    if (section.role === "product-a-analysis" || section.role === "problem")
      section.contextualImage.url =
        "https://cloviana-media-dev-f8b6ajcdbudyfxef.z01.azurefd.net/uploads/blogs/85bc1da3-d010-43e3-8621-2a999466f205/sections/product-a-analysis.png";
    if (
      section.role === "product-b-analysis" ||
      section.role === "product-recommendation"
    )
      section.contextualImage.url =
        "https://cloviana-media-dev-f8b6ajcdbudyfxef.z01.azurefd.net/uploads/blogs/85bc1da3-d010-43e3-8621-2a999466f205/sections/product-b-analysis.png";
  }
  */
  const limit = pLimit(4);
  const tasks: Promise<void>[] = [];

  for (const section of outline.sections) {
    if (!hasContextualImage(section)) continue;

    const ctx = section.contextualImage;
    const imagePrompt = buildImagePrompt({ image: ctx });

    tasks.push(
      limit(async () => {
        const referencedImageUrls = toReferenceImageUrls(
          ctx.referencedAssetIds,
          state._context,
        );

        const url = await generateImage({
          prompt: imagePrompt,
          referencedImageUrls,
          destination: {
            storage,
            path: `blogs/${state._blogId}/sections/${section.sectionId}.png`,
          },
        });

        section.contextualImage.url = url;
      }),
    );
  }

  if (outline.thumbnail) {
    const ctx = outline.thumbnail;

    tasks.push(
      limit(async () => {
        const referencedImageUrls = toReferenceImageUrls(
          ctx.referencedAssetIds,
          state._context,
        );
        const imagePrompt = buildImagePrompt({ image: ctx });

        const url = await generateImage({
          prompt: imagePrompt,
          referencedImageUrls,
          quality: "high",
          destination: {
            storage,
            path: `blogs/${state._blogId}/thumbnail.png`,
          },
        });

        outline.thumbnail.url = url;
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    console.warn(`[outline] ${failures.length} image tasks failed`, failures);
  }

  const durationMs = Date.now() - start;

  console.debug("[outline] generated", {
    blogId: state._blogId,
    templateId,
    sectionCount: outline.sections.length,
    durationMs,
    preview: {
      title: outline.title,
      roles: outline.sections.map((s) => s.role),
    },
  });

  return { _outline: outline, _progressPercent: percent };
}
