import {
  Body,
  Controller,
  Delete,
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
import { SuggestSourcesDto } from "./dtos/suggest-sources.dto";
import { BlogOwnerGuard } from "./guards/blog-owner.guard";
import { UpdateBlogDto } from "./dtos/update-blog.dto";
import { UpdateNodeDto } from "./dtos/update-node.dto";
import { SyncNodesDto } from "./dtos/sync-nodes.dto";

@Controller("blogs")
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}
  @Get()
  async listBlogs(@Query("storeId") storeId: string) {
    return this.blogs.getStoreBlogs(storeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDraft(@Body() dto: CreateBlogDto) {
    return this.blogs.createDraft(dto.storeId, dto);
  }

  @Post("sources-suggestions")
  async suggestSources(@Body() { title }: SuggestSourcesDto) {
    return this.blogs.suggestSources(title);
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

  @Patch(":blogId/nodes")
  @UseGuards(BlogOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async updateNode(
    @Param("blogId") blogId: string,
    @Body() dto: UpdateNodeDto,
  ) {
    return this.blogs.updateNode(blogId, dto);
  }

  @Delete(":blogId/nodes")
  @UseGuards(BlogOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNode(@Param("blogId") blogId: string, @Query("key") key: string) {
    await this.blogs.deleteNode(blogId, key);
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

  @Put(':blogId/publish')
  async publish(
    @Param('blogId') blogId: string
  ) {
    return this.blogs.publishToShopify(blogId);
  }
}
