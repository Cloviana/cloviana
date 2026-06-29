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
  Req,
  UseGuards,
} from "@nestjs/common";
import { DocumentTag } from "@prisma/client";
import { IsEnum } from "class-validator";
import type { FastifyRequest } from "fastify";
import { KnowledgeService, KnowledgeUpload } from "./knowledge.service";

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "md", "markdown", "txt"]);

class UpdateDocumentDto {
  @IsEnum(DocumentTag)
  tag!: DocumentTag;
}

@Controller("businesses/:businessId/documents")
@UseGuards(BusinessAccessGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(@Param("businessId") businessId: string) {
    return this.knowledge.list(businessId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @Param("businessId") businessId: string,
    @Req() request: FastifyRequest,
  ) {
    if (!request.isMultipart()) {
      throw new BadRequestException("Expected multipart form data");
    }

    const files: Omit<KnowledgeUpload, "tag">[] = [];
    const tags: DocumentTag[] = [];

    for await (const part of request.parts()) {
      if (part.type === "file") {
        const filename = parse(part.filename).base;
        const extension = extname(filename).slice(1).toLowerCase();
        const name = filename.slice(0, -(extension.length + 1));
        const buffer = await part.toBuffer();

        if (
          part.fieldname !== "files" ||
          !name ||
          !ALLOWED_EXTENSIONS.has(extension)
        ) {
          throw new BadRequestException(
            "Only PDF, DOCX, Markdown, and TXT files are supported",
          );
        }

        files.push({
          name,
          extension,
          filename,
          mimetype: part.mimetype,
          buffer,
        });
      } else if (part.fieldname === "tags") {
        const tag = String(part.value) as DocumentTag;
        if (!Object.values(DocumentTag).includes(tag)) {
          throw new BadRequestException("Invalid document tag");
        }
        tags.push(tag);
      }
    }

    if (files.length === 0 || files.length !== tags.length) {
      throw new BadRequestException("Each file requires one tag");
    }

    return this.knowledge.upload(
      businessId,
      files.map((file, index) => ({ ...file, tag: tags[index] })),
    );
  }

  @Patch(":documentId")
  update(
    @Param("businessId") businessId: string,
    @Param("documentId") documentId: string,
    @Body() body: UpdateDocumentDto,
  ) {
    return this.knowledge.update(businessId, documentId, body.tag);
  }

  @Delete(":documentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param("businessId") businessId: string,
    @Param("documentId") documentId: string,
  ) {
    await this.knowledge.delete(businessId, documentId);
  }
}
