import { Skeleton } from '@/components/ui/skeleton';

export function FileGridSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading files"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex flex-col items-center gap-2 p-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
