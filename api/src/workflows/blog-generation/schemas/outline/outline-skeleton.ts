import {
  ROLE,
  ROLE_WORD_WEIGHTS,
  TemplateId,
  TemplateRole,
} from "@/workflows/blog-generation/constants/roles.constants";
import { Block, TODO } from "./blocks.schema";

type SeoInput = {
  primaryKeyword: string;
};

type BaseOutlineArgs = {
  totalWordCount: number;
  thumbnailReferencedAssetIds: string[] | null;
  seo: SeoInput;
};

export type CreateOutlineSkeletonArgs =
  | (BaseOutlineArgs & {
      templateId: "problem-solution";
      productRecommendationReferencedAssetId: string | null;
    })
  | (BaseOutlineArgs & {
      templateId: "comparison";
      featuredProductReferencedAssetIds: string[];
    });

function computeRoleWordCounts<T extends TemplateId>(
  templateId: T,
  totalWordCount: number,
): Record<TemplateRole<T>, number> {
  const weights = ROLE_WORD_WEIGHTS[templateId] as Record<
    TemplateRole<T>,
    number
  >;
  const roles = Object.keys(weights) as Array<TemplateRole<T>>;

  const out: Partial<Record<TemplateRole<T>, number>> = {};
  let used = 0;

  roles.forEach((role, index) => {
    if (index === roles.length - 1) {
      out[role] = totalWordCount - used;
    } else {
      const v = Math.floor(totalWordCount * weights[role]);
      out[role] = v;
      used += v;
    }
  });

  return out as Record<TemplateRole<T>, number>;
}

function baseSection<T extends TemplateId>(args: {
  sectionId: string;
  role: TemplateRole<T>;
  estimatedWordCount: number;
  heading: string | null;
  blocks: Block[];
}) {
  return {
    sectionId: args.sectionId,
    role: args.role,
    estimatedWordCount: args.estimatedWordCount,
    goal: TODO,
    blocks: args.blocks,
    commerceHookIds: [],
    subsections: [],
    keywords: [],
    heading: args.heading,
  } as const;
}

function p(n: number): Block {
  return {
    type: "paragraph",
    goal: TODO,
    points: Array.from({ length: n }, () => TODO),
  };
}

function b(n: number): Block {
  return {
    type: "bullets",
    goal: TODO,
    points: Array.from({ length: n }, () => TODO),
  };
}

function n(nItems: number): Block {
  return {
    type: "numbered",
    goal: TODO,
    points: Array.from({ length: nItems }, () => TODO),
  };
}

function blocksForComparisonRole(role: string): Block[] {
  switch (role) {
    case ROLE.INTRO:
      return [p(3)];

    case ROLE.SHARED_BASELINE:
      return [p(3), p(3)];

    case ROLE.OPTION_A_ANALYSIS:
    case ROLE.OPTION_B_ANALYSIS:
      return [p(3), b(3)];

    case ROLE.WHO_SHOULD_CHOOSE:
      return [p(2), b(4)];

    case ROLE.DECISION_AND_RECOMMENDATION:
      return [p(2), b(3), p(2)];

    default:
      return [p(3)];
  }
}

function blocksForProblemSolutionRole(role: string): Block[] {
  switch (role) {
    case ROLE.INTRO:
      return [p(3)];

    case ROLE.PROBLEM:
      return [p(2), p(2)];

    case ROLE.SOLUTION_FRAMEWORK:
      return [p(2), p(2), n(3)];

    case ROLE.PRODUCT_RECOMMENDATION:
      return [p(2), p(2)];

    case ROLE.OBJECTIONS:
      return [p(2), b(3)];

    case ROLE.CONCLUSION_CTA:
      return [p(3)];

    default:
      return [p(3)];
  }
}

