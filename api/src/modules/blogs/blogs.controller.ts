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
import { BlogOwnerGuard } from "./guards/blog-owner.guard";
import { UpdateBlogDto } from "./dtos/update-blog.dto";
import { SyncNodesDto } from "./dtos/sync-nodes.dto";

@Controller("blogs")
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}
  @Get()
  async listBlogs(@Query("storeId") storeId: string) {
    return this.blogs.getBlogs(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDraft(@Body() { storeId }: CreateBlogDto) {
    return this.blogs.createDraft(storeId);
  }

  @Get(":blogId")
  @UseGuards(BlogOwnerGuard)
  async getBlog(@Param("blogId") blogId: string) {
    return this.blogs.getBlog(blogId);
  }

  @Patch(":blogId")
  @UseGuards(BlogOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async updateBlog(
    @Param("blogId") blogId: string,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogs.updateBlog(blogId, dto);
  }

  @Get(":blogId/status")
  @UseGuards(BlogOwnerGuard)
  async getGenerationStatus(@Param("blogId") blogId: string) {
    return this.blogs.getGenerationStatus(blogId);
  }

  @Put(":blogId/nodes/sync")
  @UseGuards(BlogOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async syncAllNodes(
    @Param("blogId") blogId: string,
    @Body() { nodes }: SyncNodesDto,
  ) {
    await this.blogs.syncAllNodes(blogId, nodes);
  }

  @Put(":blogId/publish")
  async publish(@Param("blogId") blogId: string) {
    return this.blogs.publishToShopify(blogId);
  }
}
