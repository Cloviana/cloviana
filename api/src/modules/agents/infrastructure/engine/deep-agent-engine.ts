import { GetProductUseCase } from "@/modules/catalog/application/get-product/get-product.use-case";
import { ListProductsUseCase } from "@/modules/catalog/application/list-products/list-products.use-case";
import { ListThemesUseCase } from "@/modules/themes/application/list-themes/list-themes.use-case";
import { AppConfiguration } from "@/platform/config/app.configuration";
import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { type BaseMessageLike, isAIMessage } from "@langchain/core/messages";
import { type StructuredToolInterface, tool } from "@langchain/core/tools";
import { ChatOpenRouter } from "@langchain/openrouter";
import { Injectable } from "@nestjs/common";
import { createDeepAgent } from "deepagents";
import { z } from "zod";
import { AgentAttachments } from "../../application/attachments/agent-attachments";
import { AgentEngine } from "../../application/ports/agent-engine.port";
import { AgentExecutionStore } from "../../application/ports/agent-execution.store.port";
import { AgentModelAccess } from "../../application/ports/agent-model-access.port";
import { ConversationRepository } from "../../application/ports/conversation.repository.port";
import type { Json, Run } from "../../domain/agent.types";
import { ThemeCodingTool } from "./theme-coding-tool";

const jsonText = (value: unknown) =>
  JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );

@Injectable()
export class DeepAgentEngine extends AgentEngine {
  constructor(
    private readonly config: AppConfiguration,
    private readonly conversations: ConversationRepository,
    private readonly execution: AgentExecutionStore,
    private readonly models: AgentModelAccess,
    private readonly themeCoding: ThemeCodingTool,
    private readonly listThemes: ListThemesUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly attachments: AgentAttachments,
  ) {
    super();
  }

  assertConfigured(coding: boolean) {
    if (!this.config.openrouterApiKey) {
      throw new DependencyUnavailableError(
        "The assistant model is not configured",
      );
    }
    if (coding) {
      if (
        this.config.sandboxProvider !== "docker" &&
        !this.config.daytonaApiKey
      ) {
        throw new DependencyUnavailableError("Daytona is not configured");
      }
      this.proxyOrigin();
    }
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

  async execute(run: Run, workerToken: string, signal: AbortSignal) {
    this.assertConfigured(!!run.themeId);
    const context = await this.execution.executionContext(run);
    await this.models.recordModel(run, workerToken, this.config.agentModel);
    const access = { ownerId: context.ownerId, slug: context.slug };
    const references = await this.attachments.references(run);
    const emit = (type: string, payload: Json) =>
      this.execution.emit(run, workerToken, type, payload);
    const tools: StructuredToolInterface[] = [
      tool(async () => jsonText(await this.listThemes.execute(access)), {
        name: "list_themes",
        description:
          "List this marketplace's storefront themes. Coding requires a run explicitly scoped to a theme.",
        schema: z.object({}),
      }),
      tool(
        async () =>
          jsonText(
            await this.listProducts.execute({
              ...access,
              page: 1,
              pageSize: 30,
            }),
          ),
        {
          name: "list_products",
          description:
            "Read this marketplace's first 30 products for context. This does not modify products.",
          schema: z.object({}),
        },
      ),
      tool(
        async ({ productId }) =>
          jsonText(await this.getProduct.execute({ ...access, productId })),
        {
          name: "get_product",
          description: "Read a product belonging to this marketplace.",
          schema: z.object({ productId: z.string().uuid() }),
        },
      ),
    ];
    const coding = run.themeId
      ? this.themeCoding.create({
          run,
          workerToken,
          access,
          signal,
          references,
          emit,
          proxyOrigin: this.proxyOrigin(),
        })
      : undefined;
    if (coding) {
      tools.push(coding.tool);
    }

    // StateBackend is the default: scratch files exist in agent state, never on the API host.
    // Durable conversation messages are loaded explicitly, scoped to the current marketplace.
    const model = new ChatOpenRouter({
      model: this.config.agentModel,
      apiKey: this.config.openrouterApiKey,
      maxTokens: 8192,
      maxRetries: 2,
      user: run.requestedBy,
      siteName: "Cloviana",
    });
    const agent = await createDeepAgent({
      model,
      tools,
      systemPrompt: `You are Cloviana's marketplace assistant for ${context.name}. Help across the product, using only the supplied tools and verified marketplace data. All tool access is scoped to this marketplace. Read catalog data when it helps. ${run.themeId ? "This conversation run targets a theme. For code changes, delegate once to code_theme with the entire request and relevant context. The editor shows code read-only." : "This is a general assistant run. You can explain and read marketplace context. To change storefront code, ask the user to select a theme and start a theme-scoped run."} Do not claim tools or business write capabilities you do not have. Never publish or deploy; publishing is disabled. Never describe internal credentials. If more information is needed, ask a concise question in your response.`,
      subagents: [],
    });
    const history = await this.conversations.contextMessages(
      run.marketplaceId,
      run.conversationId,
    );
    const messages: BaseMessageLike[] = history
      .filter((m) => ["USER", "ASSISTANT"].includes(m.role))
      .map((m) => ({
        role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
        content:
          typeof m.content === "object" &&
          m.content !== null &&
          !Array.isArray(m.content) &&
          typeof m.content.text === "string"
            ? m.content.text
            : jsonText(m.content),
      }));
    if (references.length && messages.length) {
      const last = history.at(-1)?.content;
      const prompt =
        typeof last === "object" &&
        last !== null &&
        !Array.isArray(last) &&
        typeof last.text === "string"
          ? last.text
          : "Use the attached references.";
      messages[messages.length - 1] = {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...references.map((reference) =>
            reference.mimeType.startsWith("image/")
              ? {
                  type: "image_url" as const,
                  image_url: {
                    url: `data:${reference.mimeType};base64,${reference.data.toString("base64")}`,
                  },
                }
              : {
                  type: "text" as const,
                  text: `Reference ${reference.name}:\n${reference.data.toString("utf8").slice(0, 30000)}`,
                },
          ),
        ],
      };
    }
    await emit("assistant.started", {});
    const stream = await agent.stream(
      { messages },
      { signal, streamMode: "messages", recursionLimit: 80 },
    );
    let text = "";
    for await (const [chunk] of stream) {
      signal.throwIfAborted();
      // Messages mode also yields tool results, which are raw data rather than the reply.
      if (!isAIMessage(chunk)) {
        continue;
      }
      const content =
        typeof chunk.content === "string"
          ? chunk.content
          : chunk.content
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");
      if (content) {
        text += content;
        await emit("assistant.delta", { text: content.slice(0, 10000) });
      }
      if (chunk.usage_metadata) {
        const usage = chunk.usage_metadata;
        if (
          typeof usage.input_tokens === "number" &&
          typeof usage.output_tokens === "number" &&
          Number.isFinite(usage.input_tokens) &&
          Number.isFinite(usage.output_tokens)
        ) {
          await this.models.usage(run, workerToken, {
            provider: "openrouter",
            model: this.config.agentModel,
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
          });
        }
      }
    }
    coding?.throwIfFailed();
    return text.slice(-100000) || "Done.";
  }
}
