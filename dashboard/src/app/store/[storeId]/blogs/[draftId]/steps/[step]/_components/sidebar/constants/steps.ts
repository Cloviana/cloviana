import { GenerationStep } from '@/types/api';

export const STEPS: {
  key: Exclude<GenerationStep, 'COMPLETE'>;
  label: string;
}[] = [
  { key: 'TOPIC', label: 'Enter a Topic' },
  { key: 'COMPETITORS', label: 'Select References' },
  { key: 'KEYWORD', label: 'Select Primary Keyword' },
  { key: 'TITLE', label: 'Select a Title' },
  { key: 'SECONDARY_KEYWORDS', label: 'Select Secondary Keywords' },
  { key: 'META', label: 'Additional Enhancements' },
  { key: 'REVIEW', label: 'Review & Generate' },
];
