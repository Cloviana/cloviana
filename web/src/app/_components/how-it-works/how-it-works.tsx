'use client';

import { AnimatePresence, motion } from 'motion/react';
import { FC, useEffect, useState } from 'react';

import { cn } from '@/utils/cn';

import { PromptUniverse } from './components/prompt-universe';
import { ShareOfVoice } from './components/share-of-voice';
import { TerminalDemo } from './components/terminal-demo';
import { STEP_DURATION } from './constants';

const EASE = [0.22, 1, 0.36, 1] as const;

type Step = {
  title: string;
  description: string;
  visual?: React.ReactNode;
};

const steps: Step[] = [
  {
    title: "Maps every conversation you're missing",
    description:
      'Cloviana scans the full universe of prompts your buyers are asking ChatGPT, Perplexity, and Claude — and finds every one where a competitor is recommended instead of you.',
    visual: <PromptUniverse />,
  },
  {
    title: 'Optimizes your presence across the web',
    description:
      'The agent publishes AI-ready content, seeds your brand across high-trust sources, and fixes inconsistencies — running every 24 hours without you lifting a finger.',
    visual: <TerminalDemo />,
  },
  {
    title: 'Compounds your share of voice over time',
    description:
      'Every optimization builds on the last. The longer Cloviana runs, the more AI models recommend you — and the harder that position is for competitors to take.',
    visual: <ShareOfVoice />,
  },
];

const VisualPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-surface relative aspect-video w-full overflow-hidden rounded-2xl">
    <div className="absolute inset-0">{children}</div>
  </div>
);

export const HowItWorks: FC<{ className?: string }> = ({ className }) => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActive((i) => (i + 1) % steps.length);
    }, STEP_DURATION);
    return () => clearTimeout(timer);
  }, [active]);

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl"
          >
            The agent runs. You get recommended.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="text-foreground-light w-full lg:w-1/2 lg:max-w-[50ch] lg:pt-2 lg:text-lg"
          >
            Cloviana works continuously in the background — mapping where your
            buyers are searching, optimizing your presence across every AI
            model, and compounding your share of voice over time.
          </motion.p>
        </div>

        {/* Desktop: tabbed showcase */}
        <div className="hidden lg:flex lg:items-start lg:gap-12">
          {/* Left: step list */}
          <div className="w-2/5">
            {steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="w-full cursor-pointer py-5 text-left"
              >
                <h3
                  className={cn(
                    'text-lg font-normal transition-colors duration-200',
                    active === i
                      ? 'text-foreground'
                      : 'text-foreground-lighter',
                  )}
                >
                  {step.title}
                </h3>

                <AnimatePresence initial={false}>
                  {active === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="text-foreground-light mt-3 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="bg-border mt-5 h-px w-full overflow-hidden">
                  {active === i && (
                    <motion.div
                      key={active}
                      className="bg-foreground h-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{
                        duration: STEP_DURATION / 1000,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Right: visual with crossfade */}
          <div className="w-3/5">
            <div className="surface-panel relative aspect-video w-full overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {steps[active].visual}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet: stacked steps */}
        <div className="flex flex-col gap-12 lg:hidden">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex flex-col gap-4"
            >
              <div>
                <h3 className="text-foreground text-lg font-normal">
                  {step.title}
                </h3>
                <p className="text-foreground-light mt-2 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
              {step.visual && <VisualPanel>{step.visual}</VisualPanel>}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
