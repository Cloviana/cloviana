import type { CodingEvents } from "@/integrations/opencode/opencode.service";
import { OpenCodeService } from "@/integrations/opencode/opencode.service";
import type { CodingWorkspace } from "@/modules/themes/application/editor/editor.types";
import { ThemeEditor } from "@/modules/themes/application/editor/theme-editor";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { AgentAttachments } from "../../application/attachments/agent-attachments";
import { AgentEngine } from "../../application/ports/agent-engine.port";
import { AgentExecutionStore } from "../../application/ports/agent-execution.store.port";
import { AgentModelAccess } from "../../application/ports/agent-model-access.port";
import type { TranscriptPublisher } from "../../application/transcript/transcript-publisher";
import { isReadOnlyMode } from "../../domain/agent-mode";
import type { Run } from "../../domain/agent.types";
import { composeCodingPrompt } from "../../domain/run-context";
import { mapOpenCodePart } from "./opencode-part-mapper";
import { createModelToken, hashModelToken } from "./run-model-token";
import { BUILD_REPAIR_PROMPT, systemPromptFor } from "./theme-agent-prompts";

/**
 * Runs a theme's work on the coding agent directly, with no assistant in between, so the user
 * sees the coding agent's own progress. What the run may do depends on its mode.
 */
@Injectable()
export class ThemeAgentEngine extends AgentEngine {
  constructor(
    private readonly config: AppConfiguration,
    private readonly execution: AgentExecutionStore,
    private readonly models: AgentModelAccess,
    private readonly editor: ThemeEditor,
    private readonly coder: OpenCodeService,
    private readonly attachments: AgentAttachments,
  ) {
    super();
  }

  assertConfigured() {
    if (!this.config.openrouterApiKey) {
      throw new DependencyUnavailableError(
        "The assistant model is not configured",
      );
    }
    if (
      this.config.sandboxProvider !== "docker" &&
      !this.config.daytonaApiKey
    ) {
      throw new DependencyUnavailableError("Daytona is not configured");
    }
    this.proxyOrigin();
  }

  private proxyOrigin() {
    if (this.config.sandboxProvider === "docker") {
      if (this.config.environment !== "development") {
        throw new DependencyUnavailableError(
          "Local Docker sandboxes are available only in development",
        );
      }
      return `http://host.docker.internal:${this.config.port}/api`;
    }
    const url = new URL(this.config.agentModelProxyUrl || this.config.apiUrl);
    if (
      url.protocol !== "https:" ||
      /(^|\.)localhost$/.test(url.hostname) ||
      ["127.0.0.1", "[::1]"].includes(url.hostname)
    ) {
      throw new DependencyUnavailableError(
        "Set AGENT_MODEL_PROXY_URL to the public HTTPS API base URL, including /api; Daytona cannot reach api.localhost",
      );
    }
    return url.toString().replace(/\/$/, "");
  }

  async execute(
    run: Run,
    workerToken: string,
    signal: AbortSignal,
    transcript: TranscriptPublisher,
  ) {
    const { themeId, baseRevisionId } = run;
    if (!themeId || !baseRevisionId) {
      throw new Error("Theme run is missing its theme or base revision");
    }
    const context = await this.execution.executionContext(run);
    const access = { ownerId: context.ownerId, slug: context.slug, themeId };
    const { text, context: runContext } = await this.execution.input(run);
    const prompt = composeCodingPrompt(text, runContext);
    const references = await this.attachments.references(run);
    const model = this.config.codingAgentModel;
    const readOnly = isReadOnlyMode(run.mode);
    await this.models.recordModel(run, workerToken, model);

    const events: CodingEvents = {
      part: async (part) => {
        const mapped = mapOpenCodePart(part);
        if (mapped) {
          transcript.snapshot(mapped);
        }
      },
      delta: async (partId, text) => transcript.append(partId, text),
      build: async (status) =>
        transcript.snapshot({
          id: "platform-build",
          type: "tool",
          tool: "build",
          status,
          title: "Checking the build",
        }),
      usage: (usage) =>
        this.models.usage(run, workerToken, {
          provider: "openrouter",
          model,
          ...usage,
          costMicros: usage.costMicros > 0 ? usage.costMicros : undefined,
        }),
    };

    const token = createModelToken();
    try {
      await this.models.issueModelToken(
        run,
        workerToken,
        hashModelToken(token),
      );
      const work = (workspace: CodingWorkspace) =>
        this.coder.code({
          sandboxId: workspace.sandboxId,
          prompt,
          system: systemPromptFor(run.mode),
          model,
          proxyUrl: `${this.proxyOrigin()}/internal/agent-model/${run.id}`,
          token,
          signal: workspace.signal,
          references,
          readOnly,
          events,
          validation: readOnly
            ? undefined
            : {
                run: workspace.validateBuild,
                repairPrompt: BUILD_REPAIR_PROMPT,
              },
        });

      if (readOnly) {
        await this.editor.inspect(
          { ...access, expectedRevisionId: baseRevisionId, signal },
          work,
        );
        return;
      }
      const saved = await this.editor.edit(
        {
          ...access,
          runId: run.id,
          expectedRevisionId: baseRevisionId,
          message: text.slice(0, 200),
          signal,
        },
        work,
      );
      transcript.event("revision.saved", { revisionId: saved.revisionId });
    } finally {
      await this.models
        .revokeModelToken(run, workerToken)
        .catch(() => undefined);
    }
  }
}
