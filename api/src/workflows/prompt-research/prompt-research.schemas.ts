import { z } from "zod";

export const AwarenessStageSchema = z.enum(["EXPLORE", "EVALUATE", "DECIDE"]);

export const PromptResearchInputSchema = z.object({
  brand: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  icp: z.string().min(1),
  competitors: z.array(z.string().min(1)),
});

export const ResearchDocumentSchema = z.object({
  url: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
});

export const SignalSchema = z.object({
  snippet: z.string().min(1),
  insight: z.string().min(1),
  url: z.string().min(1),
});

export const SignalsSchema = z.object({
  signals: z.array(SignalSchema),
});

export const SearchQueriesSchema = z.object({
  queries: z.array(z.string().min(1)).min(12).max(18),
});

// --- Generation (no stage yet) ---

export const UnclassifiedGeneratedPromptsSchema = z.object({
  prompts: z.array(z.string().min(1)),
});

export const UnclassifiedPromptRecordSchema = z.object({
  promptId: z.number().int().nonnegative(),
  prompt: z.string().min(1),
});

export const UnclassifiedPromptCollectionSchema = z.object({
  businessContext: PromptResearchInputSchema,
  prompts: z.array(UnclassifiedPromptRecordSchema),
});

// --- Classification ---

export const PromptClassificationSchema = z.object({
  promptId: z.number().int().nonnegative(),
  stage: AwarenessStageSchema,
});

export const PromptClassificationsSchema = z.object({
  classifications: z.array(PromptClassificationSchema),
});

// --- Post-classification (has stage) ---

export const PromptCandidateSchema = z.object({
  prompt: z.string().min(1),
  awarenessStage: AwarenessStageSchema,
});

export const PromptCandidateRecordSchema = PromptCandidateSchema.extend({
  promptId: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const PromptScoreSchema = z.object({
  promptId: z.number().int().nonnegative(),
  score: z.number().int().min(0).max(100),
});

export const PromptScoresSchema = z.object({
  scores: z.array(PromptScoreSchema),
});

// --- Step schemas ---

export const ResearchCollectionSchema = z.object({
  businessContext: PromptResearchInputSchema,
  documents: z.array(ResearchDocumentSchema),
});

export const SignalExtractionSchema = z.object({
  businessContext: PromptResearchInputSchema,
  signals: z.array(SignalSchema),
});

export const ClassifiedPromptsSchema = z.object({
  businessContext: PromptResearchInputSchema,
  promptCandidates: z.array(PromptCandidateRecordSchema),
});

export const ScoredPromptsSchema = z.object({
  businessContext: PromptResearchInputSchema,
  promptCandidates: z.array(
    PromptCandidateRecordSchema.extend({
      score: z.number().int().min(0).max(100),
    }),
  ),
});

export const PromptSelectionResultSchema = z.object({
  businessContext: PromptResearchInputSchema,
  prompts: z.array(PromptCandidateRecordSchema),
});

export const makeGeneratedPromptsSchema = (count: number) =>
  z.object({ prompts: z.array(z.string().min(1)).length(count) });

export const PromptResearchResultSchema = z.object({
  prompts: z.array(PromptCandidateRecordSchema),
});

export type AwarenessStage = z.infer<typeof AwarenessStageSchema>;
export type PromptResearchInput = z.infer<typeof PromptResearchInputSchema>;
export type ResearchDocument = z.infer<typeof ResearchDocumentSchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type Signals = z.infer<typeof SignalsSchema>;
export type SignalExtraction = z.infer<typeof SignalExtractionSchema>;
export type UnclassifiedPromptRecord = z.infer<
  typeof UnclassifiedPromptRecordSchema
>;
export type PromptClassification = z.infer<typeof PromptClassificationSchema>;
export type PromptClassifications = z.infer<typeof PromptClassificationsSchema>;
export type PromptCandidate = z.infer<typeof PromptCandidateSchema>;
export type PromptCandidateRecord = z.infer<typeof PromptCandidateRecordSchema>;
export type PromptScore = z.infer<typeof PromptScoreSchema>;
export type PromptScores = z.infer<typeof PromptScoresSchema>;
export type SearchQueries = z.infer<typeof SearchQueriesSchema>;

// --- Signal qualification ---

export const SignalRecordSchema = SignalSchema.extend({
  signalId: z.number().int().nonnegative(),
});

export const SignalQualificationSchema = z.object({
  signalId: z.number().int().nonnegative(),
  qualified: z.boolean(),
});

export const SignalQualificationsSchema = z.object({
  qualifications: z.array(SignalQualificationSchema),
});

export type SignalRecord = z.infer<typeof SignalRecordSchema>;
export type SignalQualification = z.infer<typeof SignalQualificationSchema>;
export type SignalQualifications = z.infer<typeof SignalQualificationsSchema>;
export type GeneratedPrompts = z.infer<
  ReturnType<typeof makeGeneratedPromptsSchema>
>;
export type PromptResearchResult = z.infer<typeof PromptResearchResultSchema>;
export type PromptSelectionResult = z.infer<typeof PromptSelectionResultSchema>;
export type ClassifiedPrompts = z.infer<typeof ClassifiedPromptsSchema>;
export type ScoredPrompts = z.infer<typeof ScoredPromptsSchema>;
export type ScoredPromptRecord = ScoredPrompts["promptCandidates"][number];
