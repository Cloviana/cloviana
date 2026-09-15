import { z } from 'zod';

const idSchema = z.string().min(1);
const isoDateSchema = z.iso.datetime();

export const workflowNodeTypeSchema = z.enum([
  'trigger.manual',
  'research',
  'generate',
  'review',
  'condition',
  'publish',
]);

export const workflowNodeSchema = z
  .object({
    id: idSchema,
    type: workflowNodeTypeSchema,
    name: z.string().min(1),
    config: z.record(z.string(), z.unknown()),
    ui: z
      .object({
        position: z
          .object({
            x: z.number(),
            y: z.number(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export const workflowEdgeSchema = z
  .object({
    id: idSchema,
    source: idSchema,
    target: idSchema,
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
  })
  .strict();

export const workflowDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    nodes: z.array(workflowNodeSchema),
    edges: z.array(workflowEdgeSchema),
    viewport: z
      .object({
        x: z.number(),
        y: z.number(),
        zoom: z.number().positive(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const workflowSetupStepSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    nodeId: idSchema,
  })
  .strict();

export const workflowTemplateSchema = z
  .object({
    id: idSchema,
    slug: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    category: z.string().min(1),
    definition: workflowDefinitionSchema,
    setupSteps: z.array(workflowSetupStepSchema),
    version: z.number().int().positive(),
  })
  .strict();

export const workflowStatusSchema = z.enum([
  'draft',
  'active',
  'paused',
  'archived',
]);

export const workflowSchema = z
  .object({
    id: idSchema,
    businessId: idSchema,
    name: z.string().min(1),
    description: z.string().optional(),
    status: workflowStatusSchema,
    sourceTemplateId: idSchema.optional(),
    draftDefinition: workflowDefinitionSchema,
    publishedVersionId: idSchema.optional(),
    createdById: idSchema,
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
  })
  .strict();

export const workflowVersionSchema = z
  .object({
    id: idSchema,
    workflowId: idSchema,
    version: z.number().int().positive(),
    definition: workflowDefinitionSchema,
    createdAt: isoDateSchema,
  })
  .strict();

export const workflowRunStatusSchema = z.enum([
  'queued',
  'running',
  'waiting_for_approval',
  'completed',
  'failed',
  'cancelled',
]);

export const workflowTriggerSchema = z.enum([
  'manual',
  'schedule',
  'webhook',
  'event',
]);

export const workflowRunSchema = z
  .object({
    id: idSchema,
    workflowId: idSchema,
    workflowVersionId: idSchema,
    status: workflowRunStatusSchema,
    trigger: workflowTriggerSchema,
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    error: z.unknown().optional(),
    startedAt: isoDateSchema.optional(),
    completedAt: isoDateSchema.optional(),
  })
  .strict();

export const workflowSummarySchema = workflowSchema
  .pick({
    id: true,
    businessId: true,
    name: true,
    description: true,
    status: true,
    updatedAt: true,
  })
  .extend({
    lastRun: workflowRunSchema
      .pick({
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
      })
      .nullable(),
  })
  .strict();

export const workflowStepRunStatusSchema = z.enum([
  'pending',
  'running',
  'waiting_for_approval',
  'completed',
  'failed',
  'skipped',
]);

export const workflowStepRunSchema = z
  .object({
    id: idSchema,
    workflowRunId: idSchema,
    nodeId: idSchema,
    status: workflowStepRunStatusSchema,
    attempt: z.number().int().positive(),
    input: z.unknown().optional(),
    output: z.unknown().optional(),
    error: z.unknown().optional(),
    startedAt: isoDateSchema.optional(),
    completedAt: isoDateSchema.optional(),
  })
  .strict();

export type WorkflowNodeType = z.infer<typeof workflowNodeTypeSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowSetupStep = z.infer<typeof workflowSetupStepSchema>;
export type WorkflowTemplate = z.infer<typeof workflowTemplateSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowVersion = z.infer<typeof workflowVersionSchema>;
export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>;
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export type WorkflowSummary = z.infer<typeof workflowSummarySchema>;
export type WorkflowStepRunStatus = z.infer<typeof workflowStepRunStatusSchema>;
export type WorkflowStepRun = z.infer<typeof workflowStepRunSchema>;
