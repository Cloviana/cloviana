import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../blog-generation.state";
import { Context } from "../schemas/context.schema"; 

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    include: { store: true, products: true, collections: true },
  });

  const _context: Context = {
    core: {
      topic: blog.topic!,
      wordCountRange: {
        min: 600,
        max: 800,
      },
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
        id: p.id
      })),
      collections: blog.collections.map((c) => ({
        title: c.title!,
        description: c.description!,
        url: c.url!,
        imageUrl: c.imageUrl || undefined,
        id: c.id
      })),
    },
  };

  console.log(JSON.stringify(_context));

  return {
    _context,
  };
}