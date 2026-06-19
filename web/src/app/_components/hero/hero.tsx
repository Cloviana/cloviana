'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';

import { AISearchResultCycler } from '@/app/_components/hero/components/ai-search-result';
import { Button } from '@/components/ui/button';
import { ShinyButton } from '@/components/ui/shiny-button';
import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';
import { cn } from '@/utils/cn';

// ─── Animation helpers ───────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay },
});

const float = (delay = 0) => ({
  animate: { y: [-6, 6] },
  transition: {
    duration: 7,
    ease: EASE,
    repeat: Infinity,
    repeatType: 'mirror' as const,
    delay,
  },
});

// ─── Sub-components ──────────────────────────────────────────────────────────

interface FloatingHandProps {
  src: string;
  width: number;
  delay?: number;
  animate?: boolean;
  blurDataURL?: string;
  className?: string;
}

const FloatingHand: FC<FloatingHandProps> = ({
  src,
  width,
  delay = 0,
  animate: shouldAnimate = true,
  blurDataURL,
  className,
}) => (
  <motion.div
    {...(shouldAnimate ? float(delay) : {})}
    aria-hidden="true"
    className={cn('pointer-events-none select-none', className)}
  >
    <Image
      src={src}
      alt=""
      width={width}
      height={481}
      priority
      placeholder={blurDataURL ? 'blur' : undefined}
      blurDataURL={blurDataURL}
      className="h-full w-auto object-contain"
    />
  </motion.div>
);

// ─── Hero ─────────────────────────────────────────────────────────────────────

interface HeroProps {
  className?: string;
}

export const Hero: FC<HeroProps> = ({ className }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section className={cn('relative overflow-hidden', className)}>
      <FloatingHand
        src="/images/hero-hand-left.png"
        width={763}
        animate={!isMobile}
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAiklEQVR4AYTNsQqCUBgF4ONfo209SQ8Q3i1oLqIh6BV6gvsIQTQ2Nd4aBEEQQQVHEUF9AHF1cHBUfh0cdPLbDofDISwgBrRMGjqHn032PunMcjYi5749xpG/93+vVerYB3X9Gp4n1xhRXlbFzYItnkl9MZs/2l0ghGzHHvRwkQ5heAI0gM9KdZjoAQAA///eZcuvAAAABklEQVQDAEqmKwt+nNYEAAAAAElFTkSuQmCC"
        className="absolute top-0 left-0 z-0 h-[130px] -translate-x-[8%] md:h-[clamp(230px,25vw,416px)]"
      />
      <FloatingHand
        src="/images/hero-hand-right.png"
        width={685}
        delay={0.9}
        animate={!isMobile}
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAGCAYAAAD+Bd/7AAAAp0lEQVR4AYTKoQrCYBAH8NtX3IooUzD4ACpfNhsWFH2GPYHBZP4ewGQSk4pRFjSYBIMMQRZmVFhUnCJjYnHh3I5tdcfdwf/Pj0HGpAARpdBGB9dxJ+fPdRWPyzwBIQS7X/aqNdBq9rBVtbcH3dysu6dJX0sAvoOyLxeKj6f7qsuKsmuvvEVz5hkEAAA557/GzfnwEjN7huuEHW0CKEhTK6iMzl8K8fsDAAD//wDE4+cAAAAGSURBVAMAiOE1Deov8SYAAAAASUVORK5CYII="
        className="absolute top-0 right-0 z-0 h-[130px] translate-x-[7%] md:h-[clamp(230px,25vw,416px)]"
      />

      <div className="padding-global">
        <div className="padding-section-medium container -mt-16 !pb-[3rem] md:mt-0">
          <div className="mx-auto mb-12 flex flex-col items-center gap-y-6 pt-28 text-center md:pt-0">
            <motion.h1
              {...fadeUp(0)}
              className="font-gambarino text-3xl md:text-4xl lg:text-5xl"
            >
              One Agent,
              <br />
              Every AI Search Lead
            </motion.h1>

            <motion.p
              {...fadeUp(0.1)}
              className="text-foreground-light max-w-[65ch] text-sm md:text-base"
            >
              Get found when buyers ask AI what to buy. Cloviana finds where
              competitors appear instead of you, surfaces what is missing, and
              executes the work to turn AI visibility into pipeline.
            </motion.p>

            <motion.div {...fadeUp(0.2)}>
              <ShinyButton>
                <Button
                  asChild
                  size="lg"
                  onClick={() => gaEvent('book_demo', { location: 'hero' })}
                >
                  <Link href={links.demo}>Request a demo</Link>
                </Button>
              </ShinyButton>
            </motion.div>
          </div>

          <div className="flex min-h-[250px] justify-center">
            <AISearchResultCycler />
          </div>

          {/*
          <div className="-mx-4 flex min-h-[360px] items-center justify-center bg-[url('/images/imag-13.png')] bg-cover bg-top px-4 py-10 sm:mx-0 sm:rounded-2xl sm:px-6 md:min-h-[430px] md:px-10 md:py-14">
            <AISearchResultCycler />
          </div>
          */}
        </div>
      </div>
    </section>
  );
};
