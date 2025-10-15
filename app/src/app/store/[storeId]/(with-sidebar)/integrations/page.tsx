'use client';

import {
  Page,
  PageContent,
  PageHeader,
  PageParagraph,
  PageTitle,
} from '@/components/ui/page';

import { IntegrationList } from './_components/integration-list';

export default function IntegrationsPage() {
  return (
    <Page>
      <PageHeader>
        <PageTitle>Integrations</PageTitle>
        <PageParagraph>
          Connect your Shopify store to let Cloviana fully work with your shop.
          You can also link Google Console to help your pages get found faster
          and reach more customers.
        </PageParagraph>
      </PageHeader>

      <PageContent>
        <IntegrationList />
      </PageContent>
    </Page>
  );
}
