import { Skeleton } from '@/components/ui/skeleton';

// ─── Shared ───────────────────────────────────────────────────────────────────

const SectionHeader = () => (
  <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
    <Skeleton className="h-10 w-full lg:w-1/2 lg:max-w-[22ch]" />
    <Skeleton className="h-6 w-full lg:max-w-[50ch]" />
  </div>
);

const LeaderboardRows = ({ count = 6 }: { count?: number }) => (
  <div className="flex flex-col">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-4">
        <Skeleton className="h-4 w-4 shrink-0" />
        <Skeleton className="h-5 w-5 shrink-0 rounded-sm" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 w-12 shrink-0" />
      </div>
    ))}
  </div>
);

// ─── Section Skeletons ────────────────────────────────────────────────────────

const HeroSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:gap-12">
        <div className="w-full space-y-4 md:w-1/2">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-5 w-full max-w-[55ch]" />
          <Skeleton className="h-5 w-4/5 max-w-[55ch]" />
          <div className="flex flex-col gap-4 pt-2 md:flex-row">
            <Skeleton className="h-11 w-full rounded-lg md:w-40" />
            <Skeleton className="h-11 w-full rounded-lg md:w-44" />
          </div>
        </div>
        <div className="w-full md:w-1/2">
          <LeaderboardRows />
        </div>
      </div>
    </div>
  </section>
);

const OverviewSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="grid grid-cols-1 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between space-y-4 px-8 py-6"
          >
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="mt-5 flex items-center gap-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const VisibilitySkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="w-full space-y-8 lg:w-1/2">
          <Skeleton className="h-6 w-64" />
          <LeaderboardRows />
        </div>
        <div className="flex w-full items-center justify-center lg:w-1/2">
          <Skeleton className="h-[300px] w-[300px] rounded-full" />
        </div>
      </div>
    </div>
  </section>
);

const SentimentSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="w-full space-y-8 lg:w-1/2">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-28 rounded-full" />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-32 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </section>
);

const CitationSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        <div className="w-full space-y-8 lg:w-1/2">
          <Skeleton className="h-6 w-64" />
          <LeaderboardRows />
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-1/2">
          <Skeleton className="h-6 w-56" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 shrink-0" />
                <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-10 shrink-0" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const PromptsSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 border-b py-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-12 shrink-0" />
            <Skeleton className="h-5 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ContentSuggestionsSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container">
      <SectionHeader />
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-6">
            <Skeleton className="h-8 w-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FinalCtaSkeleton = () => (
  <section className="padding-global">
    <div className="padding-section-medium container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Skeleton className="h-9 w-full md:max-w-md" />
      <Skeleton className="h-11 w-40 shrink-0 rounded-lg" />
    </div>
  </section>
);

// ─── Main Export ──────────────────────────────────────────────────────────────

export const AuditSkeleton = () => (
  <>
    <HeroSkeleton />
    <OverviewSkeleton />
    <VisibilitySkeleton />
    <SentimentSkeleton />
    <PromptsSkeleton />
    <CitationSkeleton />
    <ContentSuggestionsSkeleton />
    <FinalCtaSkeleton />
  </>
);
