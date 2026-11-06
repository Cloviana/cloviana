import { CloudflareR2Module } from "@/integrations/cloudflare-r2/cloudflare-r2.module";
import { OpenCodeModule } from "@/integrations/opencode/opencode.module";
import { CatalogModule } from "@/modules/catalog/catalog.module";
import { MarketplacesModule } from "@/modules/marketplaces/marketplaces.module";
import { ThemesModule } from "@/modules/themes/themes.module";
import { Module } from "@nestjs/common";
import { Assistant } from "./application/assistant/assistant";
import { AgentAttachments } from "./application/attachments/agent-attachments";
import { ExecuteAgentRunUseCase } from "./application/execute-agent-run/execute-agent-run.use-case";
import { AgentEngine } from "./application/ports/agent-engine.port";
import { AgentExecutionStore } from "./application/ports/agent-execution.store.port";
import { AgentModelAccess } from "./application/ports/agent-model-access.port";
import { AgentRunRepository } from "./application/ports/agent-run.repository.port";
import { AttachmentRepository } from "./application/ports/attachment.repository.port";
import { ConversationRepository } from "./application/ports/conversation.repository.port";
import { ModelGateway } from "./application/ports/model-gateway.port";
import { ReferenceStorage } from "./application/ports/reference-storage.port";
import { AgentEngineRouter } from "./infrastructure/engine/agent-engine-router";
import { MarketplaceAgentEngine } from "./infrastructure/engine/marketplace-agent-engine";
import { OpenRouterModelGateway } from "./infrastructure/engine/openrouter-model-gateway";
import { ThemeAgentEngine } from "./infrastructure/engine/theme-agent-engine";
import { PrismaAgentExecutionStore } from "./infrastructure/prisma/prisma-agent-execution.store";
import { PrismaAgentModelAccess } from "./infrastructure/prisma/prisma-agent-model-access";
import { PrismaAgentRunRepository } from "./infrastructure/prisma/prisma-agent-run.repository";
import { PrismaAttachmentRepository } from "./infrastructure/prisma/prisma-attachment.repository";
import { PrismaConversationRepository } from "./infrastructure/prisma/prisma-conversation.repository";
import { R2ReferenceStorage } from "./infrastructure/storage/r2-reference-storage";
import { AgentWorker } from "./infrastructure/workflows/agent.worker";
import { AssistantController } from "./presentation/http/assistant.controller";
import { ModelProxyController } from "./presentation/http/model-proxy.controller";

@Module({
  imports: [
    MarketplacesModule,
    ThemesModule,
    CatalogModule,
    OpenCodeModule,
    CloudflareR2Module,
  ],
  controllers: [AssistantController, ModelProxyController],
  providers: [
    Assistant,
    ExecuteAgentRunUseCase,
    AgentWorker,
    MarketplaceAgentEngine,
    ThemeAgentEngine,
    { provide: ConversationRepository, useClass: PrismaConversationRepository },
    { provide: AgentRunRepository, useClass: PrismaAgentRunRepository },
    { provide: AgentExecutionStore, useClass: PrismaAgentExecutionStore },
    { provide: AgentModelAccess, useClass: PrismaAgentModelAccess },
    { provide: AgentEngine, useClass: AgentEngineRouter },
    { provide: ModelGateway, useClass: OpenRouterModelGateway },
    AgentAttachments,
    { provide: AttachmentRepository, useClass: PrismaAttachmentRepository },
    { provide: ReferenceStorage, useClass: R2ReferenceStorage },
  ],
})
export class AgentsModule {}
