import {
  Page,
  PageContent,
  PageHeader,
  PageHeaderRow,
  PageTitle,
} from '@/components/layout/page';

export default function ProductOffersPage() {
  return (
    <Page width="full">
      <PageHeader>
        <PageHeaderRow>
          <PageTitle>Offers</PageTitle>
        </PageHeaderRow>
      </PageHeader>
      <PageContent className="pr-6" />
    </Page>
  );
}
