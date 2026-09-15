import { eventType, staticSchema } from "inngest";

export interface ContentTypeResearchEventData extends Record<string, unknown> {
  workflowRunId: string;
  businessId: string;
  contentTypeId: string;
  name: string;
  sampleUrl: string;
}

export const contentTypeResearchRequested = eventType(
  "brand-kit/content-type-research.requested",
  {
    schema: staticSchema<ContentTypeResearchEventData>(),
  },
);
