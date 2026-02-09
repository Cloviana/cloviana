import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  ArticleCreateInput,
  ArticleUpdateInput,
} from "@/clients/shopify/generated";
import { BlogsProducer } from "@/infrastructure/messaging/producers/blogs.producer";
import { StorageService } from "@/infrastructure/storage/storage.service";
import { ShopifyCatalogService } from "@/integrations/shopify/shopify-catalog.service";
import { lexicalJsonToNodes } from "@/modules/blogs/utils/lexical-json-to-nodes";
import { makeDedupeKey } from "@/utils/job.util";
import {
  BlogSetupStep,
  BlogStatus,
  JobStatus,
  JobType,
  Prisma,
} from "@prisma/client";
import {
  BLOG_DETAIL_SELECT,
  BLOG_SUMMARY_SELECT,
} from "../constants/selects.constants";
import { UpdateBlogDto } from "../dtos/update-blog.dto";
import { fromNodes } from "../utils/from-nodes";

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogsProducer: BlogsProducer,
    private readonly storage: StorageService,
    private readonly catalog: ShopifyCatalogService,
  ) {}

  async getBlogs(
    storeId: string,
    params: {
      limit?: number;
      cursor?: string;
      q?: string;
      status?: BlogStatus;
    },
  ) {
    const limit = Number(params.limit) || 20;

    const where: Prisma.BlogWhereInput = {
      storeId,
      currentStep: {
        equals: BlogSetupStep.COMPLETED,
      },
    };

    if (params.status) {
      where.status = params.status;
    }

    const q = params.q?.trim();
    if (q) {
      where.OR = [{ topic: { contains: q, mode: "insensitive" } }];
    }

    const blogs = await this.prisma.blog.findMany({
      where,
      select: BLOG_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = blogs.length > limit;
    const data = hasMore ? blogs.slice(0, limit) : blogs;
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data: data.map((b) => ({
        ...b,
        thumbnail: b.thumbnail && {
          ...b.thumbnail,
          srcUrl: this.storage.getCdnUrl(b.thumbnail.blobPath),
        },
      })),
      meta: {
        limit,
        nextCursor,
        hasMore,
      },
    };
  }
  async getBlog(blogId: string) {
    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      select: BLOG_DETAIL_SELECT,
    });

    return {
      ...blog,
      thumbnail: blog.thumbnail && {
        ...blog.thumbnail,
        srcUrl: this.storage.getCdnUrl(blog.thumbnail.blobPath),
      },
    };
  }

  async createDraft(storeId: string) {
    return this.prisma.blog.create({
      data: {
        storeId,
        currentStep: "CONTENT_TYPE",
      },
      select: BLOG_DETAIL_SELECT,
    });
  }

  async updateBlog(blogId: string, dto: UpdateBlogDto) {
    const { productIds, ...rest } = dto;

    const current = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: {
        products: { select: { id: true } },
        collections: { select: { id: true } },
      },
    });

    if (!current) throw new Error("Blog not found");

    const currentProductIds = current.products.map((p) => p.id);

    const productsToConnect = productIds
      ? productIds.filter((id) => !currentProductIds.includes(id))
      : [];
    const productsToDisconnect = productIds
      ? currentProductIds.filter((id) => !productIds.includes(id))
      : [];

    const updated = await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        ...rest,
        products: {
          connect: productsToConnect.map((id) => ({ id })),
          disconnect: productsToDisconnect.map((id) => ({ id })),
        },
      },
      select: BLOG_DETAIL_SELECT,
    });

    return {
      ...updated,
      thumbnail: updated.thumbnail && {
        ...updated.thumbnail,
        srcUrl: this.storage.getCdnUrl(updated.thumbnail.blobPath),
      },
    };
  }

  async startGeneration(blogId: string) {
    const res = await this.prisma.$transaction(async (tx) => {
      const b = await tx.blog.findUniqueOrThrow({
        where: { id: blogId },
        include: { job: { select: { id: true, status: true } } },
      });

      if (
        !b.topic ||
        !b.primaryKeyword ||
        !b.secondaryKeywords?.length ||
        b.currentStep !== "COMPLETED"
      ) {
        throw new Error("Blog is not ready to generate");
      }

      if (b.job && (b.job.status === "RUNNING" || b.job.status === "PENDING")) {
        return { blog: { id: b.id, storeId: b.storeId }, shouldEnqueue: false };
      }

      const key = makeDedupeKey(JobType.BLOG_GENERATION, blogId, new Date());

      const job = await tx.job.upsert({
        where: {
          type_storeId_dedupeKey: {
            type: JobType.BLOG_GENERATION,
            storeId: b.storeId,
            dedupeKey: key,
          },
        },
        update: {
          status: JobStatus.PENDING,
          error: null,
          finishedAt: null,
          startedAt: null,
          lastHeartbeatAt: null,
          attempts: { increment: 1 },
        },
        create: {
          type: JobType.BLOG_GENERATION,
          storeId: b.storeId,
          dedupeKey: key,
          status: JobStatus.PENDING,
        },
        select: { id: true },
      });

      await tx.blog.update({
        where: { id: blogId },
        data: { jobId: job.id },
      });

      return { blog: { id: b.id, storeId: b.storeId }, shouldEnqueue: true };
    });

    if (res.shouldEnqueue) {
      await this.blogsProducer.generateBlog({
        blogId: res.blog.id,
        storeId: res.blog.storeId,
      });
    }

    return res;
  }

  async syncAllNodesFromLexical(blogId: string, state: Record<string, any>) {
    const inputs = lexicalJsonToNodes(state);

    const createInputs: Prisma.NodeCreateManyInput[] = inputs.map((n) => ({
      blogId,
      key: n.key,
      parentKey: n.parentKey ?? null,
      sortOrder: n.sortOrder,
      type: n.type,
      payload: n.payload,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.node.deleteMany({ where: { blogId } });
      if (createInputs.length) {
        await tx.node.createMany({ data: createInputs });
      }
    });
  }

  private async getDefaultShopifyBlogId(
    shop: string,
    token: string,
  ): Promise<string> {
    const client = await this.catalog["shopify"].getAdminClient(shop, token);
    const res = await client.request<{ blogs: { nodes: { id: string }[] } }>(
      `
        query { blogs(first: 1) { nodes { id } } }
      `,
    );
    const id = res.blogs?.nodes?.[0]?.id;
    if (!id) throw new Error("No Shopify blog found");
    return id;
  }

  async publishToShopify(blogId: string) {
    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      include: { thumbnail: true, nodes: true },
    });

    const store = await this.prisma.store.findUniqueOrThrow({
      where: { id: blog.storeId },
      include: { channel: true },
    });

    const { shop, config } = store.channel!;
    const { offlineAccessToken } = config as { offlineAccessToken: string };

    const cdn = blog.thumbnail
      ? this.storage.getCdnUrl(blog.thumbnail.blobPath)
      : undefined;

    const basePayload = {
      title: blog.title,
      body: fromNodes(blog.nodes),
      summary: blog.description ?? "",
      isPublished: true,
      handle: blog.slug ?? undefined,
      author: { name: store.name },
      image: cdn
        ? {
            altText: blog.thumbnail?.altText ?? undefined,
            url: cdn,
          }
        : undefined,
    };

    if (blog.externalId) {
      const payload: ArticleUpdateInput = {
        title: basePayload.title,
        body: basePayload.body,
        summary: basePayload.summary,
        handle: basePayload.handle,
        author: basePayload.author,
        image: basePayload.image,
        isPublished: true,
      };

      const updated = await this.catalog.updateArticle(
        shop,
        offlineAccessToken,
        blog.externalId,
        payload,
      );

      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: BlogStatus.PUBLISHED },
      });

      return updated.id;
    } else {
      const targetBlogId = await this.getDefaultShopifyBlogId(
        shop,
        offlineAccessToken,
      );

      const payload: ArticleCreateInput = {
        blogId: targetBlogId,
        title: basePayload.title!,
        body: basePayload.body,
        summary: basePayload.summary,
        handle: basePayload.handle,
        author: basePayload.author,
        image: basePayload.image,
        isPublished: true,
      };

      const created = await this.catalog.createArticle(
        shop,
        offlineAccessToken,
        payload,
      );

      await this.prisma.blog.update({
        where: { id: blogId },
        data: {
          externalId: created.id,
          status: BlogStatus.PUBLISHED,
        },
      });

      return created.id;
    }
  }
}
