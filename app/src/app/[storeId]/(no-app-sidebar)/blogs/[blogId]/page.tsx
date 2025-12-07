import { AppHeader } from '@/app/_components/header';
import {
  DrafterContainer,
  DrafterProvider,
  SidebarTrigger,
} from '@/features/blogs/components/drafter';

export default async function DraftSetupPage() {
  return (
    <DrafterProvider>
      <div className="bg-studio flex h-screen w-full flex-col overflow-hidden">
        <header className="border-b">
          <AppHeader sidebarTrigger={<SidebarTrigger />} />
        </header>
        <DrafterContainer className="relative min-h-0 flex-1" />
      </div>
    </DrafterProvider>
  );
}
