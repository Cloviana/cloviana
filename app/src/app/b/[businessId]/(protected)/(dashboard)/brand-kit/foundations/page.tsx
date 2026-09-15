import { BrandKitTabs } from '@/features/brand-kit/components/brand-kit-tabs';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import {
  PageHeader,
  PageHeaderRow,
  PageHeaderTitle,
} from '@/features/dashboard/components/page-header';

import { WritingRulesWidget } from '../_widgets/writing-rules-widget';

import { ProfileWidget } from './_widgets/profile-widget';
import { VoiceWidget } from './_widgets/voice-widget';
import { WriterPersonaWidget } from './_widgets/writer-persona-widget';

type FoundationsPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function FoundationsPage({
  params,
}: FoundationsPageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout
      layout="grid"
      header={
        <PageHeader>
          <PageHeaderRow>
            <PageHeaderTitle>Brand</PageHeaderTitle>
          </PageHeaderRow>
          <PageHeaderRow>
            <BrandKitTabs businessId={businessId} />
          </PageHeaderRow>
        </PageHeader>
      }
    >
      <ProfileWidget className="col-span-12" />
      <VoiceWidget className="col-span-12" />
      <WriterPersonaWidget className="col-span-12" />
      <WritingRulesWidget scope="GLOBAL" className="col-span-12" />
    </DashboardPageLayout>
  );
}
