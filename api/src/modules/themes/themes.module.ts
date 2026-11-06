import { SandboxModule } from "@/integrations/sandbox/sandbox.module";
import { Module } from "@nestjs/common";
import { EditThemeUseCase } from "./application/edit-theme/edit-theme.use-case";
import { ThemeEditor } from "./application/editor/theme-editor";
import { ThemeSource } from "./application/editor/theme-source";
import { GetEditorThemeUseCase } from "./application/get-editor-theme/get-editor-theme.use-case";
import { NavigateThemeVersionUseCase } from "./application/navigate-theme-version/navigate-theme-version.use-case";
import { ThemeEditorStore } from "./application/ports/theme-editor.store";
import { ThemeSourceStorage } from "./application/ports/theme-source.storage.port";
import { ThemeWorkspacePort } from "./application/ports/theme-workspace.port";
import { WorkspaceLeases } from "./application/ports/workspace-lease.port";
import { PrepareThemeWorkspaceUseCase } from "./application/prepare-theme-workspace/prepare-theme-workspace.use-case";
import { RestartThemeWorkspaceUseCase } from "./application/restart-theme-workspace/restart-theme-workspace.use-case";
import { ThemeWorkspaceLifecycle } from "./application/workspace-lifecycle/theme-workspace-lifecycle";
import { PrismaThemeEditorStore } from "./infrastructure/prisma/prisma-theme-editor.store";
import { PrismaWorkspaceLeases } from "./infrastructure/prisma/prisma-workspace-leases";
import { R2ThemeSourceStorage } from "./infrastructure/source/r2-theme-source.storage";
import { SandboxThemeWorkspace } from "./infrastructure/workspace/sandbox-theme-workspace";
import { ThemeEditorController } from "./presentation/http/theme-editor.controller";

import { CloudflareR2Module } from "@/integrations/cloudflare-r2/cloudflare-r2.module";
import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";

import { CreateThemeUseCase } from "./application/create-theme/create-theme.use-case";
import { ListThemesUseCase } from "./application/list-themes/list-themes.use-case";
import { THEME_SNAPSHOT_STORAGE } from "./application/ports/theme-snapshot.storage.port";
import { THEME_REPOSITORY } from "./application/ports/theme.repository.port";
import { ProvisionDefaultThemeUseCase } from "./application/provision-default-theme/provision-default-theme.use-case";
import { RenameThemeUseCase } from "./application/rename-theme/rename-theme.use-case";
import { PrismaThemeRepository } from "./infrastructure/prisma/prisma-theme.repository";
import { R2ThemeSnapshotStorage } from "./infrastructure/storage/r2-theme-snapshot.storage";
import { ThemesController } from "./presentation/http/themes.controller";

@Module({
  imports: [MarketplacesModule, CloudflareR2Module, SandboxModule],
  controllers: [ThemesController, ThemeEditorController],
  providers: [
    ListThemesUseCase,
    CreateThemeUseCase,
    RenameThemeUseCase,
    ProvisionDefaultThemeUseCase,
    ThemeEditor,
    ThemeSource,
    GetEditorThemeUseCase,
    EditThemeUseCase,
    NavigateThemeVersionUseCase,
    RestartThemeWorkspaceUseCase,
    PrepareThemeWorkspaceUseCase,
    ThemeWorkspaceLifecycle,
    { provide: WorkspaceLeases, useClass: PrismaWorkspaceLeases },
    { provide: ThemeEditorStore, useClass: PrismaThemeEditorStore },
    { provide: ThemeWorkspacePort, useClass: SandboxThemeWorkspace },
    { provide: ThemeSourceStorage, useClass: R2ThemeSourceStorage },
    { provide: THEME_REPOSITORY, useClass: PrismaThemeRepository },
    { provide: THEME_SNAPSHOT_STORAGE, useClass: R2ThemeSnapshotStorage },
  ],
  // Public contract for other modules (e.g. onboarding); the repository and storage stay private.
  exports: [ProvisionDefaultThemeUseCase, ThemeEditor, ListThemesUseCase],
})
export class ThemesModule {}
