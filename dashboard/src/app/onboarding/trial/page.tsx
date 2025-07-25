'use client';

import { SplitLayout } from '@/components/layout';

import { OfferSection, OfferPreview } from './_components';

const Page = () => (
  <SplitLayout left={<OfferSection />} right={<OfferPreview />} />
);

export default Page;
