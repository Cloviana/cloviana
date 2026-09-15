import { PrismaService } from "@/clients/prisma/prisma.service";
import { inngest } from "@/infrastructure/inngest/inngest.client";
import { Injectable, Logger } from "@nestjs/common";
import { cron } from "inngest";
import { KnowledgeBaseClient } from "../../../knowledge-base.client";
import {
  KnowledgeEventsService,
  knowledgeDeletionRequested,
  knowledgeIngestionRequested,
} from "./knowledge.events";
import { deleteDocumentStep } from "./steps/delete-document.step";
import { ingestDocumentStep } from "./steps/ingest-document.step";
import { recoverDocumentsStep } from "./steps/recover-documents.step";

const KNOWLEDGE_RECOVERY_CRON = "*/1 * * * *";

@Injectable()
export class KnowledgeWorkflow {
  private readonly logger = new Logger(KnowledgeWorkflow.name);
  readonly inngestFunctions;

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseClient: KnowledgeBaseClient,
    private readonly knowledgeEvents: KnowledgeEventsService,
  ) {
    const ingestion = inngest.createFunction(
      {
        id: "knowledge-ingestion",
        name: "Knowledge document ingestion",
        triggers: [knowledgeIngestionRequested],
        retries: 5,
        concurrency: [{ limit: 2 }, { limit: 1, key: "event.data.documentId" }],
      },
      async ({ event, step }) => {
        const result = await step.run("ingest-document", async () => {
          const ingestionResult = await ingestDocumentStep(
            this.prisma,
            this.knowledgeBaseClient,
            this.knowledgeEvents,
            event.data,
          );
          if (ingestionResult === "indexed") {
            this.logger.log(
              `Indexed knowledge document businessId=${event.data.businessId} documentId=${event.data.documentId}`,
            );
          }
          return ingestionResult;
        });
        return { ...event.data, result };
      },
    );

    const deletion = inngest.createFunction(
      {
        id: "knowledge-deletion",
        name: "Knowledge document deletion",
        triggers: [knowledgeDeletionRequested],
        retries: 5,
        concurrency: [{ limit: 2 }, { limit: 1, key: "event.data.documentId" }],
      },
      async ({ event, step }) => {
        await step.run("delete-document", () =>
          deleteDocumentStep(this.prisma, this.knowledgeBaseClient, event.data),
        );
        return event.data;
      },
    );

    const recovery = inngest.createFunction(
      {
        id: "knowledge-recovery",
        name: "Knowledge recovery",
        triggers: [cron(KNOWLEDGE_RECOVERY_CRON)],
        retries: 3,
        singleton: { mode: "skip" },
      },
      async ({ step }) =>
        step.run("recover-documents", () =>
          recoverDocumentsStep(this.prisma, this.knowledgeEvents),
        ),
    );

    this.inngestFunctions = [ingestion, deletion, recovery];
  }
}
