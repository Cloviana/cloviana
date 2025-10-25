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
  Query,
  UseGuards,
} from "@nestjs/common";
import { BlogsService } from "./services/blogs.service";
import { CreateBlogDto } from "./dtos/create-blog.dto";
import { UpdateBlogDto } from "./dtos/update-blog.dto";
import { BlogOwnerGuard } from "@/guards/blog-owner.guard";
import { SyncLexicalDto } from "@/modules/blogs/dtos/sync-nodes.dto";
import { StoreAccessGuard } from "@/guards/store-access-guard";

@Controller("blogs")
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}
  @Get()
  async listBlogs(@Query("storeId") storeId: string) {
    return this.blogs.getBlogs(storeId);
  }

  @Post()
  @UseGuards(StoreAccessGuard)
  @HttpCode(HttpStatus.CREATED)
  async createDraft(@Body() { storeId }: CreateBlogDto) {
    return this.blogs.createDraft(storeId);
  }

  @Get(":blogId")
  @UseGuards(BlogOwnerGuard, StoreAccessGuard)
  async getBlog(@Param("blogId") blogId: string) {
    return this.blogs.getBlog(blogId);
  }

  @Patch(":blogId")
  @UseGuards(BlogOwnerGuard, StoreAccessGuard)
  @HttpCode(HttpStatus.OK)
  async updateBlog(
    @Param("blogId") blogId: string,
    @Body() dto: UpdateBlogDto
  ) {
    return this.blogs.updateBlog(blogId, dto);
  }

  @Post(":blogId/generate")
  @UseGuards(BlogOwnerGuard, StoreAccessGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  async generate(@Param("blogId") blogId: string) {
    await this.blogs.startGeneration(blogId);
    return { ok: true };
  }

  @Put(':blogId/nodes/sync')
  @UseGuards(BlogOwnerGuard, StoreAccessGuard)
  @HttpCode(HttpStatus.OK)
  async syncAllNodes(@Param('blogId') blogId: string, @Body() { state }: SyncLexicalDto) {
    await this.blogs.syncAllNodesFromLexical(blogId, state);
    return { ok: true };
  }

  @Put(":blogId/publish")
  async publish(@Param("blogId") blogId: string) {
    return this.blogs.publishToShopify(blogId);
  }
}
