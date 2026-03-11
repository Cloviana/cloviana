import { FC, HTMLAttributes } from 'react';

import { cn } from '@/utils/cn';

type WindowProps = HTMLAttributes<HTMLDivElement> & {
  contentClass?: string;
};

export const Window: FC<WindowProps> = ({
  children,
  className,
  contentClass,
  ...props
}) => {
  return (
    <div
      className={cn(
        'border-border bg-background aspect-video w-full rounded-lg border',
        className,
      )}
      {...props}
    >
      <div className="border-b border-inherit p-4">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-[#ef4444]"></div>
          <div className="size-2 rounded-full bg-[#eab308]"></div>
          <div className="size-2 rounded-full bg-[#22c55e]"></div>
        </div>
      </div>
      <div className={cn('p-4', contentClass)}>{children}</div>
    </div>
  );
};
