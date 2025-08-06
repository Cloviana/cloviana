import { GenerationStep } from '@/types/api';

export const STEPS: {
  key: Exclude<GenerationStep, 'COMPLETE'>;
  label: string;
}[] = [
  { key: 'TOPIC', label: 'Enter a Topic' },
  { key: 'KEYWORD', label: 'Select Primary Keyword' },
  { key: 'TITLE', label: 'Select a Title' },
  { key: 'META', label: 'Additional Enhancements' },
];
