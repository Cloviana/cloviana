import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';

export default function StorePage() {
  return (
    <Page width="full">
      <PageHeader>
        <PageHeaderRow>
          <PageTitle>Store</PageTitle>
        </PageHeaderRow>
      </PageHeader>
      <PageContent className="pr-6" />
    </Page>
  );
}
