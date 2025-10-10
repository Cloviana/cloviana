'use client';

import { FC, useState, useEffect, useRef, Fragment, useCallback } from 'react';

import { GIcon } from '@/components/icons';
import { cn } from '@/utils/cn';

interface BenefitsProps {
  className?: string;
}

interface SliderTabProps {
  title: string;
  paragraph: string;
  active: boolean;
  progress: number;
  onClick: () => void;
}

const SliderTab: FC<SliderTabProps> = ({
  title,
  paragraph,
  active,
  progress,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex cursor-pointer flex-col items-start gap-3 text-left transition-opacity duration-300',
        active ? 'opacity-100' : 'opacity-50 hover:opacity-80',
      )}
    >
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-black/5">
        <div className="bg-primary h-[2px]" style={{ width: `${progress}%` }} />
      </div>
      <h3 className="text-xl">{title}</h3>
      <p>{paragraph}</p>
    </button>
  );
};

export const Benefits: FC<BenefitsProps> = ({ className }) => {
  const tabs = [
    {
      title: 'Keywords',
      paragraph:
        'Cloviana scans your niche, competitors, and catalog to surface terms you can rank for now—complete with intent, difficulty, and product fit.',
      imageSrc:
        'https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/keywords-product.png',
    },
    {
      title: 'Blogs',
      paragraph:
        'Cloviana drafts full articles fast—headings, meta, links, and alt text—optimized to read well for people and rank in search.',
      imageSrc:
        'https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/blog-editor-product.png',
    },
    {
      title: 'Product Images',
      paragraph:
        'Generate studio-grade blog visuals in your brand style—realistic, SEO-ready images with alt text and Shopify-fit sizes.',
      imageSrc:
        'https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/images-generation-products.png',
    },
  ];

  const DURATION = 6000;

  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startAtRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCycle = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setProgress(0);
      startAtRef.current = performance.now();
      if (autoRef.current) clearTimeout(autoRef.current);
      autoRef.current = setTimeout(() => {
        startCycle((index + 1) % tabs.length);
      }, DURATION);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const tick = () => {
        const elapsed = performance.now() - startAtRef.current;
        const pct = Math.min((elapsed / DURATION) * 100, 100);
        setProgress(pct);
        if (pct < 100) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [tabs.length, DURATION],
  );

  useEffect(() => {
    startCycle(0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [startCycle]);

  return (
    <section className={cn('padding-global', className)}>
      <div className="padding-section-large container">
        <div className="text-foreground-light mb-6 flex w-fit items-center gap-2 border-b border-dashed pb-2">
          <GIcon name="square" size={6} fill />
          <span className="text-xs md:text-sm">
            Smarter SEO. Faster growth.
          </span>
        </div>
        <div className="hidden md:block">
          <div className="relative w-full overflow-hidden rounded-md">
            <img
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/products-background.png"
              className="w-full"
              alt="Benefits background"
            />
            <img
              src={tabs[0].imageSrc}
              className={cn(
                'absolute bottom-0 left-0 w-[85%] rounded-tr-xl opacity-0 transition-opacity',
                activeIndex === 0 && 'opacity-100',
              )}
              alt="Keywords product screenshot"
            />
            <img
              src={tabs[1].imageSrc}
              className={cn(
                'absolute bottom-0 left-0 w-[85%] rounded-tr-xl opacity-0 transition-opacity',
                activeIndex === 1 && 'opacity-100',
              )}
              alt="Blog editor product screenshot"
            />
            <img
              src={tabs[2].imageSrc}
              className={cn(
                'absolute bottom-0 left-0 w-[85%] rounded-tr-xl opacity-0 transition-opacity',
                activeIndex === 2 && 'opacity-100',
              )}
              alt="Img generation product screenshot"
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {tabs.map((tab, index) => (
              <SliderTab
                key={tab.title}
                title={tab.title}
                paragraph={tab.paragraph}
                active={index === activeIndex}
                progress={index === activeIndex ? progress : 0}
                onClick={() => startCycle(index)}
              />
            ))}
          </div>
        </div>
        <div className="block space-y-6 md:hidden">
          {tabs.map((tab, index) => (
            <Fragment key={index}>
              <div className="relative w-full overflow-hidden rounded-md">
                <img
                  src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/products-background.png"
                  className="w-full"
                  alt="Benefits background"
                />
                <img
                  src={tab.imageSrc}
                  className={cn(
                    'absolute bottom-0 left-0 w-[85%] rounded-tr-xl',
                  )}
                  alt="Benefit product screenshot"
                />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl">{tab.title}</h4>
                <p className="text-sm">{tab.paragraph}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
