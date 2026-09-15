import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenRouterService } from "@/clients/openrouter/openrouter.service";
import { loadPromptHbs } from "@/common/utils/load-prompt-hbs.util";
import { InngestService } from "@/infrastructure/inngest/inngest.service";
import { ExaService } from "@/integrations/exa/exa.service";
import { WorkflowRunsService } from "@/modules/workflow-runs/workflow-runs.service";
import { Injectable } from "@nestjs/common";
import type { WorkflowRunType } from "@prisma/client";
import { z } from "zod";
import type { CreateContentTypeResearchDto } from "../../../dto/create-content-type-research.dto";
import { contentTypeResearchRequested } from "./content-type-research.events";

const PROMPT_DIRECTORY = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "prompts",
);
const CONTENT_TYPE_RESEARCH_MODEL = "openai/gpt-oss-120b";

const contentTypeResearchSchema = z.object({
  cta: z
    .object({
      label: z.string().trim().min(1),
      destination: z.string().trim().min(1),
    })
    .nullable(),
});

@Injectable()
export class ContentTypeResearchService {
  constructor(
    private readonly openrouter: OpenRouterService,
    private readonly inngest: InngestService,
    private readonly workflowRuns: WorkflowRunsService,
    private readonly exa: ExaService,
  ) {}

  async enqueue(
    businessId: string,
    { requestId, name, sampleUrl }: CreateContentTypeResearchDto,
  ) {
    if (!sampleUrl) {
      return {
        workflowRunId: null,
        contentTypeId: requestId,
        name,
        status: null,
        enqueued: false,
        reason: "sample_url_missing" as const,
      };
    }

    const reservation = await this.workflowRuns.reserveWorkflowRun({
      type: "CONTENT_TYPE_RESEARCH" as WorkflowRunType,
      businessId,
      dedupeKey: requestId,
    });

    if (
      reservation.reason !== "already_running" &&
      reservation.reason !== "already_succeeded"
    ) {
      await this.workflowRuns.updateWorkflowRunProgress(
        reservation.workflowRunId,
        {
          stage: "QUEUED",
          contentType: { id: requestId, name, sampleUrl },
        },
      );

      if (!reservation.eventId) {
        throw new Error(
          `Workflow run ${reservation.workflowRunId} is missing an Inngest event ID`,
        );
      }

      await this.inngest.send({
        id: reservation.eventId,
        name: contentTypeResearchRequested.name,
        data: {
          workflowRunId: reservation.workflowRunId,
          businessId,
          contentTypeId: requestId,
          name,
          sampleUrl,
        },
      });
    }

    return {
      workflowRunId: reservation.workflowRunId,
      contentTypeId: requestId,
      name,
      status: reservation.status,
      enqueued:
        reservation.reason !== "already_running" &&
        reservation.reason !== "already_succeeded",
      reason: reservation.reason,
    };
  }

  async research(contentType: {
    id: string;
    name: string;
    sampleUrl: string;
  }) {
    const extracted = await this.exa.getContents([contentType.sampleUrl], {
      text: {
        verbosity: "compact",
      },
      maxAgeHours: 0,
    });
    const page = extracted.results[0];
    const pageContent = page?.text?.trim();
    if (!page || !pageContent) {
      throw new Error("The sample URL did not contain readable content");
    }

    const systemPrompt = await loadPromptHbs(
      "extract-content-cta",
      {},
      { baseDir: PROMPT_DIRECTORY },
    );
    const researched = await this.openrouter.parse({
      name: "content-type-research",
      schema: contentTypeResearchSchema,
      model: CONTENT_TYPE_RESEARCH_MODEL,
      reasoning_effort: "low",
      provider: {
        order: ["deepinfra/bf16", "groq", "cerebras/fp16"],
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pageContent },
      ],
    });

    return {
      contentType: {
        id: contentType.id,
        name: contentType.name,
        ctaText: researched.cta?.label ?? null,
        ctaUrl: researched.cta?.destination ?? null,
      },
      sample: {
        kind: "URL" as const,
        value: page.url,
        content: pageContent,
      },
    };
  }
}
