import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  PROJECT_ROOT,
  RUNTIME_ROOT,
  shellQuote,
} from "@/integrations/sandbox/sandbox.constants";
import { SandboxService } from "@/integrations/sandbox/sandbox.service";
import { Injectable, Logger } from "@nestjs/common";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { CODING_MAX_OUTPUT_TOKENS, OPENCODE_PORT } from "./opencode.constants";

export interface CodingEvents {
  text(partId: string, text: string): Promise<void>;
  tool(partId: string, tool: string, status: string): Promise<void>;
  usage(input: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    costMicros: number;
  }): Promise<void>;
}

@Injectable()
export class OpenCodeService {
  private readonly logger = new Logger(OpenCodeService.name);
  constructor(private readonly sandboxes: SandboxService) {}

  async code(input: {
    sandboxId: string;
    prompt: string;
    system: string;
    repairPrompt: string;
    validate(): Promise<boolean>;
    model: string;
    proxyUrl: string;
    token: string;
    signal: AbortSignal;
    events: CodingEvents;
    references?: Array<{ name: string; mimeType: string; data: Buffer }>;
  }) {
    const sandbox = await this.sandboxes.get(input.sandboxId);
    const password = randomBytes(32).toString("hex");
    const references: string[] = [];
    await this.sandboxes.command(
      input.sandboxId,
      `rm -rf ${shellQuote(`${PROJECT_ROOT}/.cloviana/references`)}`,
    );
    if (input.references?.length) {
      await this.sandboxes.command(
        input.sandboxId,
        `mkdir -p ${shellQuote(`${PROJECT_ROOT}/.cloviana/references`)}`,
      );
      for (const [index, reference] of input.references.entries()) {
        const name =
          reference.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) ||
          "reference";
        const path = `${PROJECT_ROOT}/.cloviana/references/${index}-${name}`;
        await sandbox.fs.uploadFile(reference.data, path);
        references.push(`${path} (${reference.mimeType})`);
      }
    }
    const config = {
      $schema: "https://opencode.ai/config.json",
      autoupdate: false,
      share: "disabled",
      enabled_providers: ["cloviana"],
      model: `cloviana/${input.model}`,
      provider: {
        cloviana: {
          npm: "@ai-sdk/openai-compatible",
          name: "Cloviana",
          options: { baseURL: input.proxyUrl, apiKey: input.token },
          models: {
            [input.model]: {
              name: input.model,
              limit: { context: 180000, output: CODING_MAX_OUTPUT_TOKENS },
            },
          },
        },
      },
      permission: {
        "*": "allow",
        external_directory: "deny",
        question: "deny",
        doom_loop: "deny",
      },
    };
    const configFile = `${RUNTIME_ROOT}/opencode.json`;
    const processSession = `opencode-${randomBytes(8).toString("hex")}`;
    let client: ReturnType<typeof createOpencodeClient> | undefined;
    let sessionId: string | undefined;
    const scrub = (text: string) =>
      text
        .replaceAll(input.token, "[redacted]")
        .replaceAll(password, "[redacted]");
    try {
      await sandbox.fs.uploadFile(
        Buffer.from(JSON.stringify(config)),
        configFile,
      );
      await sandbox.process.createSession(processSession);
      await sandbox.process.executeSessionCommand(processSession, {
        command: `cd ${shellQuote(PROJECT_ROOT)} && OPENCODE_CONFIG_CONTENT="$(cat ${shellQuote(configFile)})" OPENCODE_SERVER_PASSWORD=${shellQuote(password)} XDG_DATA_HOME=${shellQuote(`${RUNTIME_ROOT}/data`)} opencode serve --hostname 0.0.0.0 --port ${OPENCODE_PORT}`,
        runAsync: true,
      });
      const preview = await sandbox.getPreviewLink(OPENCODE_PORT);
      client = createOpencodeClient({
        baseUrl: preview.url,
        directory: PROJECT_ROOT,
        headers: {
          Authorization: `Basic ${Buffer.from(`opencode:${password}`).toString("base64")}`,
          "X-Daytona-Preview-Token": preview.token,
          "X-Daytona-Skip-Preview-Warning": "true",
        },
        throwOnError: true,
      });
      let healthy = false;
      for (let i = 0; i < 60; i++) {
        input.signal.throwIfAborted();
        try {
          await client.global.health({ signal: input.signal });
          healthy = true;
          break;
        } catch {
          await delay(1000, undefined, { signal: input.signal });
        }
      }
      if (!healthy) {
        throw new Error("Coding service failed to start");
      }
      const created = await client.session.create<true>(
        {
          title: "Theme edit",
          permission: [
            { permission: "*", pattern: "*", action: "allow" },
            { permission: "external_directory", pattern: "*", action: "deny" },
            { permission: "question", pattern: "*", action: "deny" },
          ],
        },
        { signal: input.signal, throwOnError: true },
      );
      sessionId = created.data.id;
      await client.session.promptAsync(
        {
          sessionID: sessionId,
          model: { providerID: "cloviana", modelID: input.model },
          parts: [
            {
              type: "text",
              text:
                input.prompt +
                (references.length
                  ? `\n\nUser-provided reference files (read them before editing):\n${references.join("\n")}`
                  : ""),
            },
          ],
          system: input.system,
        },
        { signal: input.signal },
      );
      const seen = new Map<string, string>();
      const usage = new Set<string>();
      let repairAttempts = 0;
      let completedMessageId: string | undefined;
      for (;;) {
        input.signal.throwIfAborted();
        const { data: messages } = await client.session.messages<true>(
          { sessionID: sessionId },
          { signal: input.signal, throwOnError: true },
        );
        let latestFinish: string | undefined;
        let latestMessageId: string | undefined;
        let finalText = "";
        for (const message of messages) {
          if (message.info.role !== "assistant") {
            continue;
          }
          latestMessageId = message.info.id;
          if (message.info.error) {
            throw new Error("Coding provider returned an error");
          }
          latestFinish = message.info.time.completed
            ? message.info.finish
            : undefined;
          for (const part of message.parts) {
            if (part.type === "text" && !part.synthetic) {
              const value = scrub(part.text);
              finalText = value;
              if (seen.get(part.id) !== value) {
                await input.events.text(part.id, value.slice(0, 50000));
                seen.set(part.id, value);
              }
            }
            if (
              part.type === "tool" &&
              seen.get(part.id) !== part.state.status
            ) {
              await input.events.tool(part.id, part.tool, part.state.status);
              seen.set(part.id, part.state.status);
            }
            if (part.type === "step-finish" && !usage.has(part.id)) {
              await input.events.usage({
                inputTokens: part.tokens.input,
                outputTokens: part.tokens.output,
                cachedInputTokens: part.tokens.cache.read,
                costMicros: part.cost * 1_000_000,
              });
              usage.add(part.id);
            }
          }
        }
        if (
          latestFinish &&
          latestMessageId !== completedMessageId &&
          !["tool-calls", "unknown"].includes(latestFinish)
        ) {
          if (latestFinish !== "stop") {
            throw new Error(
              `Coding stopped before completion: ${latestFinish}`,
            );
          }
          completedMessageId = latestMessageId;
          await input.events.tool("platform-build", "build", "running");
          const valid = await input.validate();
          input.signal.throwIfAborted();
          if (valid) {
            await input.events.tool("platform-build", "build", "completed");
            return scrub(finalText).slice(0, 50000);
          }
          await input.events.tool("platform-build", "build", "error");
          if (++repairAttempts > 2) {
            throw new Error("The edited project did not pass validation");
          }
          await client.session.promptAsync(
            {
              sessionID: sessionId,
              model: { providerID: "cloviana", modelID: input.model },
              parts: [
                {
                  type: "text",
                  text: input.repairPrompt,
                },
              ],
            },
            { signal: input.signal },
          );
        }
        await delay(1000, undefined, { signal: input.signal });
      }
    } finally {
      if (sessionId && client) {
        await client.session
          .abort(
            { sessionID: sessionId },
            { signal: AbortSignal.timeout(10_000) },
          )
          .catch(() => undefined);
      }
      // Remove the short-lived token from disk; DB revocation is the actual security boundary.
      await sandbox.fs.deleteFile(configFile).catch(() => {
        this.logger.warn("Could not remove the coding service configuration");
      });
      await sandbox.process
        .deleteSession(processSession)
        .catch(() =>
          this.logger.warn("Could not stop the coding service session"),
        );
    }
  }
}
