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
import type { TranscriptPublisher } from "../../application/transcript/transcript-publisher";
import type { Run } from "../../domain/agent.types";
import { ToolCallTracker } from "./langgraph-tool-parts";

const jsonText = (value: unknown) =>
  JSON.stringify(value, (_key, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );

/** The marketplace assistant: answers questions using the marketplace's own data. It has no way to change a theme; that is what a theme run is for. */
@Injectable()
export class MarketplaceAgentEngine extends AgentEngine {
  constructor(
    private readonly config: AppConfiguration,
    private readonly conversations: ConversationRepository,
    private readonly execution: AgentExecutionStore,
    private readonly models: AgentModelAccess,
    private readonly listThemes: ListThemesUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
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
  }

  async execute(
    run: Run,
    workerToken: string,
    signal: AbortSignal,
    transcript: TranscriptPublisher,
  ) {
    this.assertConfigured();
    const context = await this.execution.executionContext(run);
    await this.models.recordModel(run, workerToken, this.config.agentModel);
    const access = { ownerId: context.ownerId, slug: context.slug };
    const references = await this.attachments.references(run);
    const tools: StructuredToolInterface[] = [
      tool(async () => jsonText(await this.listThemes.execute(access)), {
        name: "list_themes",
        description: "List this marketplace's storefront themes.",
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
      systemPrompt: `You are Cloviana's marketplace assistant for ${context.name}. Help across the product, using only the supplied tools and verified marketplace data. All tool access is scoped to this marketplace. Read catalog data when it helps. You can explain and read marketplace context but cannot change storefront code: to change a theme, ask the user to open it in the theme editor. Do not claim tools or business write capabilities you do not have. Never publish or deploy; publishing is disabled. Never describe internal credentials. If more information is needed, ask a concise question in your response.`,
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
    const stream = await agent.stream(
      { messages },
      {
        signal,
        streamMode: ["messages", "updates"],
        recursionLimit: 80,
      },
    );
    const toolCalls = new ToolCallTracker();
    // Each stretch of text between tool calls is its own part, so the transcript reads in order.
    let stretch = 0;
    let textId: string | undefined;
    for await (const [mode, data] of stream) {
      signal.throwIfAborted();
      if (mode === "updates") {
        const parts = toolCalls.observe(data);
        for (const part of parts) {
          transcript.snapshot(part);
        }
        if (parts.length) {
          stretch += 1;
          textId = undefined;
        }
        continue;
      }
      const [chunk] = data;
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
        if (!textId) {
          textId = `text-${stretch}`;
          transcript.snapshot({ id: textId, type: "text", text: "" });
        }
        transcript.append(textId, content);
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
  }
}
