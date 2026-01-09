import { z } from "zod";

const MetaDataSchema = z.object({
  description: z.string().nullable(),
});

const RoleSchema = z.enum([
  "intro",
  "problem",
  "solution_framework",
  "product_recommendation",
  "objections",
  "conclusion_cta",
]);

const ImageSchema = z.object({
  prompt: z.string(),
  altText: z.string(),
  referencedAssetIds: z.array(z.string()).max(3).nullable(),
  url: z.string().nullable().default(null),
});

const KeywordUseSchema = z.object({
  keyword: z.string().min(1),
  kind: z.enum(["primary", "secondary"]),
  match: z.enum(["exact", "semantic"]).default("exact"),
});

const SubsectionSchema = z.object({
  heading: z.string().min(1),
  estimatedWordCount: z.number().int().positive(),
  goal: z.string().min(1),
  talkingPoints: z.array(z.string()),
});

const BaseSectionFields = {
  sectionId: z.string().min(1),
  estimatedWordCount: z.number().int().positive(),
  goal: z.string().min(1),
  talkingPoints: z.array(z.string()).min(1),
  commerceHookIds: z.array(z.string()).default([]),
  subsections: z.array(SubsectionSchema).default([]),
  keywords: z.array(KeywordUseSchema).default([]),
  contextualImage: ImageSchema.nullable().default(null),
};

const IntroSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("intro"),
  type: z.literal("intro"),
  heading: z.null(),
  contextualImage: z.null().default(null)
});

const ProblemSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("problem"),
  type: z.literal("body"),
  heading: z.string().min(1),
  contextualImage: ImageSchema
});

const SolutionFrameworkSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("solution_framework"),
  type: z.literal("body"),
  heading: z.string().min(1),
});

const ProductRecommendationSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("product_recommendation"),
  type: z.literal("body"),
  heading: z.string().min(1),
  featuredAssetIds: z.array(z.string()).min(1).default([]),
  contextualImage: ImageSchema
});

const ObjectionsSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("objections"),
  type: z.literal("body"),
  heading: z.string().min(1),
});

const ConclusionCtaSectionSchema = z.object({
  ...BaseSectionFields,
  role: z.literal("conclusion_cta"),
  type: z.literal("conclusion"),
  heading: z.string().min(1),
  featuredAssetIds: z.array(z.string()).min(1).default([]),
  contextualImage: z.null().default(null)
});

const SectionSchema = z.discriminatedUnion("role", [
  IntroSectionSchema,
  ProblemSectionSchema,
  SolutionFrameworkSectionSchema,
  ProductRecommendationSectionSchema,
  ObjectionsSectionSchema,
  ConclusionCtaSectionSchema,
]);

export const ThumbnailSchema = ImageSchema;

type TemplateId = "problem_solution_product_v1";

const Templates = {
  problem_solution_product_v1: {
    roles: [
      "intro",
      "problem",
      "solution_framework",
      "product_recommendation",
      "objections",
      "conclusion_cta",
    ] as const,
    counts: {
      intro: { min: 1, max: 1 },
      problem: { min: 1, max: 1 },
      solution_framework: { min: 1, max: 1 },
      product_recommendation: { min: 1, max: 1 },
      objections: { min: 1, max: 1 },
      conclusion_cta: { min: 1, max: 1 },
    } as const,
  },
} satisfies Record<
  TemplateId,
  {
    roles: readonly z.infer<typeof RoleSchema>[];
    counts?: Partial<
      Record<z.infer<typeof RoleSchema>, { min: number; max: number }>
    >;
  }
>;

const TemplateIdSchema = z.enum(["problem_solution_product_v1"]);

