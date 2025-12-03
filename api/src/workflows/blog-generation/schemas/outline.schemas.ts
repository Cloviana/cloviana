import { z } from "zod";

const SubSectionSchema = z.object({
  heading: z.string().min(1).describe("The heading of the sub-section (H3)"),
  keyPoints: z
    .array(z.string())
    .nullable()
    .describe("A list of key points covered in this sub-section"),
  wordBudget: z
    .number()
    .int()
    .positive()
    .describe("The suggested word count for this sub-section"),
});

// 1. Introduction Schema: Heading is explicitly null
const IntroductionSectionSchema = z.object({
  type: z.literal("INTRODUCTION"),
  heading: z
    .null()
    .describe(
      "The introduction does not have a heading (H2); it follows immediately after the blog title (H1).",
    ),
  keyPoints: z
    .array(z.string())
    .min(1)
    .describe("Key points to hook the reader in the introduction"),
  wordBudget: z
    .number()
    .int()
    .positive()
    .describe("The suggested word count for the introduction (usually short)"),
  subSections: z
    .null()
    .describe("Introductions typically do not have sub-sections"),
});

// 2. Body Section Schema: Heading is required
const BodySectionSchema = z.object({
  type: z.literal("SECTION"),
  heading: z
    .string()
    .min(1)
    .describe(
      "The H2 heading for this section. Must include Primary or Secondary keywords where natural.",
    ),
  keyPoints: z
    .array(z.string())
    .min(1)
    .describe("A list of key points covered in this section"),
  wordBudget: z
    .number()
    .int()
    .positive()
    .describe("The suggested word count for this section"),
  subSections: z
    .array(SubSectionSchema)
    .nullable()
    .describe(
      "Optional sub-sections (H3) for this section. Add 1–3 when helpful; otherwise null.",
    ),
});

// 3. Conclusion Schema: Heading is required
const ConclusionSectionSchema = z.object({
  type: z.literal("CONCLUSION"),
  heading: z
    .string()
    .min(1)
    .describe("The heading for the conclusion (e.g., 'Final Thoughts')"),
  keyPoints: z
    .array(z.string())
    .min(1)
    .describe("Key takeaways to summarize"),
  wordBudget: z
    .number()
    .int()
    .positive()
    .describe("The suggested word count for the conclusion"),
  subSections: z.null().describe("Conclusions do not have sub-sections"),
});

// Combine them using a discriminated union based on 'type'
const SectionSchema = z.discriminatedUnion("type", [
  IntroductionSectionSchema,
  BodySectionSchema,
  ConclusionSectionSchema,
]);

export const OutlineSchema = z
  .object({
    type: z
      .enum([
        "listicle",
        "how-to",
        "review",
        "comparison",
        "guide",
        "story",
        "news",
      ])
      .describe(
        "Choose the most suitable blog type based on the topic and title.",
      ),
    sections: z
      .array(SectionSchema)
      .min(3)
      .describe("The sections that make up the blog outline"),
  })
  .superRefine((val, ctx) => {
    // 1. First section must be INTRODUCTION
    if (val.sections[0]?.type !== "INTRODUCTION") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections", 0, "type"],
        message: "First section must be INTRODUCTION",
      });
    }

    // 2. Last section must be CONCLUSION
    if (val.sections[val.sections.length - 1]?.type !== "CONCLUSION") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections", val.sections.length - 1, "type"],
        message: "Last section must be CONCLUSION",
      });
    }

    // 3. Must have at least one SECTION in the middle
    const hasMiddleSection = val.sections
      .slice(1, -1)
      .some((s) => s.type === "SECTION");
    if (!hasMiddleSection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message:
          "There must be at least one SECTION between INTRODUCTION and CONCLUSION",
      });
    }
  });

export const ThumbnailSchema = z.object({
  prompt: z
    .string()
    .min(1)
    .describe("Text prompt to generate the blog’s cover image"),
  altText: z
    .string()
    .min(1)
    .describe("Descriptive alt text for the cover image"),
});

export const PlanSchema = z.object({
  thumbnail: ThumbnailSchema,
  outline: OutlineSchema,
  title: z
    .string()
    .min(5)
    .describe(
      "The main title of the blog post. Should include the primary keyword naturally and be written for both readers and search engines.",
    ),
  description: z
    .string()
    .describe(
      "The meta description — a short, persuasive summary (around 150–160 characters) that clearly conveys what the page is about and encourages clicks from search results. Hard limit: description must be 180 characters or fewer. If you write a longer draft, shorten it before returning the JSON.",
    ),
});

export type Outline = z.infer<typeof OutlineSchema>;
export type Thumbnail = z.infer<typeof ThumbnailSchema>;
export type Plan = z.infer<typeof PlanSchema>;
