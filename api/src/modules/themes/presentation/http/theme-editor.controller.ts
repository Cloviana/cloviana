import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ThemeEditor } from "../../application/editor/theme-editor";
import { FileQuery, NavigateDto } from "./dto/editor.dto";

@Controller("marketplaces/:slug/themes/:themeId/editor")
export class ThemeEditorController {
  constructor(private readonly editor: ThemeEditor) {}
  private input(user: AuthUser, slug: string, themeId: string) {
    return { ownerId: user.sub, slug, themeId };
  }

  @Get()
  state(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.state(this.input(user, slug, themeId));
  }
  @Post("workspace")
  workspace(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.requestPreview(this.input(user, slug, themeId));
  }
  @Post("workspace/restart")
  restart(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.restart(this.input(user, slug, themeId));
  }
  @Get("preview")
  preview(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.preview(this.input(user, slug, themeId));
  }
  @Get("files")
  files(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.tree(this.input(user, slug, themeId));
  }
  @Get("file")
  file(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
    @Query() query: FileQuery,
  ) {
    return this.editor.file(this.input(user, slug, themeId), query.path);
  }
  @Get("revisions")
  history(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.history(this.input(user, slug, themeId));
  }
  @Post("undo")
  undo(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
    @Body() body: NavigateDto,
  ) {
    return this.editor.navigate(
      this.input(user, slug, themeId),
      "undo",
      body.expectedRevisionId,
    );
  }
  @Post("redo")
  redo(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
    @Body() body: NavigateDto,
  ) {
    return this.editor.navigate(
      this.input(user, slug, themeId),
      "redo",
      body.expectedRevisionId,
    );
  }
  @Post("revisions/:revisionId/restore")
  restore(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
    @Param("revisionId", ParseUUIDPipe) revisionId: string,
    @Body() body: NavigateDto,
  ) {
    return this.editor.navigate(
      this.input(user, slug, themeId),
      "restore",
      body.expectedRevisionId,
      revisionId,
    );
  }
  @Get("export")
  export(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    return this.editor.export(this.input(user, slug, themeId));
  }
  @Post("publish")
  async publish(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    await this.editor.access(this.input(user, slug, themeId));
    return this.editor.publish();
  }
}
