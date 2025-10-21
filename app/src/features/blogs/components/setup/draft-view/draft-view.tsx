'use client';

import { EnhancementsView } from '@/features/blogs/components/setup/draft-view/components/enhancements-view';
import { PrimaryKeywordView } from '@/features/blogs/components/setup/draft-view/components/primary-keyword-view';
import { ProductView } from '@/features/blogs/components/setup/draft-view/components/product-view';
import { SecondaryKeywordsView } from '@/features/blogs/components/setup/draft-view/components/secondary-keywords-view';
import { TitleView } from '@/features/blogs/components/setup/draft-view/components/title-view';
import { TopicView } from '@/features/blogs/components/setup/draft-view/components/topic-view';
import { useDrafter } from '@/features/blogs/context/drafter';

const VIEWS: Record<ReturnType<typeof useDrafter>['currentKey'], React.FC> = {
  topic: TopicView,
  'primary-keyword': PrimaryKeywordView,
  title: TitleView,
  'secondary-keywords': SecondaryKeywordsView,
  product: ProductView,
  enhancements: EnhancementsView,
};

export const DraftView = () => {
  const { currentKey } = useDrafter();
  const View = VIEWS[currentKey] ?? TopicView;
  return <View />;
};
