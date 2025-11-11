import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../blog-generation.state";
import { PrismaClient } from "@prisma/client";

export async function initialize(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient;
  if (!prisma) throw new Error("Prisma client not provided");

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    include: { store: true, products: true },
  });

  return {
    _metadata: {
      topic: blog.topic!,
      primaryKeyword: blog.primaryKeyword!,
      secondaryKeywords: blog.secondaryKeywords!,
      products: blog.products.map((product) => ({
        url: product?.onlineStoreUrl ?? product?.onlineStorePreviewUrl,
        title: product.title!,
        description: product.description!,
      })),
      additionalInstruction: blog.additionalInstruction,
      brandVoice: blog.brandVoice,

      brandName: blog.store.name,
      brandDescription: blog.store.description!,
      blogLength: {
        min: 600,
        max: 800,
      },
    },
  };
}

/*
return {
    _metadata: {
      title: "Lustrao Scalp Therapy Set — Transform Your Hair Growth Routine",
      topic: "Hair Care & Regrowth",
      primaryKeyword: "scalp therapy set",
      secondaryKeywords: ["hair regrowth oil", "scalp massager brush", "hair fall solution", "natural hair growth"],
      product: {
        url: "https://lustrao.com/collections/hair-growth-kits/products/circulation-boost-duo",
        title: "Lustrao Scalp Therapy Set (Hair Regrowth Oil + Scalp Massager Brush)",
        description:
          "Elevate your scalp care with the Lustrao Scalp Therapy Set — a dynamic duo designed to reduce hair fall, improve scalp health, and boost natural hair regrowth. Featuring our powerful Hair Regrowth Oil and ergonomic Scalp Massager Brush, this kit turns your daily routine into a relaxing, growth-stimulating ritual.",
      },
      additionalInstruction: "Keep tone warm, engaging, and informative.",
      brandVoice: "Empowering and expert, with a wellness focus.",
      brandName: "Lustrao",
      brandDescription: "Lustrao is a premium hair wellness brand dedicated to creating science-backed, nature-powered solutions for healthy, vibrant hair.",
      blogLength: {
        min: 600,
        max: 800,
      },
    },
  };
*/