export function createOutlineSkeleton(args: CreateOutlineSkeletonArgs) {
  if (args.templateId === "comparison") {
    const wc = computeRoleWordCounts("comparison", args.totalWordCount);

    return {
      templateId: "comparison" as const,
      title: TODO,
      metaData: { description: TODO },
      thumbnail: {
        intent: "thumbnail" as const,
        sceneDescription: TODO,
        angle: "three_quarter" as const,
        referencedAssetIds: args.thumbnailReferencedAssetIds,
        altText: TODO,
        url: null,
      },
      sections: [
        {
          ...baseSection<"comparison">({
            sectionId: ROLE.INTRO,
            role: ROLE.INTRO,
            blocks: blocksForComparisonRole(ROLE.INTRO),
            estimatedWordCount: wc[ROLE.INTRO],
            heading: null,
          }),
          keywords: [args.seo.primaryKeyword],
        },
        baseSection<"comparison">({
          sectionId: ROLE.SHARED_BASELINE,
          role: ROLE.SHARED_BASELINE,
          blocks: blocksForComparisonRole(ROLE.SHARED_BASELINE),
          estimatedWordCount: wc[ROLE.SHARED_BASELINE],
          heading: TODO,
        }),
        {
          ...baseSection<"comparison">({
            sectionId: ROLE.OPTION_A_ANALYSIS,
            role: ROLE.OPTION_A_ANALYSIS,
            blocks: blocksForComparisonRole(ROLE.OPTION_A_ANALYSIS),
            estimatedWordCount: wc[ROLE.OPTION_A_ANALYSIS],
            heading: TODO,
          }),
          keywords: [args.seo.primaryKeyword],
          contextualImage: {
            intent: "comparison_product" as const,
            sceneDescription: TODO,
            angle: "top_down" as const,
            referencedAssetIds: [],
            altText: TODO,
            url: null,
          },
        },
        {
          ...baseSection<"comparison">({
            sectionId: ROLE.OPTION_B_ANALYSIS,
            role: ROLE.OPTION_B_ANALYSIS,
            blocks: blocksForComparisonRole(ROLE.OPTION_B_ANALYSIS),
            estimatedWordCount: wc[ROLE.OPTION_B_ANALYSIS],
            heading: TODO,
          }),
          keywords: [args.seo.primaryKeyword],
          contextualImage: {
            intent: "comparison_product" as const,
            sceneDescription: TODO,
            angle: "three_quarter" as const,
            referencedAssetIds: [],
            altText: TODO,
            url: null,
          },
        },
        {
          ...baseSection<"comparison">({
            sectionId: ROLE.WHO_SHOULD_CHOOSE,
            role: ROLE.WHO_SHOULD_CHOOSE,
            blocks: blocksForComparisonRole(ROLE.WHO_SHOULD_CHOOSE),
            estimatedWordCount: wc[ROLE.WHO_SHOULD_CHOOSE],
            heading: TODO,
          }),
        },
        {
          ...baseSection<"comparison">({
            sectionId: ROLE.DECISION_AND_RECOMMENDATION,
            role: ROLE.DECISION_AND_RECOMMENDATION,
            blocks: blocksForComparisonRole(ROLE.DECISION_AND_RECOMMENDATION),
            estimatedWordCount: wc[ROLE.DECISION_AND_RECOMMENDATION],
            heading: TODO,
          }),
          keywords: [args.seo.primaryKeyword],
          featuredAssetIds: args.featuredProductReferencedAssetIds,
        },
      ],
    } as const;
  }

  const wc = computeRoleWordCounts("problem-solution", args.totalWordCount);

  return {
    templateId: "problem-solution" as const,
    title: TODO,
    metaData: { description: TODO },
    thumbnail: {
      intent: "thumbnail" as const,
      sceneDescription: TODO,
      angle: "three_quarter" as const,
      referencedAssetIds: args.thumbnailReferencedAssetIds,
      altText: TODO,
      url: null,
    },
    sections: [
      {
        ...baseSection<"problem-solution">({
          sectionId: ROLE.INTRO,
          role: ROLE.INTRO,
          blocks: blocksForProblemSolutionRole(ROLE.INTRO),
          estimatedWordCount: wc[ROLE.INTRO],
          heading: null,
        }),
        keywords: [args.seo.primaryKeyword],
      },
      {
        ...baseSection<"problem-solution">({
          sectionId: ROLE.PROBLEM,
          role: ROLE.PROBLEM,
          blocks: blocksForProblemSolutionRole(ROLE.PROBLEM),
          estimatedWordCount: wc[ROLE.PROBLEM],
          heading: TODO,
        }),
        contextualImage: {
          intent: "problem" as const,
          sceneDescription: TODO,
          angle: "three_quarter" as const,
          referencedAssetIds: null,
          altText: TODO,
          url: null,
        },
      },
      baseSection<"problem-solution">({
        sectionId: ROLE.SOLUTION_FRAMEWORK,
        role: ROLE.SOLUTION_FRAMEWORK,
        blocks: blocksForProblemSolutionRole(ROLE.SOLUTION_FRAMEWORK),
        estimatedWordCount: wc[ROLE.SOLUTION_FRAMEWORK],
        heading: TODO,
      }),
      {
        ...baseSection<"problem-solution">({
          sectionId: ROLE.PRODUCT_RECOMMENDATION,
          role: ROLE.PRODUCT_RECOMMENDATION,
          blocks: blocksForProblemSolutionRole(ROLE.PRODUCT_RECOMMENDATION),
          estimatedWordCount: wc[ROLE.PRODUCT_RECOMMENDATION],
          heading: TODO,
        }),
        keywords: [args.seo.primaryKeyword],
        contextualImage: {
          intent: "product_recommendation" as const,
          sceneDescription: TODO,
          angle: "front" as const,
          referencedAssetIds: [args.productRecommendationReferencedAssetId],
          altText: TODO,
          url: null,
        },
        featuredAssetIds: [args.productRecommendationReferencedAssetId],
      },
      {
        ...baseSection<"problem-solution">({
          sectionId: ROLE.OBJECTIONS,
          role: ROLE.OBJECTIONS,
          blocks: blocksForProblemSolutionRole(ROLE.OBJECTIONS),
          estimatedWordCount: wc[ROLE.OBJECTIONS],
          heading: TODO,
        }),
        featuredAssetIds: [args.productRecommendationReferencedAssetId],
      },
      {
        ...baseSection<"problem-solution">({
          sectionId: ROLE.CONCLUSION_CTA,
          role: ROLE.CONCLUSION_CTA,
          blocks: blocksForProblemSolutionRole(ROLE.CONCLUSION_CTA),
          estimatedWordCount: wc[ROLE.CONCLUSION_CTA],
          heading: TODO,
        }),
        keywords: [args.seo.primaryKeyword],
        featuredAssetIds: [args.productRecommendationReferencedAssetId],
      },
    ],
  } as const;
}
