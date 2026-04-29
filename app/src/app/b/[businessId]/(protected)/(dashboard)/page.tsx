'use client';

import { LayoutDashboard } from 'lucide-react';

import { Page, PageContent, PageHeader } from '@/components/ui/page';

export default function RootPage() {
  return (
    <Page>
      <PageHeader
        title="Dashboard"
        description="Your workspace is active. This dashboard is intentionally minimal for now."
      />
      <PageContent className="max-w-3xl">
        <section className="border-border bg-card flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center">
          <div className="bg-secondary/10 mb-5 rounded-full p-4">
            <LayoutDashboard className="text-secondary size-6" />
          </div>
          <h2 className="text-foreground text-lg font-semibold">
            Blank dashboard
          </h2>
          <p className="text-foreground/65 mt-2 max-w-xl text-sm">
            This business opens to a simplified workspace. Subscription
            management is still available from Settings.
          </p>
        </section>
      </PageContent>
    </Page>
  );
}
