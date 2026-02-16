import { QueryClient } from '@tanstack/react-query';
import { redirect } from 'next/navigation';

import { AppHeader } from '@/app/_components/header';
import { paths } from '@/config/paths';
import { getBlogQueryOptions } from '@/features/blogs/api/get-blog';
import {
  DrafterContainer,
  DrafterProvider,
} from '@/features/blogs/components/drafter';

export default async function DraftSetupPage({
  params,
}: {
  params: Promise<{
    blogId: string;
    storeId: string;
  }>;
}) {
  const qc = new QueryClient();

  const { blogId, storeId } = await params;

  const blog = await qc.fetchQuery(getBlogQueryOptions(storeId, blogId));

  if (blog.currentStep === 'COMPLETED') {
    redirect(paths.store.blogs.editor.getHref(storeId, blogId));
  }

  return (
    <DrafterProvider>
      <div className="bg-studio flex h-screen w-full flex-col overflow-hidden">
        <header className="border-b">
          <AppHeader />
        </header>

        <main className="bg-background min-h-0 flex-1 overflow-y-auto px-4">
          <DrafterContainer />
        </main>
      </div>
    </DrafterProvider>
  );
}
