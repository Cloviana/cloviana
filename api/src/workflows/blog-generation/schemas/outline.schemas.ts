import { z } from "zod";

const SubSectionSchema = z.object({
  heading: z.string().min(1).describe("The heading of the sub-section"),
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

const SectionSchema = z.object({
  type: z
    .enum(["INTRODUCTION", "SECTION", "CONCLUSION"])
    .describe("The type of section"),
  heading: z.string().min(1).describe("The heading of the section"),
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
      "Optional sub-sections for this section. Add 1–3 when they provide helpful structure or clarity; otherwise set to null.",
    ),
});

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
        "Choose the most suitable blog type based on the topic and title: use 'comparison' for X vs Y, 'review' for evaluative product coverage, 'guide' for comprehensive orientation without strict steps, 'how-to' for procedural step-by-step tasks, 'listicle' only when the content naturally enumerates items or benefits, 'story' for narrative case studies/user journeys, and 'news' for timely announcements.",
      ),
    sections: z
      .array(SectionSchema)
      .min(3)
      .describe("The sections that make up the blog outline"),
  })
  .superRefine((val, ctx) => {
    if (val.sections[0]?.type !== "INTRODUCTION") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections", 0, "type"],
        message: "First section must be INTRODUCTION",
      });
    }
    if (val.sections[val.sections.length - 1]?.type !== "CONCLUSION") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections", val.sections.length - 1, "type"],
        message: "Last section must be CONCLUSION",
      });
    }
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
