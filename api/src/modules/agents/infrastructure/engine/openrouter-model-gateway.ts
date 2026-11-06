import { CODING_MAX_OUTPUT_TOKENS } from "@/integrations/opencode/opencode.constants";
import { AppConfiguration } from "@/platform/config/app.configuration";
import {
  AuthenticationError,
  DependencyUnavailableError,
  InvalidInputError,
} from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { AgentModelAccess } from "../../application/ports/agent-model-access.port";
import { ModelGateway } from "../../application/ports/model-gateway.port";
import { hashModelToken } from "./run-model-token";

const requestSchema = z.object({
  messages: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
  stream: z.boolean().optional(),
  stream_options: z
    .object({ include_usage: z.boolean().optional() })
    .optional(),
  max_tokens: z.number().int().positive().optional(),
  max_completion_tokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  tools: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  tool_choice: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional(),
  parallel_tool_calls: z.boolean().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  response_format: z.record(z.string(), z.unknown()).optional(),
});

@Injectable()
export class OpenRouterModelGateway extends ModelGateway {
  private readonly inflight = new Map<string, number>();
  constructor(
    private readonly store: AgentModelAccess,
    private readonly config: AppConfiguration,
  ) {
    super();
  }
  async forward(
    runId: string,
    token: string,
    body: unknown,
    signal: AbortSignal,
  ) {
    if (
      !/^[a-f0-9]{64}$/.test(token) ||
      !(await this.store.authorizeModelRequest(runId, hashModelToken(token)))
    ) {
      throw new AuthenticationError("Invalid or expired run token");
    }
    if (!this.config.openrouterApiKey) {
      throw new DependencyUnavailableError("Model provider is not configured");
    }
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success || JSON.stringify(body).length > 12 * 1024 * 1024) {
      throw new InvalidInputError("Invalid model request");
    }
    if ((this.inflight.get(runId) ?? 0) >= 2) {
      throw new DependencyUnavailableError(
        "A model request is already in progress",
      );
    }
    this.inflight.set(runId, (this.inflight.get(runId) ?? 0) + 1);
    let released = false;
    const release = () => {
      if (!released) {
        released = true;
        const count = (this.inflight.get(runId) ?? 1) - 1;
        if (count) {
          this.inflight.set(runId, count);
        } else {
          this.inflight.delete(runId);
        }
      }
    };
    try {
      const { max_completion_tokens, ...request } = parsed.data;
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.config.openrouterApiKey}`,
            "Content-Type": "application/json",
            "X-Title": "Cloviana Coding",
          },
          body: JSON.stringify({
            ...request,
            model: this.config.codingAgentModel,
            max_tokens: Math.min(
              request.max_tokens ??
                max_completion_tokens ??
                CODING_MAX_OUTPUT_TOKENS,
              CODING_MAX_OUTPUT_TOKENS,
            ),
            provider: { allow_fallbacks: false },
          }),
          signal: AbortSignal.any([signal, AbortSignal.timeout(180000)]),
        },
      );
      if (!response.ok || !response.body) {
        await response.body?.cancel();
        throw new DependencyUnavailableError(
          `Model provider rejected the request (${response.status})`,
        );
      }
      const reader = response.body.getReader();
      return {
        contentType: parsed.data.stream
          ? "text/event-stream"
          : "application/json",
        body: new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                release();
                controller.close();
              } else {
                controller.enqueue(value);
              }
            } catch (error) {
              release();
              controller.error(error);
            }
          },
          async cancel() {
            release();
            await reader.cancel();
          },
        }),
      };
    } catch (error) {
      release();
      throw error;
    }
  }
}
