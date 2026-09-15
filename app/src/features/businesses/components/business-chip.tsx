'use client';

import { ChevronsUpDown } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { useGetBusiness } from '../api/get-business';

export const BusinessChip = ({ className }: { className?: string }) => {
  const { businessId } = useParams() as { businessId: string };
  const { data: business, isLoading } = useGetBusiness(businessId);
  if (isLoading || !business)
    return <Skeleton className="h-[22px] w-[100px] rounded-full" />;
  return (
    <Button
      variant={'outline'}
      size={'default'}
      className={cn(className, 'h-9 px-2')}
    >
      <Avatar className="size-5">
        <AvatarImage src={business.profileUrl ?? undefined} />
        <AvatarFallback />
      </Avatar>
      <div className="flex-1 text-left font-semibold">
        {business.brand.name}
      </div>

      <ChevronsUpDown
        size={13}
        strokeWidth={2}
        className="text-foreground-light"
      />
    </Button>
  );
};
