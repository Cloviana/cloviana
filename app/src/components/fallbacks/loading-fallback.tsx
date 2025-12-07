import { Spinner } from '@/components/ui/spinner';

export function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-20">
      <Spinner />
    </div>
  );
}
