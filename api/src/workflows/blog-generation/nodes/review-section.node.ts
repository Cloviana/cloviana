import path from "path";
import { fileURLToPath } from "url";
import { StateAnnotation } from "../blog-generation.state";
import { loadPromptHbs } from "@/workflows/blog-generation/utils/load-prompt-hbs.util";
import {
  ReviewSection,
  getReviewSchemaForRole,
} from "../schemas/review-section.schema";
import { GroqClient } from "@/clients/groq/groq.client";
import { REVIEW_PROMPT_MAP } from "@/workflows/blog-generation/constants/review-prompt";

export async function reviewSection(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const baseDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prompts"
  );
  const partialsDir = path.join(baseDir, "partials");

  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("reviewSection: _currentSectionId is null");

  const section = state._outline?.sections?.find((s) => s.sectionId === sectionId);
  if (!section) throw new Error(`reviewSection: section not found sectionId=${sectionId}`);

  const role = section.role as ReviewSection["role"];
  const schema = getReviewSchemaForRole(role);

  const sectionMarkdown = (state._sectionDrafts?.[sectionId] ?? "").trim();
  if (!sectionMarkdown) {
    return {
      _sectionCritique: schema.parse({
        pass: false,
        role,
        sectionId,
        summary: "No section draft found to review.",
        checklist: makeFailChecklist(role),
        missingTalkingPoints: section.talkingPoints ?? [],
        issues: [
          {
            severity: "high",
            ruleId: "goal_fulfillment",
            sectionId,
            location: { kind: "throughout", index: null },
            evidence: "Section draft is empty or missing.",
            fix: "Generate the section markdown before review.",
          },
        ],
      }),
    };
  }

  const prompt = await loadPromptHbs(REVIEW_PROMPT_MAP[role], {}, { baseDir, partialsDir });
  const client = new GroqClient();

  const payload = {
    context: state._context,
    strategy: state._strategy,
    section,
    sectionMarkdown,
    draftSoFar: {
      sectionIdsInOrder: state._sectionOrder ?? [],
      sectionDrafts: state._sectionDrafts ?? {},
    },
  };

  const critique = await client.chatJson<ReviewSection>({
    name: "ReviewSection",
    schema,
    model: "openai/gpt-oss-20b",
    temperature: 0.1,
    retries: 2,
    reasoningEffort: "low",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(payload) },
    ],
  });

  console.log(critique)

  return { _sectionCritique: critique };
}

function makeFailChecklist(role: ReviewSection["role"]) {
  const base = {
    no_meta_language: "fail",
    bullet_list_limits: "fail",
    no_labeled_subsections: "fail",
    no_repetition_vs_draft_so_far: "pass",
    no_new_claims: "pass",
    no_medical_certainty: "pass",
    grade_level_style: "fail",
    talking_points_coverage: "fail",
    goal_fulfillment: "fail",
    keyword_intent_satisfaction: "fail",
    defensibility_no_undefensible_lines: "pass",
  } as const;

  switch (role) {
    case "intro":
      return { ...base, heading_rules: "pass", no_products_in_disallowed_roles: "pass" };
    case "problem":
      return { ...base, heading_rules: "fail", no_products_in_disallowed_roles: "pass" };
    case "solution_framework":
      return { ...base, heading_rules: "fail", no_products_in_disallowed_roles: "pass" };
    case "product_recommendation":
      return {
        ...base,
        heading_rules: "fail",
        role_product_link_rules: "fail",
        product_first_link: "fail",
      };
    case "objections":
      return {
        ...base,
        heading_rules: "fail",
        role_product_link_rules: "fail",
        no_products_in_disallowed_roles: "fail",
      };
    case "conclusion_cta":
      return {
        ...base,
        heading_rules: "fail",
        role_product_link_rules: "fail",
        product_first_link: "fail",
        link_count_conclusion: "fail",
      };
  }
}
