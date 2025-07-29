import { Button, ButtonGroup } from '@/components/actions';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { FC, HTMLAttributes } from 'react';

interface HeroProps extends HTMLAttributes<HTMLDivElement> {}

export const Hero: FC<HeroProps> = ({ className, ...props }) => {
  return (
    <div className="relative overflow-hidden">
      <img
        src="/painted-flowers.png"
        className="right-0 top-0 -z-10 hidden w-[300px] transform lg:absolute"
      />
      <div
        className={cn(
          'container py-16 text-center md:py-24 md:text-left',
          className,
        )}
        {...props}
      >
        <h1 className="w-fit rounded-md bg-white/60 pr-2 text-3xl font-semibold backdrop-blur md:text-5xl lg:text-6xl">
          The #1 AI SEO Agency.
          <br />
          Fully Automated & Shopify‑Integrated.
          <br />
          Scale Your Store—Hands‑Off.
        </h1>
        <div className="mt-8 flex flex-col gap-3 border-t bg-white/60 py-3 backdrop-blur md:flex-row">
          <div className="w-full md:w-7/12">
            <p className="text-sm">End‑to‑End SEO for Shopify</p>
          </div>
          <div className="w-full md:w-5/12">
            <div className="space-y-8">
              <p className="text-base lg:text-lg">
                From in‑depth keyword discovery and AI‑written blogs to
                real‑time on‑page optimization, our fully automated SEO agency
                lives inside your Shopify admin—so you get traffic growth
                without lifting a finger.
              </p>
              <div className="flex flex-col gap-3 md:flex-row">
                <Button variant="secondary" url={links.demo}>
                  Request a demo
                </Button>
                <Button variant="primary" url={paths.auth.signup.getHref()}>
                  Start free trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
