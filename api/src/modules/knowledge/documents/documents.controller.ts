import { extname, parse } from "node:path";
import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
  isUUID,
} from "class-validator";
import type { FastifyRequest } from "fastify";
import type { DocumentUpload } from "../knowledge.types";
import { DocumentsService } from "./documents.service";

const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "md",
  "markdown",
  "txt",
]);

class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

@Controller("businesses/:businessId/documents")
@UseGuards(BusinessAccessGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  listDocuments(
    @Param("businessId") businessId: string,
    @Query("folderId") folderId?: string,
  ) {
    if (folderId && !isUUID(folderId)) {
      throw new BadRequestException("folderId must be a UUID");
    }
    return this.documentsService.listDocuments(businessId, folderId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async uploadDocuments(
    @Param("businessId") businessId: string,
    @Req() request: FastifyRequest,
  ) {
    if (!request.isMultipart()) {
      throw new BadRequestException("Expected multipart form data");
    }

    const uploads: DocumentUpload[] = [];
    let folderId: string | undefined;

    for await (const multipartPart of request.parts()) {
      if (multipartPart.type === "file") {
        const parsedFilename = parse(multipartPart.filename);
        const filename = parsedFilename.base;
        const extension = extname(filename).slice(1).toLowerCase();
        const documentName = parsedFilename.name.trim();

        if (
          multipartPart.fieldname !== "files" ||
          !documentName ||
          !SUPPORTED_DOCUMENT_EXTENSIONS.has(extension)
        ) {
          throw new BadRequestException(
            "Only PDF, DOCX, Markdown, and TXT files are supported",
          );
        }
        uploads.push({
          name: documentName,
          extension,
          filename,
          mimeType: multipartPart.mimetype,
          buffer: await multipartPart.toBuffer(),
        });
      } else if (multipartPart.fieldname === "folderId") {
        folderId = String(multipartPart.value).trim() || undefined;
      }
    }

    if (uploads.length === 0) {
      throw new BadRequestException("At least one file is required");
    }
    if (folderId && !isUUID(folderId)) {
      throw new BadRequestException("folderId must be a UUID");
    }
    return this.documentsService.uploadDocuments(businessId, folderId, uploads);
  }

  @Patch(":documentId")
  updateDocument(
    @Param("businessId") businessId: string,
    @Param("documentId") documentId: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument(businessId, documentId, body);
  }

  @Delete(":documentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(
    @Param("businessId") businessId: string,
    @Param("documentId") documentId: string,
  ) {
    await this.documentsService.deleteDocument(businessId, documentId);
  }
}
