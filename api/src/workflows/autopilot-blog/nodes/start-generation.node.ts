import { SmtpService } from "@/clients/smtp/smtp.service";
import { BlogsService } from "@/modules/blogs/services/blogs.service";
import { BlogGenerationWorkflow } from "@/workflows/blog-generation/blog-generation.workflow";
import { RunnableConfig } from "@langchain/core/runnables";
import { PrismaClient } from "@prisma/client";
import { StateAnnotation } from "../autopilot-blog.state";

export async function startGeneration(
  state: typeof StateAnnotation.State,
  { configurable }: RunnableConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  const prisma = configurable?.prisma as PrismaClient | undefined;
  if (!prisma) throw new Error("Prisma client not provided");
  const blogs = configurable?.blogs as BlogsService | undefined;
  if (!blogs) throw new Error("blogs service not provided");
  const blogGeneration = configurable?.blogGeneration as
    | BlogGenerationWorkflow
    | undefined;
  if (!blogGeneration) throw new Error("blog generation workflow not provided");
  const smtp = configurable?.smtp as SmtpService | undefined;
  if (!smtp) throw new Error("smtp service not provided");
  if (!state._blogId) throw new Error("blogId not found in state");

  const blog = await prisma.blog.findUniqueOrThrow({
    where: { id: state._blogId },
    select: {
      id: true,
      title: true,
      storeId: true,
    },
  });

  const settings = await prisma.autopilotSettings.findUnique({
    where: { storeId: blog.storeId },
    select: { blog: { select: { autoPublish: true } } },
  });

  const store = await prisma.store.findUnique({
    where: { id: blog.storeId },
    select: {
      name: true,
      owner: { select: { email: true, contactEmail: true } },
    },
  });

  const recipient = store?.owner?.contactEmail ?? store?.owner?.email ?? null;

  await blogGeneration.run(blog.id);

  if (settings?.blog?.autoPublish) {
    await blogs.publishToShopify(blog.id);
  }

  if (recipient) {
    const published = !!settings?.blog?.autoPublish;
    const statusLine = published
      ? "Your blog post has been published."
      : "Your blog draft is ready for review.";

    try {
      await smtp.sendMail({
        to: recipient,
        subject: "Your Cloviana blog update",
        text: `Hello,\n\n${statusLine}\n\nCloviana generated ${blog.title} for ${store?.name}.\n\n— Cloviana`,
        html: `<p>Hello,</p><p>${statusLine}</p><p>Cloviana generated ${blog.title} for ${store?.name}.</p><p>— Cloviana</p>`,
      });
    } catch (err: any) {
      console.warn(
        `[cloviana] Failed to send blog notification email: ${String(
          err?.message ?? err,
        )}`,
      );
    }
  }

  return {};
}
