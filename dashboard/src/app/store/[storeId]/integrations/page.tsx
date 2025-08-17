import Image from 'next/image';

import { Button } from '@/components/actions';
import * as Page from '@/components/layout/page';

export default function IntegrationsPage() {
  return (
    <Page.Root>
      <Page.Header>
        <Page.Title>Integrations</Page.Title>
      </Page.Header>

      <Page.Content centeredLayout>
        <div className="flex max-w-md flex-col gap-5 md:max-w-xs">
          <Image
            src={'/icons/shopify-logo-full.svg'}
            alt="Shopify icon"
            priority
            sizes="120px"
            width={120}
            height={120}
            className="object-contain"
          />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-foreground">Integration</h3>
            <p className="text-xs text-foreground-light">
              Connect your Shopify store to seamlessly sync products,
              collections, and blog posts. Our AI SEO engine turns your catalog
              into search-ready content with consistent metadata, clean slugs,
              and internal links — all aligned to your brand voice and markets.
            </p>
          </div>
          <Button variant="secondary" size="sm" icon="add" className="w-fit">
            Connect Shopify
          </Button>
        </div>
      </Page.Content>
    </Page.Root>
  );
}
