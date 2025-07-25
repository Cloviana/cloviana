import { Injectable, NotFoundException } from "@nestjs/common";

import { PrismaService } from "@/clients/prisma/prisma.service";
import { GoogleSearchItem } from "../interfaces/google-custom-search.interfaces";
import OpenAI from "openai";
import { CreateBlogDto } from "../dtos/create-blog.dto";
import { BlogsProducer } from "../../messaging/producers/blogs.producer";
import { SourceRecommendationService } from "./source-recommendation.service";
import { BlogGenerationService } from "./blog-generation.service";
import {
  BlogPublishStatus,
  KeywordType,
  NodeType,
  Prisma,
} from "@prisma/client";
import { TreeNode } from "../schemas/node.schemas";
import cuid from "cuid";
import { UpdateBlogDto } from "../dtos/update-blog.dto";
import { UpdateNodeDto } from "../dtos/update-node.dto";
import { StorageService } from "@/modules/storage/storage.service";
import { ShopifyService } from "@/clients/shopify/shopify.service";
import { fromNodes } from "../utils/from-nodes";
import {
  CREATE_ARTICLE,
  FIND_ARTICLE,
  LIST_BLOGS,
  UPDATE_ARTICLE,
} from "../query";

@Injectable()
export class BlogsService {
  private readonly openai = new OpenAI();
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceRecommendation: SourceRecommendationService,
    private readonly blogsProducer: BlogsProducer,
    private readonly blogGeneration: BlogGenerationService,
    private readonly storage: StorageService,
    private readonly shopify: ShopifyService
  ) {}

  async getStoreBlogs(storeId: string) {
    const blogs = await this.prisma.blog.findMany({
      where: { storeId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        publishStatus: true,
        keyword: {
          select: {
            id: true,
            phrase: true,
          },
        },
        thumbnail: { select: { blobPath: true, altText: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return blogs.map((blog) => ({
      ...blog,
      thumbnail: {
        ...blog.thumbnail,
        srcUrl: blog.thumbnail
          ? this.storage.getCdnUrl(blog.thumbnail.blobPath)
          : null,
      },
    }));
  }

  async getBlog(blogId: string) {
    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      select: {
        id: true,
        title: true,
        generationStatus: true,
        slug: true,
        description: true,
        storeId: true,
        publishStatus: true,
        thumbnail: { select: { blobPath: true, altText: true } },
        nodes: {
          orderBy: [{ sortOrder: "asc" }, { parentKey: "asc" }],
          select: {
            key: true,
            parentKey: true,
            sortOrder: true,
            type: true,
            payload: true,
          },
        },
        keyword: { select: { phrase: true } },
      },
    });

    const srcUrl = blog.thumbnail
      ? this.storage.getCdnUrl(blog.thumbnail.blobPath)
      : "";

    return {
      ...blog,
      thumbnail: blog.thumbnail
        ? {
            ...blog.thumbnail,
            srcUrl,
          }
        : null,
    };
  }

  async updateBlog(blogId: string, dto: UpdateBlogDto) {
    const updated = await this.prisma.blog.update({
      where: { id: blogId },
      data: {
        ...dto,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
      },
    });

    return updated;
  }

  async createDraft(storeId: string, dto: CreateBlogDto) {
    const blog = await this.prisma.blog.create({
      data: {
        storeId,
        title: dto.title,
        brandVoice: dto.brandVoice,
        type: dto.type,
        keywordId: dto.keywordId,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        publishStatus: true,
        keyword: {
          select: {
            id: true,
            phrase: true,
          },
        },
      },
    });

    await this.blogsProducer.generateBlog({ blogId: blog.id, storeId });

    return blog;
  }

  async generateBlog(storeId: string, blogId: string) {
    const {
      keyword: { phrase: businessPhrase },
    } = await this.prisma.storeKeyword.findFirstOrThrow({
      where: { storeId, type: KeywordType.BLOG },
      select: { keyword: { select: { phrase: true } } },
    });

    const blog = await this.prisma.blog.findUniqueOrThrow({
      where: { id: blogId },
      include: { keyword: true },
    });

    const { thumbnail, slug, description, sections } =
      await this.blogGeneration.generateStructure({
        title: blog.title,
        type: blog.type,
        bloggingKeyword: blog.keyword.phrase,
        businessKeyword: businessPhrase,
        brandVoice: blog.brandVoice ?? "",
      });

    const [thumbnailPath, nodes] = await Promise.all([
      this.blogGeneration.generateThumbnail(thumbnail.prompt, blogId),
      this.blogGeneration.generateContent({
        sections,
        title: blog.title,
        type: blog.type,
        bloggingKeyword: blog.keyword.phrase,
        businessKeyword: businessPhrase,
        brandVoice: blog.brandVoice ?? "",
      }),
    ]);

    const nodeInputs = this.flattenNodes(nodes, blogId);

    await this.prisma.$transaction(async (tx) => {
      await tx.blog.update({
        where: { id: blogId },
        data: { slug, description },
      });

      await tx.thumbnail.upsert({
        where: { blogId },
        create: {
          blogId,
          altText: thumbnail.altText,
          blobPath: thumbnailPath,
        },
        update: {
          altText: thumbnail.altText,
          blobPath: thumbnailPath,
        },
      });

      if (nodeInputs.length) {
        await tx.node.createMany({
          data: nodeInputs,
          skipDuplicates: true,
        });
      }
    });
  }

  async suggestSources(title: string): Promise<GoogleSearchItem[]> {
    return this.sourceRecommendation.suggestSources(title);
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

  private flattenNodes(
    tree: TreeNode[],
    blogId: string,
    parentKey: string | null = null
  ): Prisma.NodeCreateManyInput[] {
    return tree.flatMap((n, i) => {
      const key = cuid();
      const base: Prisma.NodeCreateManyInput = {
        blogId,
        key,
        parentKey,
        sortOrder: i,
        type: n.type as NodeType,
        payload: n,
      };

      const children =
        "children" in n && Array.isArray(n.children)
          ? (n.children as TreeNode[])
          : [];

      return [base, ...this.flattenNodes(children, blogId, key)];
    });
  }

  async updateNode(blogId: string, dto: UpdateNodeDto) {
    const { key, parentKey, type, sortOrder, payload } = dto;
    return this.prisma.node.upsert({
      where: { blogId_key: { blogId, key } },
      update: { parentKey, type, sortOrder, payload },
      create: { blogId, key, parentKey, type, sortOrder, payload },
    });
  }

  async deleteNode(blogId: string, key: string) {
    await this.prisma.node.delete({ where: { blogId_key: { blogId, key } } });
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
