import { AudioWaveform, BellRing, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { AccountChip } from '@/features/auth/components/account-chip';

export function DashboardHeader() {
  return (
    <header className="bg-surface border-border flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <InputGroup className="min-w-0 flex-1">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          aria-label="Search"
          placeholder="Search for people, companies, sequences, deals and more..."
        />
      </InputGroup>

      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" variant="outline" size={'sm'}>
          2.4K credits
        </Button>
        <Button
          type="button"
          variant="secondary"
          size={'sm'}
          className="text-background bg-[oklch(36.03%_0.0067_48.45)] hover:bg-[oklch(36.03%_0.0067_48.45)]/90 dark:bg-[oklch(77.92%_0.0045_314.8)] dark:hover:bg-[oklch(77.92%_0.0045_314.8)]/90"
        >
          <AudioWaveform />
          AI Assistant
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <BellRing />
        </Button>
        <AccountChip />
      </div>
    </header>
  );
}
