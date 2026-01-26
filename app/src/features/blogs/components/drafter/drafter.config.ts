import { Feather, Package, KeyRound, Tags, LayoutList } from 'lucide-react';

export const STEPS_CONFIG = [
  {
    key: 'content-type',
    dbEnum: 'CONTENT_TYPE',
    title: 'Content Type',
    description:
      'Defines the structural framework the article will follow. This determines how information is organised and how the reader is guided through the piece.',
    icon: LayoutList,
  },
  {
    key: 'product',
    dbEnum: 'PRODUCT',
    title: 'Select your products',
    description:
      'Establishes the products or collections the article will reference. These selections influence examples, recommendations, and overall commercial alignment.',
    icon: Package,
  },
  {
    key: 'topic',
    dbEnum: 'TOPIC',
    title: 'Topic',
    description:
      'Sets the core subject the article will address at a conceptual level. It provides direction while remaining distinct from the final headline.',
    icon: Feather,
  },
  {
    key: 'primary-keyword',
    dbEnum: 'PRIMARY_KEYWORD',
    title: 'Primary Keyword',
    description:
      'Identifies the main search query the article is built around. This anchors the content to a clear intent and guides structure and emphasis.',
    icon: KeyRound,
  },
  {
    key: 'secondary-keywords',
    dbEnum: 'SECONDARY_KEYWORDS',
    title: 'Secondary Keywords',
    description:
      'Adds related terms that expand topical coverage. These help reinforce relevance and context without diluting focus.',
    icon: Tags,
  },
] as const;

export type DrafterKey = (typeof STEPS_CONFIG)[number]['key'];
export type DrafterDbEnum = (typeof STEPS_CONFIG)[number]['dbEnum'];