function validateTemplate(outline: {
  templateId: TemplateId;
  sections: Array<{ role: z.infer<typeof RoleSchema> }>;
}) {
  const template = Templates[outline.templateId];
  const actualRoles = outline.sections.map((s) => s.role);
  const expectedRoles = template.roles;

  if (actualRoles.length !== expectedRoles.length) {
    return {
      ok: false as const,
      reason: `Expected ${expectedRoles.length} sections, got ${actualRoles.length}`,
    };
  }

  for (let i = 0; i < expectedRoles.length; i++) {
    if (actualRoles[i] !== expectedRoles[i]) {
      return {
        ok: false as const,
        reason: `Section ${i + 1} must be "${expectedRoles[i]}", got "${
          actualRoles[i]
        }"`,
      };
    }
  }

  const counts: Record<string, number> = {};
  for (const r of actualRoles) counts[r] = (counts[r] ?? 0) + 1;

  if (template.counts) {
    for (const [role, rule] of Object.entries(template.counts)) {
      const c = counts[role] ?? 0;
      if (c < rule!.min || c > rule!.max) {
        return {
          ok: false as const,
          reason: `Role "${role}" count must be ${rule!.min}..${
            rule!.max
          }, got ${c}`,
        };
      }
    }
  }

  return { ok: true as const };
}

function validateKeywords(outline: {
  sections: Array<{
    sectionId: string;
    role: z.infer<typeof RoleSchema>;
    keywords: Array<z.infer<typeof KeywordUseSchema>>;
  }>;
}) {
  const issues: string[] = [];

  const secondarySeen = new Map<string, { role: z.infer<typeof RoleSchema>; sectionId: string }[]>();

  let primaryExactIntro = 0;
  let primaryExactConclusion = 0;

  for (const s of outline.sections) {
    for (const ku of s.keywords ?? []) {
      const keyword = ku.keyword.trim();
      if (!keyword) continue;

      if (ku.kind === "secondary") {
        if (ku.match !== "exact") {
          issues.push(
            `Secondary keyword "${keyword}" must use match="exact" (sectionId=${s.sectionId}).`
          );
        }

        const arr = secondarySeen.get(keyword) ?? [];
        arr.push({ role: s.role, sectionId: s.sectionId });
        secondarySeen.set(keyword, arr);

        continue;
      }

      // primary
      if (ku.match === "exact") {
        if (s.role !== "intro" && s.role !== "conclusion_cta") {
          issues.push(
            `Primary keyword exact match not allowed in role "${s.role}" (sectionId=${s.sectionId}).`
          );
        }
        if (s.role === "intro") primaryExactIntro += 1;
        if (s.role === "conclusion_cta") primaryExactConclusion += 1;
      }

      if (ku.match === "semantic" && s.role !== "product_recommendation") {
        issues.push(
          `Primary keyword semantic match only allowed in role "product_recommendation" (sectionId=${s.sectionId}).`
        );
      }
    }
  }

  for (const [kw, placements] of secondarySeen.entries()) {
    if (placements.length > 1) {
      const where = placements.map((p) => `${p.role}:${p.sectionId}`).join(", ");
      issues.push(`Secondary keyword "${kw}" assigned multiple times across sections: ${where}.`);
    }
  }

  if (primaryExactIntro === 0) issues.push(`Primary keyword must appear with match="exact" in the intro section.`);
  if (primaryExactConclusion === 0) issues.push(`Primary keyword must appear with match="exact" in the conclusion_cta section.`);

  if (primaryExactIntro > 1) issues.push(`Primary keyword match="exact" appears more than once in the intro section.`);
  if (primaryExactConclusion > 1) issues.push(`Primary keyword match="exact" appears more than once in the conclusion_cta section.`);

  return issues;
}

export const OutlineSchema = z
  .object({
    templateId: TemplateIdSchema,
    title: z.string().min(1),
    metaData: MetaDataSchema,
    sections: z.array(SectionSchema).min(1),
    thumbnail: ThumbnailSchema,
  })
  .superRefine((val, ctx) => {
    const res = validateTemplate({
      templateId: val.templateId,
      sections: val.sections,
    });
    if (!res.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.reason,
        path: ["sections"],
      });
    }

    const kwIssues = validateKeywords({ sections: val.sections });
    console.log("kwIssues", kwIssues);
  for (const msg of kwIssues) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg, path: ["sections"] });
  }
  });

export type Outline = z.infer<typeof OutlineSchema>;
