'use client';

/**
 * A clean, simple spinning loader centered on the screen.
 */
export function PageLoading() {
  return (
    <div className="flex h-full min-h-[400px] w-full flex-1 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-800" />
    </div>
  );
}
