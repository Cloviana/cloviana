import { Page } from '@/components/layout';

import { DashboardShell } from '../_components/dashboard-shell';

import { IntegrationsList, ShopifyCard } from './_components';

export default function IntegrationsPage() {
  return (
    <DashboardShell>
      <Page title="Integrations">
        <IntegrationsList>
          <ShopifyCard />
        </IntegrationsList>
      </Page>
    </DashboardShell>
  );
}
