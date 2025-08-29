import { LoadingSpinner } from '@/components/animations';

export function LoadingFallback() {
  return (
    <div className="flex size-full items-center justify-center">
      <LoadingSpinner size="sm" color="light" />
    </div>
  );
}
