import { JobsService } from "@/modules/jobs/jobs.service";
import { computePercent } from "@/workflows/blog-generation/utils/compute-percent.util";
import { RunnableConfig } from "@langchain/core/runnables";
import { Cache } from "@nestjs/cache-manager";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../blog-generation.state";
import { Context } from "../schemas/context.schema";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const jobs = configurable?.jobs as JobsService | undefined;
  const jobId = configurable?.jobId as string | undefined;
  if (!jobs) throw new Error("jobs service not provided");
  if (!jobId) throw new Error("jobId not provided");

  const percent = computePercent({
    phase: "initialize",
    prevPercent: state._progressPercent ?? 0,
  });

  await jobs.setRuntime(jobId, {
    percent,
    title: "Initializing",
  });

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    include: { store: true, products: true },
  });

  const _context: Context = {
    core: {
      topic: blog.topic!,
      contentType:
        blog.contentType! === "PROBLEM_SOLUTION"
          ? "problem-solution"
          : "comparison",
      wordCount: 800,
    },
    seo: {
      primaryKeyword: blog.primaryKeyword!,
      secondaryKeywords: blog.secondaryKeywords || [],
    },
    brand: {
      name: blog.store.name,
      description: blog.store.description!,
      voice: blog.brandVoice!,
    },
    referenceMaterial: {
      products: blog.products.map((p) => ({
        title: p.title!,
        description: p.description!,
        url: p.url!,
        imageUrl: p.imageUrl || undefined,
        id: p.id,
      })),
    },
  };

  console.debug("[initialize] context loaded", {
    blogId: state._blogId,
    templateId: _context.core.contentType,
    preview: {
      topic: _context.core.topic,
      primaryKeyword: _context.seo.primaryKeyword,
      products: _context.referenceMaterial.products.length,
    },
  });

  return {
    _context,
    _progressPercent: percent,
  };
}
