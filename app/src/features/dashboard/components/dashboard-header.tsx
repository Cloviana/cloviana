import { AccountChip } from '@/features/auth/components/account-chip';

export function DashboardHeader() {
  return (
    <header className="bg-sidebar border-sidebar-border flex h-12 shrink-0 border-b px-3.5">
      <div className="flex-1"></div>
      <div className="flex h-full items-center gap-3.5">
        <AccountChip />
      </div>
    </header>
  );
}
