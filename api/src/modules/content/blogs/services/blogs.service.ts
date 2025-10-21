import { Injectable } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { BlogStatus, JobStatus, JobType, Prisma } from "@prisma/client";
import { UpdateBlogDto } from "../dtos/update-blog.dto";
import { UpdateNodeDto } from "../dtos/sync-nodes.dto";
import { StorageService } from "@/modules/core/storage/storage.service";
import { fromNodes } from "../utils/from-nodes";
import {
  BLOG_DETAIL_SELECT,
  BLOG_SUMMARY_SELECT,
} from "../constants/selects.constants";
import { BlogsProducer } from "@/modules/integrations/messaging/producers/blogs.producer";
import { makeDedupeKey } from "@/utils/job.util";
import { CatalogService } from "@/modules/commerce/catalog/catalog.service";
import {
  ArticleCreateInput,
  ArticleUpdateInput,
} from "@/clients/shopify/generated";

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogsProducer: BlogsProducer,
    private readonly storage: StorageService,
    private readonly catalog: CatalogService
  ) {}

  async getBlogs(storeId: string) {
    return this.prisma.blog.findMany({
      where: {
        storeId,
        status: {
          not: BlogStatus.DRAFT,
        },
      },
      select: BLOG_SUMMARY_SELECT,
      orderBy: { createdAt: "desc" },
    });
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
      },
      select: BLOG_DETAIL_SELECT,
    });
  }

  async updateBlog(blogId: string, dto: UpdateBlogDto) {
    return this.prisma.blog.update({
      where: { id: blogId },
      data: dto,
      select: BLOG_DETAIL_SELECT,
    });
  }

  async startGeneration(blogId: string) {
    const res = await this.prisma.$transaction(async (tx) => {
      const b = await tx.blog.findUniqueOrThrow({
        where: { id: blogId },
        select: {
          id: true,
          storeId: true,
          jobId: true,
          topic: true,
          title: true,
          primaryKeyword: true,
          secondaryKeywords: true,
          productId: true,
        },
      });

      if (b.jobId)
        return { blog: { id: b.id, storeId: b.storeId }, shouldEnqueue: false };

      if (
        !b.topic ||
        !b.primaryKeyword ||
        !b.title ||
        !b.secondaryKeywords?.length
      ) {
        throw new Error("Blog is not ready to generate");
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
        update: {},
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
        select: { id: true },
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

  async syncAllNodes(blogId: string, dtos: UpdateNodeDto[]) {
    const createInputs: Prisma.NodeCreateManyInput[] = dtos.map((dto) => ({
      blogId,
      key: dto.key,
      parentKey: dto.parentKey,
      sortOrder: dto.sortOrder,
      type: dto.type,
      payload: dto.payload,
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
    token: string
  ): Promise<string> {
    const client = await this.catalog["shopify"].getAdminClient(shop, token);
    const res = await client.request<{ blogs: { nodes: { id: string }[] } }>(
      `
        query { blogs(first: 1) { nodes { id } } }
      `
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

    if (blog.shopifyArticleId) {
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
        blog.shopifyArticleId,
        payload
      );

      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: BlogStatus.PUBLISHED },
      });

      return updated.id;
    } else {
      const targetBlogId = await this.getDefaultShopifyBlogId(
        shop,
        offlineAccessToken
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
        payload
      );

      await this.prisma.blog.update({
        where: { id: blogId },
        data: {
          shopifyArticleId: created.id,
          status: BlogStatus.PUBLISHED,
        },
      });

      return created.id;
    }
  }
}
