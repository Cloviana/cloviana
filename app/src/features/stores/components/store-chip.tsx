import { ChevronsUpDown } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { useGetStore } from '../api/get-store';

export const StoreChip = ({ className }: { className?: string }) => {
  const { storeId } = useParams() as { storeId: string };
  const { data: store, isLoading } = useGetStore(storeId);
  if (isLoading || !store)
    return <Skeleton className="h-[22px] w-[100px] rounded-full" />;
  return (
    <div
      className={cn(
        'text-foreground flex cursor-not-allowed items-center gap-2 rounded-md px-1.5 py-1',
        className,
      )}
    >
      <Avatar className="size-5">
        <AvatarImage src={store.profileUrl} />
        <AvatarFallback />
      </Avatar>
      <span className="text-sm font-medium">{store.domainUrl}</span>
      <ChevronsUpDown size={13} strokeWidth={2.5} />
    </div>
  );
};
