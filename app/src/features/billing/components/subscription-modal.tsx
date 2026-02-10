'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Plans } from '@/features/billing/components/plans';
import { useSubscriptionModal } from '@/stores/subscription-modal';

export const SubscriptionModal = () => {
  const { isOpen, close } = useSubscriptionModal();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white backdrop-blur-sm">
      <Button
        onClick={close}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 rounded-full"
      >
        <X />
      </Button>

      <Plans />
    </div>
  );
};
