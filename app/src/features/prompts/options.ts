import type { AiEngine, PromptBranding, PromptStage } from './types';

/**
 * Display labels for the prompt enums, in the order the UI shows them. Filters,
 * forms and tables all read from here so a renamed stage is renamed everywhere.
 */

export const brandingOptions: Array<{ value: PromptBranding; label: string }> =
  [
    { value: 'BRANDED', label: 'Branded' },
    { value: 'UNBRANDED', label: 'Unbranded' },
  ];

export const stageOptions: Array<{ value: PromptStage; label: string }> = [
  { value: 'AWARENESS', label: 'Awareness' },
  { value: 'CONSIDERATION', label: 'Consideration' },
  { value: 'EVALUATE', label: 'Evaluate' },
  { value: 'DECIDE', label: 'Decide' },
];

/** Engines carry a domain too, which is where their favicon comes from. */
export const engineOptions: Array<{
  value: AiEngine;
  label: string;
  domain: string;
}> = [
  { value: 'CHATGPT', label: 'ChatGPT', domain: 'chatgpt.com' },
  { value: 'CLAUDE', label: 'Claude', domain: 'claude.ai' },
  { value: 'PERPLEXITY', label: 'Perplexity', domain: 'perplexity.ai' },
  { value: 'AI_OVERVIEWS', label: 'AI Overviews', domain: 'google.com' },
];

export const getBrandingLabel = (branding: PromptBranding) =>
  brandingOptions.find((option) => option.value === branding)?.label ??
  branding;

export const getStageLabel = (stage: PromptStage) =>
  stageOptions.find((option) => option.value === stage)?.label ?? stage;

export const getEngineOption = (engine: AiEngine) =>
  engineOptions.find((option) => option.value === engine) ?? {
    value: engine,
    label: engine,
    domain: '',
  };

export const isPromptBranding = (value: string): value is PromptBranding =>
  brandingOptions.some((option) => option.value === value);

export const isPromptStage = (value: string): value is PromptStage =>
  stageOptions.some((option) => option.value === value);

export const isAiEngine = (value: string): value is AiEngine =>
  engineOptions.some((option) => option.value === value);
