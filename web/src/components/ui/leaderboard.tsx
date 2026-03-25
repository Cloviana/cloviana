import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

export type LeaderboardItem = {
  position: number;
  domain: string;
  name?: string | null;
  share: number;
};

type LeaderboardProps = {
  items: LeaderboardItem[];
  targetDomain?: string;
  header?: { left: string; right: string };
  className?: string;
};

const BLUR_PX = [0, 2, 4, 6];
const BLUR_OPACITY = [1, 0.7, 0.4, 0.2];

function getBlurStartIndex(
  items: LeaderboardItem[],
  targetDomain: string | undefined,
  visibleCount: number,
): number {
  const target = targetDomain
    ? items.find((item) => item.domain === targetDomain)
    : undefined;

  if (!target) return 4; // no target → blur rows 5–6
  if (target.position > 6) return 3; // outside top 6 → blur rows 4–6
  if (target.position === 6) return visibleCount; // position 6 → no blur
  if (target.position === 5) return 5; // position 5 → blur row 6 only
  return 4; // position 1–4 → blur rows 5–6
}

const CircularProgress = ({ value }: { value: number }) => {
  const r = 6;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="-rotate-90">
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2"
        className="stroke-muted-foreground/20"
      />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ - (value / 100) * circ}
        className="stroke-foreground transition-all duration-500"
      />
    </svg>
  );
};

export const Leaderboard = ({
  items,
  targetDomain,
  header,
  className,
}: LeaderboardProps) => {
  const visible = items.slice(0, 6);
  const blurStartIndex = getBlurStartIndex(items, targetDomain, visible.length);

  return (
    <div
      className={cn('pointer-events-none flex flex-col select-none', className)}
    >
      {header && (
        <div className="text-foreground-lighter flex items-center justify-between border-b pb-4">
          <span>{header.left}</span>
          <span>{header.right}</span>
        </div>
      )}
      {visible.map((item, i) => {
        const isTarget = item.domain === targetDomain;
        const lvl = Math.min(Math.max(0, i - blurStartIndex + 1), 3);
        return (
          <div
            key={item.domain}
            style={
              lvl > 0
                ? {
                    filter: `blur(${BLUR_PX[lvl]}px)`,
                    opacity: BLUR_OPACITY[lvl],
                  }
                : undefined
            }
            className={cn(
              'flex items-center gap-3 py-4',
              i < visible.length - 1 && 'border-b',
              isTarget && 'ring-primary rounded-md px-3 ring-2',
            )}
          >
            <span className="text-foreground-lighter w-4 shrink-0 text-right tabular-nums">
              {item.position}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`}
                alt={item.domain}
                width={19}
                height={19}
                className="shrink-0 rounded-sm"
              />
              <span className="truncate text-lg font-medium">
                {item.name ?? item.domain}
              </span>
              {isTarget && <Badge className="shrink-0">Your brand</Badge>}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-foreground-light text-lg font-medium tabular-nums">
                {item.share.toFixed(1)}%
              </span>
              <CircularProgress value={item.share} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
