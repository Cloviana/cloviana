'use client';

import { Button } from '@/components/ui/button';

import { useChatActions } from './chat-actions-context';

/** Shown under a finished plan: build it, or keep talking. Typing a reply is how you keep planning. */
export function PlanApproval() {
  const { approvePlan } = useChatActions();

  return (
    <div className="border-line border-border-default mt-2 flex flex-col gap-2 rounded-md border p-3">
      <p className="text-body text-text-default font-medium">
        Build this plan?
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={approvePlan}>
          Build this plan
        </Button>
      </div>
      <p className="text-body-small text-text-subtlest">
        Or reply to change the plan first.
      </p>
    </div>
  );
}
