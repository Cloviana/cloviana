import { cn } from '@/utils/cn';

interface Stats11Props {
  className?: string;
}

export const Stats = ({ className }: Stats11Props) => {
  return (
    <section className={cn('padding-global', className)}>
      <div className="padding-section-medium container">
        <div className="from-primary/10 md:border-border relative isolate overflow-hidden bg-linear-to-b to-transparent md:border-x">
          <div className="absolute right-0 -left-px -z-20 h-full w-full bg-[linear-gradient(90deg,var(--muted-foreground)_1px,transparent_1px)] [mask-image:linear-gradient(transparent_25%,black_25%,black_75%,transparent_75%)] [background-size:calc(100%/16)_100%] [mask-size:100%_16px] opacity-20 [-webkit-mask-image:linear-gradient(transparent_25%,black_25%,black_75%,transparent_75%)] [-webkit-mask-size:100%_16px]" />

          <div>
            <h2 className="mb-16 max-w-3xl text-xl font-medium sm:mb-24 md:mx-10 md:text-2xl lg:text-3xl/10">
              SEO that runs while you run your business.
              <span className="text-muted-foreground/90 font-medium">
                {' '}
                Keyword research, product-led content, consistent publishing —
                all on autopilot.
              </span>
            </h2>
            <div className="border-border relative grid max-w-2xl gap-4 border-x pb-32 sm:grid-cols-2 sm:gap-10 sm:pb-44 md:ml-10 md:border-0">
              <div className="border-primary bg-background absolute inset-0 -top-[1100px] -left-[calc(1000px-22vw)] -z-10 size-[1500px] rounded-full border sm:-top-[480%] sm:-left-[185%] sm:size-[2000px] md:-top-[906%] md:-left-[294%] md:size-[3500px] lg:-top-[1186%] lg:-left-[380%] lg:size-[4500px] xl:-top-[1200%] xl:-left-[350%] 2xl:-top-[1196%] 2xl:-left-[345%]"></div>
              <div className="flex flex-col gap-2">
                <span className="flex gap-5 text-3xl font-semibold">
                  <span className="bg-muted-foreground/60 relative -left-px w-px"></span>
                  90×
                </span>
                <p className="text-muted-foreground/80 pl-5 font-medium">
                  Agency savings
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex gap-5 text-3xl font-semibold">
                  <span className="bg-muted-foreground/60 relative -left-px w-px"></span>
                  &lt; 10 min
                </span>
                <p className="text-muted-foreground/80 pl-5 font-medium">
                  Per post
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex gap-5 text-3xl font-semibold">
                  <span className="bg-muted-foreground/60 relative -left-px w-px"></span>
                  100%
                </span>
                <p className="text-muted-foreground/80 pl-5 font-medium">
                  Buyer intent
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="flex gap-5 text-3xl font-semibold">
                  <span className="bg-muted-foreground/60 relative -left-px w-px"></span>
                  24/7
                </span>
                <p className="text-muted-foreground/80 pl-5 font-medium">
                  Always on
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
