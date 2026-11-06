import { CompleteFileUploadUseCase } from "@/modules/files/application/complete-file-upload/complete-file-upload.use-case";
import { ListFilesUseCase } from "@/modules/files/application/list-files/list-files.use-case";
import { PrepareFileUploadUseCase } from "@/modules/files/application/prepare-file-upload/prepare-file-upload.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";
import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CompleteFileUploadDto } from "./dto/complete-file-upload.dto";
import { ListFilesDto } from "./dto/list-files.dto";
import { PrepareFileUploadDto } from "./dto/prepare-file-upload.dto";
@Controller("marketplaces/:slug/files")
export class FilesController {
  constructor(
    private readonly listFiles: ListFilesUseCase,
    private readonly prepare: PrepareFileUploadUseCase,
    private readonly complete: CompleteFileUploadUseCase,
  ) {}
  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Query() query: ListFilesDto,
  ) {
    return this.listFiles.execute(user.sub, slug, query);
  }
  @Post("uploads")
  prepareUpload(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: PrepareFileUploadDto,
  ) {
    return this.prepare.execute(user.sub, slug, body);
  }
  @Post("uploads/complete")
  completeUpload(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: CompleteFileUploadDto,
  ) {
    return this.complete.execute(user.sub, slug, body);
  }
}
