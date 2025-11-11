import { StoreOwnerGuard } from "@/guards/store-owner.guard";
import { SyncLexicalDto } from "@/modules/blogs/dtos/sync-nodes.dto";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { UpdateBlogDto } from "./dtos/update-blog.dto";
import { BlogsService } from "./services/blogs.service";

@Controller("stores/:storeId/blogs")
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Get()
  async listBlogs(@Param("storeId") storeId: string) {
    return this.blogs.getBlogs(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDraft(@Param("storeId") storeId: string) {
    return this.blogs.createDraft(storeId);
  }

  @Get(":blogId")
  @UseGuards(StoreOwnerGuard)
  async getBlog(@Param("blogId") blogId: string) {
    return this.blogs.getBlog(blogId);
  }

  @Patch(":blogId")
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async updateBlog(
    @Param("blogId") blogId: string,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogs.updateBlog(blogId, dto);
  }

  @Post(":blogId/generate")
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Param("blogId") blogId: string) {
    await this.blogs.startGeneration(blogId);
    return { ok: true };
  }

  @Put(":blogId/nodes/sync")
  @UseGuards(StoreOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async syncAllNodes(
    @Param("blogId") blogId: string,
    @Body() { state }: SyncLexicalDto,
  ) {
    await this.blogs.syncAllNodesFromLexical(blogId, state);
    return { ok: true };
  }

  @Put(":blogId/publish")
  @UseGuards(StoreOwnerGuard)
  async publish(@Param("blogId") blogId: string) {
    return this.blogs.publishToShopify(blogId);
  }
}
