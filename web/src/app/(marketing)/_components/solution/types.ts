import type { ComponentType } from 'react';

import type { FeatureCardBackground } from './components/feature-card';

export type SolutionFeatureLayout = 'wide' | 'tall';

export type SolutionFeature = {
  id: string;
  title: string;
  mutedTitle: string;
  layout: SolutionFeatureLayout;
  Preview: ComponentType;
  background?: FeatureCardBackground;
};
