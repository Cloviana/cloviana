import { eventType, staticSchema } from "inngest";

export interface ProductResearchEventData extends Record<string, unknown> {
  workflowRunId: string;
  businessId: string;
  productId: string;
  name: string;
  contextUrl: string;
}

export const productResearchRequested = eventType(
  "brand-kit/product-research.requested",
  {
    schema: staticSchema<ProductResearchEventData>(),
  },
);
