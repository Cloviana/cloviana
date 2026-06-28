import Image from 'next/image';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { AddKnowledgeSheet } from '@/features/knowledge/components/add-knowledge-sheet';

export default function KnowledgePage() {
  return (
    <DashboardPageLayout header={<DashboardHeader />} content="centered">
      <Empty className="border-0 bg-transparent p-0 md:p-0">
        <EmptyMedia>
          <Image
            src="/images/databases.svg"
            width={96}
            height={144}
            alt=""
            aria-hidden="true"
            priority
            className="object-contain"
          />
        </EmptyMedia>
        <EmptyHeader className="gap-2">
          <EmptyTitle>No knowledge sources yet</EmptyTitle>
          <EmptyDescription className="max-w-xl">
            Add business and domain context so the agent understands your
            company, customers, and category
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <AddKnowledgeSheet />
        </EmptyContent>
      </Empty>
    </DashboardPageLayout>
  );
}
