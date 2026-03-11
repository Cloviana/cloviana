'use client';

import * as Terminal from '@/components/ui/terminal';

export const TerminalDemo = () => (
  <div className="absolute top-1/12 left-1/12 w-full">
    <Terminal.Loop>
      <Terminal.Root delay={250}>
        <Terminal.TypingAnimation>
          &gt; cloviana optimize --run
        </Terminal.TypingAnimation>
        <Terminal.Loading
          delay={1500}
          loadingMessage=" Scanning AI visibility gaps"
          completeMessage={
            <span className="text-green-500">
              ✔ Found 14 prompts where competitors are cited — you are not
            </span>
          }
        />
        <Terminal.Loading
          delay={2750}
          loadingMessage=" Building comparison page vs Competitor A"
          completeMessage={
            <span className="text-green-500">
              ✔ Published /vs/competitor-a
            </span>
          }
        />
        <Terminal.Loading
          delay={4000}
          loadingMessage=" Seeding mention on Reddit r/SaaS"
          completeMessage={
            <span className="text-green-500">
              ✔ Mention live — 3 entity signals added
            </span>
          }
        />
        <Terminal.Loading
          delay={5250}
          loadingMessage=" Updating G2 profile"
          completeMessage={
            <span className="text-green-500">
              ✔ Pricing and integrations synced
            </span>
          }
        />
        <Terminal.AnimatedSpan delay={6500} className="text-green-500">
          <span>✔ Optimization loop complete. Next run in 24h.</span>
        </Terminal.AnimatedSpan>
      </Terminal.Root>
    </Terminal.Loop>
  </div>
);
