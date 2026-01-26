import { Spinner } from '@/components/ui/spinner';

export function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner
        className="text-foreground-light size-7"
        strokeWidth={3.4}
        variant="2"
      />
    </div>
  );
}
