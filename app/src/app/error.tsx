'use client';

import { Button } from '@/components/ui/button';

// ponytail: one root boundary; add per-segment error.tsx only when a route
// needs its own recovery UI.
export default function RootError({ reset }: { reset: () => void }) {
  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-foreground-light max-w-sm text-sm leading-6">
        An unexpected error occurred. Try again, and if it keeps happening,
        reload the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
