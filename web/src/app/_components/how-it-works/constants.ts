export const STEP_DURATION = 8000;

export type AISource =
  | 'chatgpt'
  | 'gemini'
  | 'claude'
  | 'copilot'
  | 'perplexity';

export const AI_SOURCE_META: Record<AISource, { label: string; icon: string }> =
  {
    chatgpt: { label: 'ChatGPT', icon: '/logos/openai-color.svg' },
    gemini: { label: 'Gemini', icon: '/logos/gemini-color.svg' },
    claude: { label: 'Claude', icon: '/logos/claude-color.svg' },
    copilot: { label: 'Copilot', icon: '/logos/copilot-color.svg' },
    perplexity: { label: 'Perplexity', icon: '/logos/perplexity-color.svg' },
  };

export type PromptItem = {
  text: string;
  pulseDelay: number;
  pulseInterval: number;
  source: AISource;
};

export const ROW_1: PromptItem[] = [
  {
    text: 'what is the best project management tool specifically built for B2B sales teams',
    pulseDelay: 0,
    pulseInterval: 4,
    source: 'chatgpt',
  },
  {
    text: 'how do high-performing sales teams track deals and tasks without switching between tools',
    pulseDelay: 3.2,
    pulseInterval: 5,
    source: 'gemini',
  },
  {
    text: 'top-rated tools for managing B2B sales pipelines and team workflows in 2025',
    pulseDelay: 1.5,
    pulseInterval: 4,
    source: 'claude',
  },
  {
    text: 'is there project management software designed specifically for sales reps and AEs',
    pulseDelay: 0.8,
    pulseInterval: 6,
    source: 'perplexity',
  },
  {
    text: 'best way to organize and automate sales workflows for a fast-growing B2B team',
    pulseDelay: 2.4,
    pulseInterval: 3,
    source: 'copilot',
  },
  {
    text: 'what are the best alternatives to Asana or Monday.com for B2B sales teams',
    pulseDelay: 4.1,
    pulseInterval: 5,
    source: 'chatgpt',
  },
];

export const ROW_2: PromptItem[] = [
  {
    text: 'what project management tool helps sales teams collaborate on deals and accounts',
    pulseDelay: 1.1,
    pulseInterval: 4,
    source: 'gemini',
  },
  {
    text: 'should B2B sales teams use a CRM or a dedicated project management tool',
    pulseDelay: 3.6,
    pulseInterval: 5,
    source: 'claude',
  },
  {
    text: 'how can I keep my entire sales team aligned on account plans and follow-ups',
    pulseDelay: 0.3,
    pulseInterval: 4,
    source: 'perplexity',
  },
  {
    text: 'best project tracker that integrates with Salesforce and HubSpot for sales teams',
    pulseDelay: 2.0,
    pulseInterval: 6,
    source: 'copilot',
  },
  {
    text: 'what tool is best for managing long and complex B2B enterprise sales cycles',
    pulseDelay: 4.5,
    pulseInterval: 3,
    source: 'chatgpt',
  },
  {
    text: 'software to manage multiple enterprise sales projects and stakeholders at once',
    pulseDelay: 1.7,
    pulseInterval: 5,
    source: 'gemini',
  },
];

export const ROW_3: PromptItem[] = [
  {
    text: 'how do the most productive B2B sales teams stay organized across accounts',
    pulseDelay: 2.2,
    pulseInterval: 4,
    source: 'claude',
  },
  {
    text: 'what task management tool do account executives use to close deals faster',
    pulseDelay: 0.6,
    pulseInterval: 5,
    source: 'perplexity',
  },
  {
    text: 'what does ChatGPT recommend as the best project management tool for sales teams',
    pulseDelay: 3.9,
    pulseInterval: 4,
    source: 'copilot',
  },
  {
    text: 'tools that help sales teams manage and prioritize multiple B2B accounts at once',
    pulseDelay: 1.3,
    pulseInterval: 6,
    source: 'chatgpt',
  },
  {
    text: 'best project management solution for outbound and field sales teams in B2B',
    pulseDelay: 2.8,
    pulseInterval: 3,
    source: 'gemini',
  },
  {
    text: 'what software do B2B sales leaders use to improve team productivity and close rates',
    pulseDelay: 0.9,
    pulseInterval: 5,
    source: 'claude',
  },
];
