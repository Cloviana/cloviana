import {
  InvalidInputError,
  StateConflictError,
  UnsupportedOperationError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { isSourcePath } from "../../domain/source-path";
import { SOURCE_EXPORT_TTL_SECONDS } from "../../domain/workspace.policy";
import { EditThemeUseCase } from "../edit-theme/edit-theme.use-case";
import type {
  CodingWorkspace,
  ThemeEditorAccess,
} from "../editor/editor.types";
import { GetEditorThemeUseCase } from "../get-editor-theme/get-editor-theme.use-case";
import { InspectThemeUseCase } from "../inspect-theme/inspect-theme.use-case";
import { NavigateThemeVersionUseCase } from "../navigate-theme-version/navigate-theme-version.use-case";
import { ThemeEditorStore } from "../ports/theme-editor.store";
import { ThemeWorkspacePort } from "../ports/theme-workspace.port";
import { PrepareThemeWorkspaceUseCase } from "../prepare-theme-workspace/prepare-theme-workspace.use-case";
import { RestartThemeWorkspaceUseCase } from "../restart-theme-workspace/restart-theme-workspace.use-case";
import { ThemeSource } from "./theme-source";

/** Public theme capability; authorization and mutation workflows remain in their use cases. */
@Injectable()
export class ThemeEditor {
  constructor(
    private readonly getTheme: GetEditorThemeUseCase,
    private readonly store: ThemeEditorStore,
    private readonly source: ThemeSource,
    private readonly workspace: ThemeWorkspacePort,
    private readonly editTheme: EditThemeUseCase,
    private readonly inspectTheme: InspectThemeUseCase,
    private readonly navigateVersion: NavigateThemeVersionUseCase,
    private readonly restartWorkspace: RestartThemeWorkspaceUseCase,
    private readonly prepareWorkspace: PrepareThemeWorkspaceUseCase,
  ) {}

  access(input: ThemeEditorAccess) {
    return this.getTheme.execute(input);
  }
  edit<T>(
    input: Parameters<EditThemeUseCase["execute"]>[0],
    code: (workspace: CodingWorkspace) => Promise<T>,
  ) {
    return this.editTheme.execute(input, code);
  }
  inspect<T>(
    input: Parameters<InspectThemeUseCase["execute"]>[0],
    inspect: (workspace: CodingWorkspace) => Promise<T>,
  ) {
    return this.inspectTheme.execute(input, inspect);
  }
  navigate(
    input: ThemeEditorAccess,
    operation: "undo" | "redo" | "restore",
    expectedRevisionId: string,
    revisionId?: string,
  ) {
    return this.navigateVersion.execute(
      input,
      operation,
      expectedRevisionId,
      revisionId,
    );
  }
  restart(input: ThemeEditorAccess) {
    return this.restartWorkspace.execute(input);
  }
  prepare(marketplaceId: string, themeId: string, signal?: AbortSignal) {
    return this.prepareWorkspace.execute(marketplaceId, themeId, signal);
  }

  async state(input: ThemeEditorAccess) {
    const theme = await this.access(input);
    const sandbox = await this.store.workspace(theme.marketplaceId, theme.id);
    return {
      themeId: theme.id,
      revisionId: theme.headRevisionId,
      commitSha: theme.commitSha,
      version: theme.snapshotVersion.toString(),
      codeReadOnly: true,
      publishEnabled: false,
      workspace: sandbox
        ? { status: sandbox.status, errorCode: sandbox.lastErrorCode }
        : null,
    };
  }
  async requestPreview(input: ThemeEditorAccess) {
    const theme = await this.access(input);
    const sandbox = await this.store.requestWorkspace(
      theme.marketplaceId,
      theme.id,
    );
    return { status: sandbox.status };
  }
  private async ready(input: ThemeEditorAccess) {
    const theme = await this.access(input);
    const sandbox = await this.store.workspace(theme.marketplaceId, theme.id);
    if (
      sandbox?.status !== "RUNNING" ||
      !sandbox.providerSandboxId ||
      sandbox.restoredRevisionId !== theme.headRevisionId
    ) {
      throw new StateConflictError(
        "Request the preview and wait for the workspace to be ready",
      );
    }
    return { theme, sandboxId: sandbox.providerSandboxId };
  }
  async preview(input: ThemeEditorAccess) {
    const { sandboxId } = await this.ready(input);
    try {
      return await this.workspace.preview(sandboxId);
    } catch {
      // The record says RUNNING but the sandbox can't be reached: providers stop and delete idle
      // ones without telling us. Replacing it is cheap, and the source of truth isn't in it.
      await this.restart(input).catch(() => undefined);
      return { url: null, ready: false, expiresAt: null };
    }
  }
  async manifest(input: ThemeEditorAccess, revisionId: string) {
    const { marketplaceId, id } = await this.access(input);
    return this.source.manifest(marketplaceId, id, revisionId);
  }
  async picture(input: ThemeEditorAccess, revisionId: string) {
    const { marketplaceId, id } = await this.access(input);
    return this.source.picture(marketplaceId, id, revisionId);
  }
  async blob(input: ThemeEditorAccess, sha256: string) {
    const { marketplaceId, id } = await this.access(input);
    return this.source.blob(marketplaceId, id, sha256);
  }
  /** Files the agent has changed in the sandbox but not saved. Read live, and never stored. */
  async changes(input: ThemeEditorAccess) {
    const { sandboxId } = await this.ready(input);
    return (await this.workspace.changes(sandboxId)).filter(isSourcePath);
  }
  async file(input: ThemeEditorAccess, path: string) {
    if (!isSourcePath(path)) {
      throw new InvalidInputError("Invalid source file path");
    }
    return this.workspace.file((await this.ready(input)).sandboxId, path);
  }
  async history(input: ThemeEditorAccess) {
    const theme = await this.access(input);
    return {
      headRevisionId: theme.headRevisionId,
      canRedo: theme.redoStack.length > 0,
      revisions: await this.store.revisions(theme.marketplaceId, theme.id),
    };
  }
  async export(input: ThemeEditorAccess) {
    const theme = await this.access(input);
    return {
      url: await this.workspace.download(theme.storageKey),
      commitSha: theme.commitSha,
      expiresIn: SOURCE_EXPORT_TTL_SECONDS,
      format: "tar.gz",
    };
  }
  publish(): never {
    throw new UnsupportedOperationError("Publishing is disabled");
  }
  pendingWorkspaces(limit: number) {
    return this.store.pendingWorkspaces(limit);
  }
}
