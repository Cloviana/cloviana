import { CloudflareR2Module } from "@/integrations/cloudflare-r2/cloudflare-r2.module";
import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";
import { Module } from "@nestjs/common";
import { CompleteFileUploadUseCase } from "./application/complete-file-upload/complete-file-upload.use-case";
import { ListFilesUseCase } from "./application/list-files/list-files.use-case";
import { FileUploadStorage } from "./application/ports/file-upload.port";
import { FileUploadRepository } from "./application/ports/file-upload.repository.port";
import { FILE_REPOSITORY } from "./application/ports/file.repository.port";
import { PrepareFileUploadUseCase } from "./application/prepare-file-upload/prepare-file-upload.use-case";
import { PrismaFileUploadRepository } from "./infrastructure/prisma/prisma-file-upload.repository";
import { PrismaFileRepository } from "./infrastructure/prisma/prisma-file.repository";
import { FileStorageService } from "./infrastructure/storage/file-storage.service";
import { FilesController } from "./presentation/http/files.controller";
@Module({
  imports: [MarketplacesModule, CloudflareR2Module],
  controllers: [FilesController],
  providers: [
    ListFilesUseCase,
    PrepareFileUploadUseCase,
    CompleteFileUploadUseCase,
    { provide: FileUploadStorage, useClass: FileStorageService },
    { provide: FileUploadRepository, useClass: PrismaFileUploadRepository },
    { provide: FILE_REPOSITORY, useClass: PrismaFileRepository },
  ],
})
export class FilesModule {}
