'use client';

import { Page, PageContent, PageHeader } from '@/components/ui/page';
import { Plans } from '@/features/billing/components/plans';

export default function SubscriptionPage() {
  return (
    <Page>
      <PageHeader
        title="Current Plan"
        description="Review your store's current plan, billing cycle, and included usage. Upgrade, downgrade, or cancel anytime."
      />
      <PageContent className="max-w-6xl">
        <Plans />
      </PageContent>
    </Page>
  );
}
