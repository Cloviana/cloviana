import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { CircleDashed } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { paths } from '@/config/paths';
import { useJobWatcher } from '@/features/jobs/hooks/use-job-watcher';
import { blogKeys } from '@/lib/react-query/keys';
import { Blog } from '@/types/api';

export const BlogCard = ({ data }: { data: Blog }) => {
  const { push } = useRouter();
  const queryClient = useQueryClient();

  const isGenerating =
    data.job?.status === 'PENDING' || data.job?.status === 'RUNNING';

  const { data: jobData, isActive } = useJobWatcher({
    storeId: data.storeId,
    jobId: data.job?.id,
    initialStatus: data.job?.status,
    enabled: isGenerating,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: blogKeys.list(data.storeId),
      });
    },
  });

  const showProgress = isActive || isGenerating;
  const progressValue = jobData?.runtime?.percent ?? (showProgress ? 5 : 0);

  return (
    <button
      onClick={() =>
        push(paths.store.blogs.editor.getHref(data.storeId, data.id))
      }
      className="group hover:bg-secondary/5 w-full rounded-lg text-left transition-all"
    >
      <AspectRatio
        ratio={16 / 9}
        className="ring-secondary-dark ring-offset-background relative overflow-hidden rounded-lg ring-offset-1 transition-all group-hover:ring-2"
      >
        {showProgress ? (
          <div className="bg-accent/30 flex h-full w-full flex-col justify-end gap-2 p-4">
            <div className="text-foreground/60 text-[10px]">
              {Math.round(progressValue ?? 0)}%
            </div>
            <Progress value={progressValue ?? 0} className="h-1" />
          </div>
        ) : (
          <Image
            src={data.thumbnail?.srcUrl ?? '/placeholder.png'}
            alt={data.thumbnail?.altText ?? 'Blog post thumbnail'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        )}
        {data.status === 'DRAFT' && !showProgress && (
          <div className="absolute top-2 right-2 z-10">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-2 py-1 shadow-xl backdrop-blur-md">
                    <CircleDashed
                      strokeWidth={2.5}
                      className="size-3 text-white"
                    />
                    <span className="text-[9px] font-bold tracking-wider text-white uppercase">
                      Draft
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="end"
                  className="max-w-3xs text-[10px]"
                >
                  <p>
                    This post is currently hidden from your live store. Finish
                    editing to publish it to your audience.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </AspectRatio>
      <div className="space-y-1 px-2 py-2">
        <h3 className="line-clamp-2 text-[11px] leading-tight font-medium">
          {data.topic}
        </h3>
        <div className="text-foreground/60 flex items-center text-xs">
          <span>
            {formatDistanceToNowStrict(new Date(data.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
      </div>
    </button>
  );
};
