import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import {
  BlogGenerationStatus,
  BlogPublishStatus,
  GenerationStep,
  KeywordType,
  Prisma,
} from "@prisma/client";
import cuid from "cuid";
import { UpdateBlogDto } from "../dtos/update-blog.dto";
import { UpdateNodeDto } from "../dtos/update-node.dto";
import { StorageService } from "@/modules/core/storage/storage.service";
import { ShopifyService } from "@/clients/shopify-legacy/shopify.service";
import { fromNodes } from "../utils/from-nodes";
import {
  CREATE_ARTICLE,
  FIND_ARTICLE,
  LIST_BLOGS,
  UPDATE_ARTICLE,
} from "../query";
import {
  BLOG_DETAIL_SELECT,
  BLOG_SUMMARY_SELECT,
} from "../constants/selects.constants";
import { BlogWriterAgent } from "../agents/blog-writer";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { flattenNodes } from "../utils/flatten-nodes";
import { BlogsProducer } from "@/modules/integrations/messaging/producers/blogs.producer";

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blogsProducer: BlogsProducer,
    private readonly agent: BlogWriterAgent,
    private readonly storage: StorageService,
    private readonly shopify: ShopifyService,
    private readonly http: HttpService,
  ) {}

  async getBlogs(storeId: string) {
    return this.prisma.blog.findMany({
      where: {
        storeId,
        generationStep: {
          not: null,
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
    const updated = await this.prisma.blog.update({
      where: { id: blogId },
      data: { ...dto },
      select: { id: true, storeId: true, generationStep: true },
    });

    if (updated.generationStep === GenerationStep.COMPLETE) {
      await this.blogsProducer.generateBlog({
        blogId: updated.id,
        storeId: updated.storeId,
      });
    }

    return updated;
  }

  async generateBlog(storeId: string, blogId: string) {
    const [{ keyword }, blog] = await this.prisma.$transaction([
      this.prisma.storeKeyword.findFirstOrThrow({
        where: { storeId },
        select: { keyword: { select: { phrase: true } } },
      }),
      this.prisma.blog.findUniqueOrThrow({
        where: { id: blogId },
        include: { keyword: true },
      }),
    ]);

    const { nodes, metadata, image } = await this.agent.run({
      brandVoice: blog.brandVoice ?? "",
      blogginKeyword: blog.keyword?.phrase ?? "",
      businessKeyword: keyword?.phrase ?? "",
      title: blog.title ?? "",
    });

    const slug = (blog.title ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    const { data } = await firstValueFrom(
      this.http.get<ArrayBuffer>(image.url, { responseType: "arraybuffer" }),
    );
    await this.storage.upload(
      `thumbnails/${blogId}/thumbnail.png`,
      Buffer.from(data),
      "image/png",
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.blog.update({
        where: { id: blogId },
        data: {
          slug,
          description: metadata.description,
          generationStatus: BlogGenerationStatus.READY,
        },
      });
      await tx.thumbnail.create({
        data: {
          blogId,
          altText: image.altText,
          blobPath: `thumbnails/${blogId}/thumbnail.png`,
        },
      });
      const nodeInputs = flattenNodes(nodes, blogId);
      if (nodeInputs.length)
        await tx.node.createMany({ data: nodeInputs, skipDuplicates: true });
    });
  }

  async getGenerationStatus(blogId: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      select: {
        id: true,
        generationStatus: true,
        updatedAt: true,
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with id ${blogId} not found`);
    }

    return {
      id: blog.id,
      status: blog.generationStatus,
      lastUpdated: blog.updatedAt,
    };
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

    const { blogs } = await this.shopify.runMutation<{
      blogs: { nodes: Array<{ id: string }> };
    }>(shop, offlineAccessToken, `query { blogs(first: 1) { nodes { id } } }`);

    const targetBlogId = blogs.nodes[0].id;

    const payload = {
      title: blog.title,
      body: fromNodes(blog.nodes),
      summary: blog.description ?? "",
      isPublished: true,
      handle: blog.slug ?? undefined,
      author: { name: store.name },
      image: blog.thumbnail
        ? {
            altText: blog.thumbnail.altText,
            url: this.storage.getCdnUrl(blog.thumbnail.blobPath),
          }
        : undefined,
    };

    if (blog.shopifyArticleId) {
      const { articleUpdate } = await this.shopify.runMutation<{
        articleUpdate: {
          article: { id: string };
          userErrors: Array<{ field: string[]; message: string }>;
        };
      }>(shop, offlineAccessToken, UPDATE_ARTICLE, {
        id: blog.shopifyArticleId,
        article: payload,
      });

      if (articleUpdate.userErrors.length)
        throw new Error(JSON.stringify(articleUpdate.userErrors));
      return articleUpdate.article.id;
    }

    const { articleCreate } = await this.shopify.runMutation<{
      articleCreate: {
        article: { id: string };
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(shop, offlineAccessToken, CREATE_ARTICLE, {
      article: { blogId: targetBlogId, ...payload },
    });

    if (articleCreate.userErrors.length)
      throw new Error(JSON.stringify(articleCreate.userErrors));

    await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        shopifyArticleId: articleCreate.article.id,
        publishStatus: BlogPublishStatus.PUBLISHED,
      },
    });

    return articleCreate.article.id;
  }
}
