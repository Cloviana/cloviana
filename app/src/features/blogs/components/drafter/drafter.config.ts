import {
  Feather,
  Package,
  KeyRound,
  Tags,
  Sliders,
  Target,
} from 'lucide-react';

export const STEPS_CONFIG = [
  {
    key: 'product',
    dbEnum: 'PRODUCT',
    title: 'Select Products',
    description:
      'Choose the specific inventory items or collections to promote.',
    icon: Package,
  },
  {
    key: 'audience-intent',
    dbEnum: 'AUDIENCE_INTENT',
    title: 'Audience & Search Intent',
    description: 'Define who you’re writing for and what they’re looking for.',
    icon: Target,
  },
  {
    key: 'topic',
    dbEnum: 'TOPIC',
    title: 'Blog Topic',
    description:
      'Establish the core subject matter distinct from the specific headline.',
    icon: Feather,
  },
  {
    key: 'primary-keyword',
    dbEnum: 'PRIMARY_KEYWORD',
    title: 'Primary Keyword',
    description:
      'The single most important search term for search engine ranking.',
    icon: KeyRound,
  },
  {
    key: 'secondary-keywords',
    dbEnum: 'SECONDARY_KEYWORDS',
    title: 'Secondary Keywords',
    description: 'Additional phrases to broaden reach and provide context.',
    icon: Tags,
  },
  {
    key: 'guidelines',
    dbEnum: 'GUIDELINES',
    title: 'Writing Guidelines',
    description:
      'Configure the tone of voice, call to action, and article length.',
    icon: Sliders,
  },
] as const;

export type DrafterKey = (typeof STEPS_CONFIG)[number]['key'];
export type DrafterDbEnum = (typeof STEPS_CONFIG)[number]['dbEnum'];
