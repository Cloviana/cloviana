import { Activity, CalendarClock, CirclePlay } from 'lucide-react';

import type { FilterFieldConfig } from '@/components/ui/filter-sidebar';

export const WORKFLOW_FILTER_FIELDS: FilterFieldConfig<string>[] = [
  {
    key: 'status',
    label: 'Workflow status',
    icon: Activity,
    type: 'multiselect',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'draft', label: 'Draft' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'runStatus',
    label: 'Run outcome',
    icon: CirclePlay,
    type: 'multiselect',
    options: [
      { value: 'queued', label: 'Queued' },
      { value: 'running', label: 'Running' },
      { value: 'waiting_for_approval', label: 'Needs approval' },
      { value: 'completed', label: 'Completed' },
      { value: 'failed', label: 'Failed' },
      { value: 'cancelled', label: 'Cancelled' },
    ],
  },
  {
    key: 'lastRun',
    label: 'Last run',
    icon: CalendarClock,
    type: 'select',
    options: [
      { value: 'today', label: 'Today' },
      { value: '7d', label: 'Past week' },
      { value: '30d', label: 'Past month' },
      { value: 'never', label: 'Never run' },
    ],
  },
  {
    key: 'modified',
    label: 'Last modified',
    icon: CalendarClock,
    type: 'select',
    options: [
      { value: 'today', label: 'Today' },
      { value: '7d', label: 'Past week' },
      { value: '30d', label: 'Past month' },
    ],
  },
];
