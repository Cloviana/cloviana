'use client';

import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function SetupBusinessStartButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      disabled
      aria-disabled="true"
    >
      Setup is managed
      <ArrowRight className="size-4" />
    </Button>
  );
}
