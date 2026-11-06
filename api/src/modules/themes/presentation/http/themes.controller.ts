import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";

import { CreateThemeUseCase } from "@/modules/themes/application/create-theme/create-theme.use-case";
import { ListThemesUseCase } from "@/modules/themes/application/list-themes/list-themes.use-case";
import { RenameThemeUseCase } from "@/modules/themes/application/rename-theme/rename-theme.use-case";
import type { AuthUser } from "@/platform/auth/auth-user.interface";
import { CurrentUser } from "@/platform/auth/decorators/current-user.decorator";
import { ResourceNotFoundError } from "@/shared/errors/application-error";

import { CreateThemeDto } from "./dto/create-theme.dto";
import { RenameThemeDto } from "./dto/rename-theme.dto";

@Controller("marketplaces/:slug/themes")
export class ThemesController {
  constructor(
    private readonly listThemes: ListThemesUseCase,
    private readonly createTheme: CreateThemeUseCase,
    private readonly renameTheme: RenameThemeUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Param("slug") slug: string) {
    return this.listThemes.execute({ ownerId: user.sub, slug });
  }

  @Get(":themeId")
  async get(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
  ) {
    const themes = await this.listThemes.execute({ ownerId: user.sub, slug });
    const theme = themes.find(({ id }) => id === themeId);
    if (!theme) {
      throw new ResourceNotFoundError("Theme not found");
    }
    return theme;
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Body() body: CreateThemeDto,
  ) {
    return this.createTheme.execute({
      ownerId: user.sub,
      slug,
      name: body.name,
    });
  }

  @Patch(":themeId")
  rename(
    @CurrentUser() user: AuthUser,
    @Param("slug") slug: string,
    @Param("themeId", ParseUUIDPipe) themeId: string,
    @Body() body: RenameThemeDto,
  ) {
    return this.renameTheme.execute({
      ownerId: user.sub,
      slug,
      themeId,
      name: body.name,
    });
  }
}
