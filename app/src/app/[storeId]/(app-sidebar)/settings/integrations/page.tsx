'use client';

import { Page, PageContent, PageHeader } from '@/components/ui/page';

import { ShopifyIntegrationCard } from './_components/shopify-integration-card';

export default function IntegrationsPage() {
  return (
    <Page>
      <PageHeader
        title="Integrations"
        description="Manage all integrations in one place—commerce, analytics, storage, and CMS. Connect Shopify to sync products and inventory, add Google Analytics or GCS, and expand as your stack grows."
      />
      <PageContent>
        <section className="max-w-xl">
          <ShopifyIntegrationCard />
        </section>
      </PageContent>
    </Page>
  );
}
