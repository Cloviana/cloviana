import { GetMarketplaceUseCase } from "@/modules/marketplaces/application/get-marketplace/get-marketplace.use-case";
import { ThemeEditor } from "@/modules/themes/application/editor/theme-editor";
import { InvalidInputError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { isValidRunRequest } from "../../domain/agent.policy";
import { AgentAttachments } from "../attachments/agent-attachments";
import { AgentEngine } from "../ports/agent-engine.port";
import { AgentRunRepository } from "../ports/agent-run.repository.port";
import { ConversationRepository } from "../ports/conversation.repository.port";

export interface AssistantAccess {
  ownerId: string;
  slug: string;
}

@Injectable()
export class Assistant {
  constructor(
    private readonly marketplaces: GetMarketplaceUseCase,
    private readonly themes: ThemeEditor,
    private readonly conversationsRepository: ConversationRepository,
    private readonly runs: AgentRunRepository,
    private readonly engine: AgentEngine,
    private readonly attachments: AgentAttachments,
  ) {}
  private marketplace(input: AssistantAccess) {
    return this.marketplaces.execute(input);
  }
  async conversations(input: AssistantAccess, themeId?: string) {
    return this.conversationsRepository.list(
      (await this.marketplace(input)).id,
      themeId,
    );
  }
  async createConversation(input: AssistantAccess, title?: string) {
    return this.conversationsRepository.create(
      (await this.marketplace(input)).id,
      input.ownerId,
      title,
    );
  }
  async messages(
    input: AssistantAccess,
    conversationId: string,
    after: bigint,
  ) {
    return this.conversationsRepository.messages(
      (await this.marketplace(input)).id,
      conversationId,
      after,
    );
  }
  async start(
    input: AssistantAccess & {
      conversationId: string;
      prompt: string;
      idempotencyKey: string;
      themeId?: string;
      attachmentIds?: string[];
    },
  ) {
    if (!isValidRunRequest(input)) {
      throw new InvalidInputError("Invalid assistant run request");
    }
    const marketplace = await this.marketplace(input);
    this.engine.assertConfigured(!!input.themeId);
    const theme = input.themeId
      ? await this.themes.access({ ...input, themeId: input.themeId })
      : undefined;
    return this.runs.enqueue({
      ...input,
      marketplaceId: marketplace.id,
      baseRevisionId: theme?.headRevisionId,
    });
  }
  async prepareAttachment(
    input: AssistantAccess & {
      conversationId: string;
      name: string;
      mimeType: string;
      size: number;
    },
  ) {
    return this.attachments.prepare({
      ...input,
      marketplaceId: (await this.marketplace(input)).id,
    });
  }
  async attachment(
    input: AssistantAccess,
    conversationId: string,
    attachmentId: string,
  ) {
    return this.attachments.get(
      (await this.marketplace(input)).id,
      conversationId,
      attachmentId,
    );
  }
  async completeAttachment(
    input: AssistantAccess,
    conversationId: string,
    attachmentId: string,
  ) {
    return this.attachments.complete(
      (await this.marketplace(input)).id,
      conversationId,
      attachmentId,
    );
  }
  async activeRun(input: AssistantAccess, conversationId: string) {
    const { id } = await this.marketplace(input);
    await this.conversationsRepository.conversation(id, conversationId);
    return { run: await this.runs.activeRun(id, conversationId) };
  }
  async run(input: AssistantAccess, runId: string) {
    return this.runs.run((await this.marketplace(input)).id, runId);
  }
  async usage(input: AssistantAccess, runId: string) {
    return this.runs.usageForRun((await this.marketplace(input)).id, runId);
  }
  async events(input: AssistantAccess, runId: string, after: bigint) {
    return this.runs.events((await this.marketplace(input)).id, runId, after);
  }
  async cancel(input: AssistantAccess, runId: string) {
    return this.runs.cancel((await this.marketplace(input)).id, runId);
  }
}
