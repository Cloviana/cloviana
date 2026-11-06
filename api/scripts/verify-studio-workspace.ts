// Opt-in check: creates and removes an isolated sandbox and private R2 object.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { CloudflareR2Service } from "../src/integrations/cloudflare-r2/cloudflare-r2.service";
import { DaytonaService } from "../src/integrations/daytona/daytona.service";
import { DockerService } from "../src/integrations/docker/docker.service";
import { SandboxService } from "../src/integrations/sandbox/sandbox.service";
import { SandboxThemeWorkspace } from "../src/modules/themes/infrastructure/workspace/sandbox-theme-workspace";
import type { AppConfiguration } from "../src/platform/config/app.configuration";

const config = {
  environment: process.env.ENVIRONMENT || "development",
  sandboxProvider: process.env.SANDBOX_PROVIDER || "docker",
  daytonaApiKey: process.env.DAYTONA_API_KEY,
  daytonaApiUrl: process.env.DAYTONA_API_URL,
  daytonaTarget: process.env.DAYTONA_TARGET || "eu",
  daytonaSnapshot: process.env.DAYTONA_SNAPSHOT,
  r2Endpoint: process.env.R2_ENDPOINT,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  r2PrivateBucket: process.env.R2_PRIVATE_BUCKET,
} as AppConfiguration;

const r2 = new CloudflareR2Service(config);
const runtime = new SandboxService(
  config,
  new DaytonaService(config),
  new DockerService(config),
);
const workspace = new SandboxThemeWorkspace(runtime, r2);
const key = `verification/${randomUUID()}.tar.gz`;
let sandboxId: string | undefined;
try {
  const manifest = JSON.parse(
    await r2.readPrivateText("templates/marketplace-default/1/manifest.json"),
  ) as { commitSha: string };
  sandboxId = await workspace.create(`cloviana-verification-${randomUUID()}`);
  console.log("Sandbox created");
  await workspace.restore(
    sandboxId,
    "templates/marketplace-default/1/snapshot.tar.gz",
    manifest.commitSha,
  );
  const files = await workspace.tree(sandboxId);
  if (!files.some((file) => file.path === "package.json")) {
    throw new Error("Source tree is missing package.json");
  }
  console.log("Template restored; source tree readable");
  await workspace.startPreview(sandboxId);
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt++) {
    const preview = await workspace.preview(sandboxId);
    if (preview.ready) {
      const response = await fetch(preview.url, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        throw new Error("Preview URL is not reachable");
      }
      ready = true;
      break;
    }
    await delay(1000);
  }
  if (!ready) {
    throw new Error("Preview did not become ready");
  }
  console.log("Preview responds successfully");
  const snapshot = await workspace.checkpoint(
    sandboxId,
    key,
    "Verification checkpoint",
    (
      await runtime.command(
        sandboxId,
        "git -C /home/daytona/cloviana/project rev-parse HEAD",
      )
    ).trim(),
  );
  if (
    !/^[a-f0-9]{40}$/.test(snapshot.commitSha) ||
    !(await r2.readPrivate(key)).length
  ) {
    throw new Error("Git snapshot was not saved");
  }
  console.log("Git checkpoint uploaded and read back from private R2");
} catch (error) {
  console.error("Workspace check failed:", (error as Error).message);
  process.exitCode = 1;
} finally {
  if (sandboxId) {
    await workspace.remove(sandboxId);
  }
  await r2.removePrivate(key);
  console.log("Verification sandbox and R2 object removed");
}
