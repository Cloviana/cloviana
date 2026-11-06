import { OpenCodeService } from "@/integrations/opencode/opencode.service";
import { ThemeEditor } from "@/modules/themes/application/editor/theme-editor";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { tool } from "@langchain/core/tools";
import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";
import { AgentModelAccess } from "../../application/ports/agent-model-access.port";
import type { ReferenceFile } from "../../application/ports/reference-storage.port";
import { MAX_PROMPT_CHARACTERS } from "../../domain/agent.policy";
import type { Json, Run } from "../../domain/agent.types";
import { createModelToken, hashModelToken } from "./run-model-token";

const CODING_INSTRUCTIONS =
  "You are Cloviana's storefront coding specialist. Work only on this React/Next.js storefront. Implement the request in its existing architecture and preserve checkout as a separate startCheckout() integration. Do not invent platform credentials or put credentials in source files. Never change .git, runtime files, or run git commit/reset; the platform versions your edits. Run the project's available type checks and build, and fix errors before finishing. Never publish or deploy. The UI's code view is read-only: perform all requested source changes yourself. Finish with a concise account of changes and validation.";
const BUILD_REPAIR_INSTRUCTIONS =
  "The platform's independent npm run build failed. Read .cloviana/build.log, fix the errors, and run the build again. Do not commit or deploy.";

interface ThemeCodingContext {
  run: Run;
  workerToken: string;
  access: { ownerId: string; slug: string };
  signal: AbortSignal;
  references: ReferenceFile[];
  proxyOrigin: string;
  emit(type: string, payload: Json): Promise<void>;
}

@Injectable()
export class ThemeCodingTool {
  private readonly logger = new Logger(ThemeCodingTool.name);
  constructor(
    private readonly config: AppConfiguration,
    private readonly models: AgentModelAccess,
    private readonly editor: ThemeEditor,
    private readonly coder: OpenCodeService,
  ) {}

  create(context: ThemeCodingContext) {
    const { run, workerToken, access, signal, references, emit } = context;
    const { themeId, baseRevisionId } = run;
    if (!themeId || !baseRevisionId) {
      throw new Error("Theme run is missing its theme or base revision");
    }
    let coded = false;
    let failed = false;
    let failure: unknown;
    const codingTool = tool(
      async ({ instruction }) => {
        if (coded) {
          return "This run has already edited the theme. Include all changes in one delegation; start another run for further changes.";
        }
        coded = true;
        const token = createModelToken();
        try {
          await this.models.issueModelToken(
            run,
            workerToken,
            hashModelToken(token),
          );
          await emit("coding.started", { themeId, baseRevisionId });
          const saved = await this.editor.edit(
            {
              ...access,
              themeId,
              runId: run.id,
              expectedRevisionId: baseRevisionId,
              message: instruction.slice(0, 200),
              signal,
            },
            (workspace) =>
              this.coder.code({
                sandboxId: workspace.sandboxId,
                prompt: instruction,
                system: CODING_INSTRUCTIONS,
                repairPrompt: BUILD_REPAIR_INSTRUCTIONS,
                validate: workspace.validateBuild,
                model: this.config.codingAgentModel,
                proxyUrl: `${context.proxyOrigin}/internal/agent-model/${run.id}`,
                token,
                signal: workspace.signal,
                references,
                events: {
                  text: (partId, text) => emit("coding.text", { partId, text }),
                  tool: (partId, name, status) =>
                    emit("coding.tool", { partId, name, status }),
                  usage: (usage) =>
                    this.models.usage(run, workerToken, {
                      provider: "openrouter",
                      model: this.config.codingAgentModel,
                      ...usage,
                      costMicros:
                        usage.costMicros > 0 ? usage.costMicros : undefined,
                    }),
                },
              }),
          );
          await emit("revision.saved", { revisionId: saved.revisionId });
          return saved.result;
        } catch (error) {
          failed = true;
          failure = error;
          throw error;
        } finally {
          await this.models
            .revokeModelToken(run, workerToken)
            .catch(() =>
              this.logger.warn(
                `Could not revoke model access for run ${run.id}`,
              ),
            );
        }
      },
      {
        name: "code_theme",
        description:
          "Delegate ALL requested React/Next.js storefront changes in one detailed instruction to the coding specialist. It edits the sandbox, validates the project, and saves a Git revision to durable storage. Do not pretend to have changed files without invoking this tool. Cannot publish.",
        schema: z.object({
          instruction: z.string().min(1).max(MAX_PROMPT_CHARACTERS),
        }),
      },
    );
    return {
      tool: codingTool,
      throwIfFailed() {
        if (failed) {
          throw failure;
        }
      },
    };
  }
}
