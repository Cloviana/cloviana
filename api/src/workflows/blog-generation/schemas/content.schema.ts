import { z } from "zod";

export const SectionContentSchema = z.object({
  heading: z.string().describe("The exact heading from the outline"),
  content: z.string().describe("Markdown content for this section (no heading included)"),
});

export const ContentSchema = z.object({
  introduction: z
    .string()
    .describe("Opening paragraphs with no heading. Must include primary keyword in first sentence."),
  sections: z
    .array(SectionContentSchema)
    .describe("Body sections in order, each with heading and content"),
  conclusion: SectionContentSchema.describe(
    "Final section with heading and content including CTA link"
  ),
});

export type Content = z.infer<typeof ContentSchema>;