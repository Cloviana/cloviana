import { randomUUID } from "node:crypto";
import { CloudflareR2Service } from "@/integrations/cloudflare-r2/cloudflare-r2.service";
import {
  PROJECT_ROOT,
  RUNTIME_ROOT,
  shellQuote,
} from "@/integrations/sandbox/sandbox.constants";
import { SandboxService } from "@/integrations/sandbox/sandbox.service";
import { Injectable } from "@nestjs/common";
import { ThemeWorkspacePort } from "../../application/ports/theme-workspace.port";
import {
  MAX_SNAPSHOT_BYTES,
  PREVIEW_URL_TTL_SECONDS,
  SOURCE_EXPORT_TTL_SECONDS,
} from "../../domain/workspace.policy";
import {
  CREATE_SNAPSHOT_SCRIPT,
  FILES_SCRIPT,
  PREPARE_GIT_SCRIPT,
  RESTORE_SCRIPT,
} from "./workspace-scripts";

@Injectable()
export class SandboxThemeWorkspace extends ThemeWorkspacePort {
  constructor(
    private readonly sandboxes: SandboxService,
    private readonly r2: CloudflareR2Service,
  ) {
    super();
  }

  async create(name: string) {
    return (await this.sandboxes.create(name)).id;
  }
  remove(id: string) {
    return this.sandboxes.remove(id);
  }

  async restore(id: string, storageKey: string, commitSha: string) {
    if (!/^[a-f0-9]{40}$/.test(commitSha)) {
      throw new Error("Invalid Git commit");
    }
    const sandbox = await this.sandboxes.get(id);
    if (sandbox.state !== "started") {
      await sandbox.start(120);
    }
    await this.sandboxes.command(id, `mkdir -p ${shellQuote(RUNTIME_ROOT)}`);
    await sandbox.fs.uploadFile(
      await this.r2.readPrivate(storageKey, MAX_SNAPSHOT_BYTES),
      `${RUNTIME_ROOT}/restore.tar.gz`,
    );
    await this.sandboxes.python(id, RESTORE_SCRIPT);
    await this.sandboxes.command(
      id,
      `git -C ${shellQuote(PROJECT_ROOT)} config core.hooksPath /dev/null && git -C ${shellQuote(PROJECT_ROOT)} reset --hard ${commitSha} && git -C ${shellQuote(PROJECT_ROOT)} config user.name 'Cloviana' && git -C ${shellQuote(PROJECT_ROOT)} config user.email 'agent@cloviana.invalid'`,
    );
    // Install lifecycle scripts execute only in the tenant's isolated sandbox.
    await this.sandboxes.command(
      id,
      `cd ${shellQuote(PROJECT_ROOT)} && if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi`,
      300,
    );
  }

  async startPreview(id: string) {
    const sandbox = await this.sandboxes.get(id);
    if (sandbox.state !== "started") {
      await sandbox.start(120);
    }
    const probe = await sandbox.process.executeCommand(
      "curl -s -o /dev/null http://127.0.0.1:3000",
      undefined,
      undefined,
      15,
    );
    if (probe.exitCode === 0) {
      return;
    }
    const session = `preview-${randomUUID()}`;
    await sandbox.process.createSession(session);
    await sandbox.process.executeSessionCommand(session, {
      command: `cd ${shellQuote(PROJECT_ROOT)} && npm run dev -- --hostname 0.0.0.0 --port 3000`,
      runAsync: true,
    });
    await sandbox.fs.uploadFile(
      Buffer.from(session),
      `${RUNTIME_ROOT}/preview-session`,
    );
  }

  async preview(id: string) {
    const sandbox = await this.sandboxes.get(id);
    const probe = await sandbox.process.executeCommand(
      "curl -sf -o /dev/null http://127.0.0.1:3000",
      undefined,
      undefined,
      15,
    );
    const { url } = await sandbox.getSignedPreviewUrl(
      3000,
      PREVIEW_URL_TTL_SECONDS,
    );
    return {
      url,
      ready: probe.exitCode === 0,
      expiresAt: id.startsWith("docker:")
        ? null
        : new Date(Date.now() + PREVIEW_URL_TTL_SECONDS * 1000).toISOString(),
    };
  }

  async validateBuild(id: string) {
    const sandbox = await this.sandboxes.get(id);
    try {
      const session = (
        await sandbox.fs.downloadFile(`${RUNTIME_ROOT}/preview-session`)
      )
        .toString()
        .trim();
      await sandbox.process.deleteSession(session);
      await sandbox.fs.deleteFile(`${RUNTIME_ROOT}/preview-session`);
    } catch {
      // The preview may already have stopped.
    }
    const result = await sandbox.process.executeCommand(
      `cd ${shellQuote(PROJECT_ROOT)} && mkdir -p .cloviana && npm run build > .cloviana/build.log 2>&1`,
      undefined,
      undefined,
      300,
    );
    return result.exitCode === 0;
  }

  async tree(id: string) {
    return JSON.parse(await this.sandboxes.python(id, FILES_SCRIPT)) as Array<{
      path: string;
      size: number;
    }>;
  }
  async file(id: string, path: string) {
    return JSON.parse(await this.sandboxes.python(id, FILES_SCRIPT, path)) as {
      path: string;
      content: string;
    };
  }

  async checkpoint(id: string, storageKey: string, message: string) {
    const qroot = shellQuote(PROJECT_ROOT);
    await this.sandboxes.python(id, PREPARE_GIT_SCRIPT);
    // Never persist credentials, dependency trees, runtime configuration or build output.
    await this.sandboxes.command(
      id,
      `cd ${qroot} && git config core.hooksPath /dev/null && git add -A -- . && if ! git diff --cached --quiet; then git commit -m ${shellQuote(message.slice(0, 200))}; fi`,
    );
    const commitSha = (
      await this.sandboxes.command(id, `git -C ${qroot} rev-parse HEAD`)
    ).trim();
    await this.sandboxes.command(
      id,
      `git -C ${qroot} update-ref refs/cloviana/${randomUUID()} ${commitSha}`,
    );
    await this.sandboxes.python(id, CREATE_SNAPSHOT_SCRIPT);
    const sandbox = await this.sandboxes.get(id);
    const archive = await sandbox.fs.downloadFile(
      `${RUNTIME_ROOT}/snapshot.tar.gz`,
    );
    if (archive.length > MAX_SNAPSHOT_BYTES) {
      throw new Error("Snapshot exceeds 100 MiB");
    }
    await this.r2.writePrivate(storageKey, archive);
    return { commitSha };
  }

  download(key: string) {
    return this.r2.privateDownloadUrl(key, SOURCE_EXPORT_TTL_SECONDS);
  }
  discard(key: string) {
    return this.r2.removePrivate(key);
  }
}
