import {
  AIAnswerMonitorPreview,
  BrandMentionAlertPreview,
  ResearchFeedPreview,
  ResearchPromptPreview,
  SlackOnboardingPreview,
} from './components';
import type { FeatureCardBackground } from './components';
import type { SolutionFeature } from './types';

const NETWORK_BACKGROUND: FeatureCardBackground = {
  src: '/images/background/network-photo.png?v=2',
  blurDataURL:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAALCAYAAABCm8wlAAABNUlEQVR4ARTOzzMCYQDG8e++uxsp1O6KVBoMGuPXbAeDDi4OLv5WB9yZDpwMBzNxiMIodeiX2n1rX/Ucn89zeIRtJ5RlOcq2HbW6vKhy6YTKODFlzc2oWCSshGEa6IaJpgnafUmj80fX8xmOYBSAmICuC9A0gvHIDwTDMShghIaQ0icIApSaVDAXnWFnfYWUEyds6gjGmeBUyCS1tIC7vcHZUZ50KkU0EkaEdA3D0EnYFueHexy7+7xUavRkwJZ7gjADj1hIw0lm8cM25e9fWj2P7EGB3dMLxHByV3povSavTclXKEM0V2B+zUWPxBHt6SSelHxWyvy8PeGNQNlZWkPBoNtC9KNZGrObDJSOrH/wXrzk+e6GarlE5/EaIWYTeMk8Ncul6k9TkTHKdZ+H2yJX9yX+AQAA//+gTmfNAAAABklEQVQDAI7MealyphyxAAAAAElFTkSuQmCC',
};

const SOLUTION_FEATURES: SolutionFeature[] = [
  {
    id: 'onboarding-brief',
    title: 'Knowledge that compounds',
    mutedTitle: 'the longer it runs',
    layout: 'wide',
    Preview: SlackOnboardingPreview,
  },
  {
    id: 'answer-monitoring',
    title: 'Tracks buyer prompts',
    mutedTitle: 'daily, across every engine',
    layout: 'wide',
    Preview: AIAnswerMonitorPreview,
  },
  {
    id: 'research-feed',
    title: 'Writes to be recommended',
    mutedTitle: 'not just ranked',
    layout: 'tall',
    Preview: ResearchFeedPreview,
  },
  {
    id: 'research-prompt',
    title: 'Publishes research',
    mutedTitle: 'that earns citations in your industry',
    layout: 'tall',
    Preview: ResearchPromptPreview,
  },
  {
    id: 'brand-mention-alerts',
    title: 'Earns brand mentions',
    mutedTitle: 'where buyers get AI answers',
    layout: 'tall',
    Preview: BrandMentionAlertPreview,
    background: NETWORK_BACKGROUND,
  },
];

export const WIDE_SOLUTION_FEATURES = SOLUTION_FEATURES.filter(
  (feature) => feature.layout === 'wide',
);

export const TALL_SOLUTION_FEATURES = SOLUTION_FEATURES.filter(
  (feature) => feature.layout === 'tall',
);
