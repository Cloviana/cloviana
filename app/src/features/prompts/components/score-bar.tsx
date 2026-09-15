'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/utils/cn';

const scoreFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

export function ScoreBar({
  value,
  width = 60,
  label = 'Score',
  className,
}: {
  value: number;
  width?: number;
  label?: string;
  className?: string;
}) {
  const score = Math.min(Math.max(value, 0), 100);
  const formattedScore = scoreFormatter.format(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="meter"
          aria-label={`${label} ${formattedScore} out of 100`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          tabIndex={0}
          className={cn('relative h-3 cursor-default', className)}
          style={{ width }}
        >
          <div className="absolute inset-x-0 top-0 h-[5px] overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgb(250, 79, 79) 0%, rgb(252, 129, 41) 25%, rgb(252, 197, 57) 50%, rgb(163, 230, 53) 75%, rgb(34, 197, 94) 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255, 255, 255, 0.15) 2px, rgba(255, 255, 255, 0.15) 4px)',
              }}
            />
          </div>

          <svg
            className="text-foreground absolute top-1"
            style={{
              left: `${score}%`,
              transform: 'translateX(-50%)',
            }}
            width="10"
            height="6"
            viewBox="0 0 10 6"
            aria-hidden="true"
          >
            <path
              d="M 4.5 1 C 4.7 0.6, 5.3 0.6, 5.5 1 L 8.8 5 C 9.1 5.4, 8.9 6, 8.4 6 L 1.6 6 C 1.1 6, 0.9 5.4, 1.2 5 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {label}: {formattedScore}%
      </TooltipContent>
    </Tooltip>
  );
}
