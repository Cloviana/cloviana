import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
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
  UseGuards,
} from "@nestjs/common";
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { FoldersService } from "./folders.service";

class CreateFolderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

class UpdateFolderDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

@Controller("businesses/:businessId/folders")
@UseGuards(BusinessAccessGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  listFolders(@Param("businessId") businessId: string) {
    return this.foldersService.listFolders(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createFolder(
    @Param("businessId") businessId: string,
    @Body() body: CreateFolderDto,
  ) {
    return this.foldersService.createFolder(
      businessId,
      body.name,
      body.parentId,
    );
  }

  @Patch(":folderId")
  updateFolder(
    @Param("businessId") businessId: string,
    @Param("folderId") folderId: string,
    @Body() body: UpdateFolderDto,
  ) {
    return this.foldersService.updateFolder(businessId, folderId, body);
  }

  @Delete(":folderId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFolder(
    @Param("businessId") businessId: string,
    @Param("folderId") folderId: string,
  ) {
    await this.foldersService.deleteFolder(businessId, folderId);
  }
}
