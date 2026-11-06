import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import {
  PROJECT_ROOT,
  RUNTIME_ROOT,
  shellQuote,
} from "@/integrations/sandbox/sandbox.constants";
import { SandboxService } from "@/integrations/sandbox/sandbox.service";
import { Injectable, Logger } from "@nestjs/common";
import {
  type OpencodeClient,
  type Part,
  createOpencodeClient,
} from "@opencode-ai/sdk/v2/client";
import { CODING_MAX_OUTPUT_TOKENS, OPENCODE_PORT } from "./opencode.constants";

const HEALTH_ATTEMPTS = 60;
const POLL_INTERVAL_MS = 1000;
/** Tools that change files or run code. Read-only runs may not use them. */
const MUTATING_TOOLS = ["edit", "bash", "webfetch", "websearch"] as const;

export interface CodingEvents {
  /** The full current state of one of the agent's message parts. */
  part(part: Part): Promise<void>;
  /** Text appended to a part that was reported earlier. */
  delta(partId: string, text: string): Promise<void>;
  /** The platform's own build check, which isn't part of the agent's work. */
  build(status: "running" | "completed" | "error"): Promise<void>;
  usage(input: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    costMicros: number;
  }): Promise<void>;
}

export interface CodingRequest {
  sandboxId: string;
  prompt: string;
  system: string;
  model: string;
  proxyUrl: string;
  token: string;
  signal: AbortSignal;
  events: CodingEvents;
  /** A read-only run is refused every tool that would change files or run commands. */
  readOnly: boolean;
  /** Checks the project once the agent stops and asks it to repair what fails. */
  validation?: { run(): Promise<boolean>; repairPrompt: string };
  references?: Array<{ name: string; mimeType: string; data: Buffer }>;
}

function permissions(readOnly: boolean) {
  const denied = readOnly ? MUTATING_TOOLS : [];
  return {
    config: {
      "*": "allow",
      external_directory: "deny",
      question: "deny",
      doom_loop: "deny",
      ...Object.fromEntries(denied.map((tool) => [tool, "deny"])),
    },
    // Later rules win, so the denials follow the blanket allow.
    session: [
      { permission: "*", pattern: "*", action: "allow" as const },
      {
        permission: "external_directory",
        pattern: "*",
        action: "deny" as const,
      },
      { permission: "question", pattern: "*", action: "deny" as const },
      ...denied.map((tool) => ({
        permission: tool,
        pattern: "*",
        action: "deny" as const,
      })),
    ],
  };
}

@Injectable()
export class OpenCodeService {
  private readonly logger = new Logger(OpenCodeService.name);
  constructor(private readonly sandboxes: SandboxService) {}

