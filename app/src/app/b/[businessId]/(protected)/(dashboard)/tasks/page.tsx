import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { DashboardPageLayout } from '@/features/dashboard/components/dashboard-page-layout';
import { TaskBoard } from '@/features/tasks/components/task-board';

type PageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function TasksPage({ params }: PageProps) {
  const { businessId } = await params;

  return (
    <DashboardPageLayout header={<DashboardHeader />}>
      <TaskBoard businessId={businessId} />
    </DashboardPageLayout>
  );
}
