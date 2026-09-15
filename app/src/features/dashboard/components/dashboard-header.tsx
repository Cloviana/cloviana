import { AudioWaveform, BellRing } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AccountChip } from '@/features/auth/components/account-chip';

export function DashboardHeader() {
  return (
    <header className="bg-surface border-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <div className="flex-1"></div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="secondary" size={'sm'}>
          <AudioWaveform />
          AI Assistant
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Notifications"
        >
          <BellRing />
        </Button>
        <AccountChip />
      </div>
    </header>
  );
}