  async code(input: CodingRequest) {
    const sandbox = await this.sandboxes.get(input.sandboxId);
    const password = randomBytes(32).toString("hex");
    const references = await this.uploadReferences(input);
    const rules = permissions(input.readOnly);
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
      permission: rules.config,
    };
    const configFile = `${RUNTIME_ROOT}/opencode.json`;
    const processSession = `opencode-${randomBytes(8).toString("hex")}`;
    const scrub = (text: string) =>
      text
        .replaceAll(input.token, "[redacted]")
        .replaceAll(password, "[redacted]");
    const scrubbed = <T>(value: T): T =>
      JSON.parse(scrub(JSON.stringify(value)));
    let client: OpencodeClient | undefined;
    let sessionId: string | undefined;
    const live = new AbortController();
    try {
      await sandbox.fs.uploadFile(
        Buffer.from(JSON.stringify(config)),
        configFile,
      );
      await sandbox.process.createSession(processSession);
      await sandbox.process.executeSessionCommand(processSession, {
        command: `cd ${shellQuote(PROJECT_ROOT)} && OPENCODE_CONFIG_CONTENT="$(cat ${shellQuote(configFile)})" OPENCODE_SERVER_PASSWORD=${shellQuote(password)} XDG_DATA_HOME=${shellQuote(`${RUNTIME_ROOT}/opencode-data`)} opencode serve --hostname 0.0.0.0 --port ${OPENCODE_PORT}`,
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
      await this.waitUntilHealthy(client, input.signal);
      const created = await client.session.create<true>(
        { title: "Theme edit", permission: rules.session },
        { signal: input.signal, throwOnError: true },
      );
      sessionId = created.data.id;

      // Live updates make the transcript feel instant; the polling below stays as the fallback
      // and as the source of truth for how the run ended.
      const following = this.follow(
        client,
        sessionId,
        input.events,
        scrubbed,
        AbortSignal.any([input.signal, live.signal]),
      );
      await this.sendPrompt(client, sessionId, input, {
        text:
          input.prompt +
          (references.length
            ? `\n\nUser-provided reference files (read them before editing):\n${references.join("\n")}`
            : ""),
        system: input.system,
      });
      await this.waitForCompletion(client, sessionId, input, scrubbed);
      live.abort();
      await following;
    } finally {
      live.abort();
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

  private async uploadReferences(input: CodingRequest) {
    const sandbox = await this.sandboxes.get(input.sandboxId);
    const directory = `${PROJECT_ROOT}/.cloviana/references`;
    const uploaded: string[] = [];
    await this.sandboxes.command(
      input.sandboxId,
      `rm -rf ${shellQuote(directory)}`,
    );
    if (!input.references?.length) {
      return uploaded;
    }
    await this.sandboxes.command(
      input.sandboxId,
      `mkdir -p ${shellQuote(directory)}`,
    );
    for (const [index, reference] of input.references.entries()) {
      const name =
        reference.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) ||
        "reference";
      const path = `${directory}/${index}-${name}`;
      await sandbox.fs.uploadFile(reference.data, path);
      uploaded.push(`${path} (${reference.mimeType})`);
    }
    return uploaded;
  }

  private async waitUntilHealthy(client: OpencodeClient, signal: AbortSignal) {
    for (let attempt = 0; attempt < HEALTH_ATTEMPTS; attempt++) {
      signal.throwIfAborted();
      try {
        await client.global.health({ signal });
        return;
      } catch {
        await delay(1000, undefined, { signal });
      }
    }
    throw new Error("Coding service failed to start");
  }

  private sendPrompt(
    client: OpencodeClient,
    sessionID: string,
    input: CodingRequest,
    message: { text: string; system?: string },
  ) {
    return client.session.promptAsync(
      {
        sessionID,
        model: { providerID: "cloviana", modelID: input.model },
        parts: [{ type: "text", text: message.text }],
        system: message.system,
      },
      { signal: input.signal },
    );
  }

  /**
   * Forwards the agent's progress as it happens. Anything this misses, the polling in
   * `waitForCompletion` reports a second later, so a failure here only costs smoothness.
   */
  private async follow(
    client: OpencodeClient,
    sessionId: string,
    events: CodingEvents,
    scrubbed: <T>(value: T) => T,
    signal: AbortSignal,
  ) {
    const assistantMessages = new Set<string>();
    try {
      const { stream } = await client.event.subscribe(undefined, { signal });
      for await (const event of stream) {
        signal.throwIfAborted();
        const { properties } = event as {
          properties?: Record<string, unknown> & { sessionID?: string };
        };
        if (properties?.sessionID !== sessionId) {
          continue;
        }
        if (event.type === "message.updated") {
          if (event.properties.info.role === "assistant") {
            assistantMessages.add(event.properties.info.id);
          }
        } else if (
          event.type === "message.part.updated" &&
          assistantMessages.has(event.properties.part.messageID)
        ) {
          await events.part(scrubbed(event.properties.part));
        } else if (
          event.type === "message.part.delta" &&
          event.properties.field === "text" &&
          assistantMessages.has(event.properties.messageID)
        ) {
          await events.delta(
            event.properties.partID,
            scrubbed(event.properties.delta),
          );
        }
      }
    } catch (error) {
      if (!signal.aborted) {
        this.logger.warn(
          `Live coding updates unavailable, falling back to polling: ${String(error)}`,
        );
      }
    }
  }

  private async waitForCompletion(
    client: OpencodeClient,
    sessionID: string,
    input: CodingRequest,
    scrubbed: <T>(value: T) => T,
  ) {
    const seen = new Map<string, string>();
    const usage = new Set<string>();
    let repairAttempts = 0;
    let completedMessageId: string | undefined;
    for (;;) {
      input.signal.throwIfAborted();
      const { data: messages } = await client.session.messages<true>(
        { sessionID },
        { signal: input.signal, throwOnError: true },
      );
      let latestFinish: string | undefined;
      let latestMessageId: string | undefined;
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
          const snapshot = JSON.stringify(part);
          if (seen.get(part.id) !== snapshot) {
            seen.set(part.id, snapshot);
            await input.events.part(scrubbed(part));
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
          throw new Error(`Coding stopped before completion: ${latestFinish}`);
        }
        completedMessageId = latestMessageId;
        if (!input.validation) {
          return;
        }
        await input.events.build("running");
        const valid = await input.validation.run();
        input.signal.throwIfAborted();
        if (valid) {
          await input.events.build("completed");
          return;
        }
        await input.events.build("error");
        if (++repairAttempts > 2) {
          throw new Error("The edited project did not pass validation");
        }
        await this.sendPrompt(client, sessionID, input, {
          text: input.validation.repairPrompt,
        });
      }
      await delay(POLL_INTERVAL_MS, undefined, { signal: input.signal });
    }
  }
}
