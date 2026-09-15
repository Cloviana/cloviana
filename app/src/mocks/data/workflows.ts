import type {
  Workflow,
  WorkflowRun,
  WorkflowStepRun,
  WorkflowSummary,
  WorkflowTemplate,
  WorkflowVersion,
} from '@/features/workflows/model';

type MockWorkflowDatabase = {
  templates: WorkflowTemplate[];
  workflows: Workflow[];
  versions: WorkflowVersion[];
  runs: WorkflowRun[];
  stepRuns: WorkflowStepRun[];
};

export const mockWorkflowDatabase: MockWorkflowDatabase = {
  templates: [],
  workflows: [],
  versions: [],
  runs: [],
  stepRuns: [],
};

export const mockWorkflowSummaries: WorkflowSummary[] = [
  {
    id: 'workflow-content-refresh',
    businessId: 'mock-business',
    name: 'Refresh declining content',
    description:
      'Find underperforming pages, update them, and prepare changes for review.',
    status: 'active',
    updatedAt: '2026-08-16T09:10:00.000Z',
    lastRun: {
      id: 'run-content-refresh-001',
      status: 'completed',
      startedAt: '2026-08-16T09:20:00.000Z',
      completedAt: '2026-08-16T09:24:00.000Z',
    },
  },
];
