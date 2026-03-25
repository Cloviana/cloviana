import { z } from "zod";
import { ContentType } from "./audit.types";

export const CitedPageSchema = z.object({
  position: z.number().int().positive(),
  url: z.string(),
  title: z.string(),
  description: z.string(),
  domain: z.string(),
  citationShare: z.number(),
});

export const CitedDomainSchema = z.object({
  position: z.number().int().positive(),
  domain: z.string(),
  citationShare: z.number(),
});

export const MentionedBrandSchema = z.object({
  position: z.number().int().positive(),
  domain: z.string(),
  name: z.string().nullable(),
  mentionShare: z.number(),
});

export const ContentIdeaSchema = z.object({
  contentType: z.nativeEnum(ContentType),
  title: z.string(),
  overview: z.string(),
});

export const BrandVisibilitySchema = z.object({
  google_aio: z.number(),
  chatgpt: z.number(),
  perplexity: z.number(),
  overall: z.number(),
});

export const SentimentClaimSchema = z.object({
  label: z.string(),
  sentiment: z.enum(["positive", "negative"]),
  responseId: z.string(),
  sourceText: z.string(),
});

export const SentimentResponseSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  text: z.string(),
  platform: z.enum(['chatgpt', 'google_aio']),
});

export const SentimentResultSchema = z.object({
  positivePercent: z.number(),
  negativePercent: z.number(),
  claims: z.array(SentimentClaimSchema),
  responses: z.array(SentimentResponseSchema),
});

export type BrandVisibility = z.infer<typeof BrandVisibilitySchema>;
export type CitedPage = z.infer<typeof CitedPageSchema>;
export type CitedDomain = z.infer<typeof CitedDomainSchema>;
export type MentionedBrand = z.infer<typeof MentionedBrandSchema>;
export type ContentIdea = z.infer<typeof ContentIdeaSchema>;
export type SentimentClaim = z.infer<typeof SentimentClaimSchema>;
export type SentimentResponse = z.infer<typeof SentimentResponseSchema>;
export type SentimentResult = z.infer<typeof SentimentResultSchema>;
