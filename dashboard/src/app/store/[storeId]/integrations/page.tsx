import { Page } from '@/components/layout';

import { IntegrationsList, ShopifyCard } from './_components';

export default function IntegrationsPage() {
  return (
    <Page title="Integrations">
      <IntegrationsList>
        <ShopifyCard />
      </IntegrationsList>
    </Page>
  );
}
