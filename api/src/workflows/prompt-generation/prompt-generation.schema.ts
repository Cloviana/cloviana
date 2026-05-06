import z from "zod";

export const BuyerLanguageTypeSchema = z.enum([
  "PAIN",
  "CURRENT_WORKAROUND",
  "DESIRED_OUTCOME",
  "OBJECTION",
  "COMPETITOR_MENTION",
  "COMPARISON_CRITERIA",
  "USE_CASE",
  "BUYING_TRIGGER",
  "PRICING_BUDGET",
  "SECURITY_COMPLIANCE",
  "INTEGRATION_REQUIREMENT",
  "PERSONA_CONTEXT",
  "COMPANY_CONTEXT",
]);

export const SourceTypeSchema = z.enum(["TRANSCRIPT", "REVIEW", "FORUM"]);
