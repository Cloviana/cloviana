import { z } from "zod";
import {
  COMPARISON_ROLES,
  PROBLEM_SOLUTION_ROLES,
  type RoleValue,
  TEMPLATE_IDS,
  TEMPLATE_ROLE_SEQUENCES,
  type TemplateId,
  type TemplateRole,
} from "../constants/roles.constants";

export const ProblemSolutionRoleSchema = z.enum(PROBLEM_SOLUTION_ROLES);
export const ComparisonRoleSchema = z.enum(COMPARISON_ROLES);
export const RoleSchema = z.enum(
  Array.from(new Set([...PROBLEM_SOLUTION_ROLES, ...COMPARISON_ROLES])) as [
    RoleValue,
    ...RoleValue[],
  ],
);
export const TemplateIdSchema = z.enum(TEMPLATE_IDS);

export { TEMPLATE_ROLE_SEQUENCES, type TemplateId, type TemplateRole };
