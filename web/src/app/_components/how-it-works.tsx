import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { FC, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

interface HowItWorksProps {
  className?: string;
}

interface StepWrapperProps {
  children: ReactNode;
  className?: string;
  reverseLayout?: boolean;
}

interface StepTextProps {
  title: string;
  description: string;
  className?: string;
}

interface StepMediaProps {
  backgroundImage?: string;
  backgroundAlt?: string;
  backgroundBlurDataURL?: string;
  className?: string;
  children?: ReactNode;
}

const StepWrapper: FC<StepWrapperProps> = ({
  children,
  className,
  reverseLayout,
}) => {
  return (
    <div className={cn('grid grid-cols-12 items-center gap-8', className)}>
      <div
        className={cn(
          'col-span-12 space-y-3 lg:col-span-4',
          reverseLayout && 'lg:order-3',
        )}
      >
        {Array.isArray(children) ? children[0] : children}
      </div>
      <div
        className={cn(
          'hidden lg:col-span-1 lg:block',
          reverseLayout && 'lg:order-2',
        )}
      />
      <div
        className={cn(
          'relative col-span-12 lg:col-span-7',
          reverseLayout && 'lg:order-1',
        )}
      >
        {Array.isArray(children) ? children[1] : null}
      </div>
    </div>
  );
};

const StepText: FC<StepTextProps> = ({ title, description, className }) => (
  <div className={cn(className)}>
    <h3 className="max-w-[20ch] text-3xl">{title}</h3>
    <p className="text-foreground-light">{description}</p>
  </div>
);

const StepMedia: FC<StepMediaProps> = ({
  backgroundImage,
  backgroundAlt = '',
  backgroundBlurDataURL = '',
  className,
  children,
}) => (
  <div
    className={cn(
      'relative flex aspect-video items-center justify-center overflow-hidden rounded-xl',
      className,
    )}
  >
    {backgroundImage && (
      <Image
        src={backgroundImage}
        alt={backgroundAlt}
        placeholder="blur"
        blurDataURL={backgroundBlurDataURL}
        fill
        className="object-cover"
      />
    )}
    {children}
  </div>
);

export const HowItWorks: FC<HowItWorksProps> = ({ className }) => (
  <section className={cn(className, 'padding-global relative')}>
    <div className="padding-section-medium container">
      <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center md:space-y-4">
        <h2 className="text-xl md:text-2xl lg:text-4xl">
          Three steps that turn your products into pages that rank
        </h2>
        <p className="text-foreground-lighter text-sm md:text-base">
          Connect, approve, publish. That’s it.
        </p>
        <Button
          asChild
          variant="link"
          className="group text-foreground-lighter font-normal"
        >
          <a
            href={paths.auth.signup.getHref()}
            target="_blank"
            rel="noopener noreferrer"
          >
            Get started
            <ArrowRight
              strokeWidth={1.5}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </Button>
      </div>
      <div className="space-y-22">
        <StepWrapper>
          <StepText
            title="Connect your Shopify store"
            description="Install Cloviana, sync your products and brand voice in under a minute—no code."
          />
          <StepMedia
            backgroundImage="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/row-one-bg.png?v=2025-11-06-1"
            backgroundAlt="Abstract Shopify-themed background"
            backgroundBlurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAUUlEQVR4AUyMwRHAIAzDDPuv1b7LDsyBayV9NHcGJJLMZ1/+Z+27eMWTKVlk5OS2Tr/s+kkDPHQQ3YuQMgHO+AwarohCWsXZ0Kv0VXytBm3rBQAA//8tkgk+AAAABklEQVQDADcWObV2ur4NAAAAAElFTkSuQmCC"
          >
            <Image
              src="/icons/shopify-240.svg"
              alt="Shopify logo"
              width={240}
              height={240}
              className="relative z-10 size-32 object-contain md:size-48"
            />
          </StepMedia>
        </StepWrapper>

        <StepWrapper reverseLayout>
          <StepText
            title="Find what people search for"
            description="We discover real buyer searches for your products and turn them into ready-to-write blog ideas."
          />
          <StepMedia
            backgroundImage="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/row-two-bg.png?v=2025-11-06-1"
            backgroundAlt="Dashboard interface background showing keyword insights"
            backgroundBlurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAgElEQVR4ARyNuw0CQQxE3/o6QEIEBEg0SUYLgBAdEBFCetADn0oI7+O5uQ1WXj+/sWN/e2h3vevYvnV6fus7tD+d/b+8Pop/JxbLDaOCVEEUEtwXBkGsV1simgpT8gBcau1tRtpqiiNOjwbDKG+iBmYcaaM3tOf1s4iPWDDvEiYAAAD//8veE7gAAAAGSURBVAMAIgtKq/uePtUAAAAASUVORK5CYII="
          >
            <Image
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/keywords-table.png?v=2025-11-06-1"
              alt="Keyword research dashboard"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAYAAACzzX7wAAAAXklEQVR4ARyISw7CMBQD5xkRBAvuf8osIkLV5uOmtWWPZeWcXUpx791jjMV2p9bq379axwyOaUrb2BfbhDZMc9AtlGQ+KfFNb14KnlceIom1QRGBFFzmllebiPUEnAAAAP//pYQyJgAAAAZJREFUAwDvPDZU8BUibAAAAABJRU5ErkJggg=="
              width={996}
              height={1896}
              className="absolute right-0 bottom-0 w-full max-w-[95%] rounded-tl-xl"
            />
          </StepMedia>
        </StepWrapper>

        <StepWrapper>
          <StepText
            title="Publish posts that rank and drive to your products"
            description="We create on-brand posts that rank on Google and AI search, link readers to your products, and publish straight to Shopify."
          />
          <StepMedia
            backgroundImage="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/row-three-bg.png?v=2025-11-06-1"
            backgroundAlt="Blog editor interface background"
            backgroundBlurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAQUlEQVR4AXyKwQ7AMAhCkf//1/XU9MZgmYemSVV8ROGaj9YcVhi1D4dYVfBYYYTfwyXQ+zrU8d4vhISvzfjOd+wFAAD//2G7tOMAAAAGSURBVAMAsTUr9P2sroYAAAAASUVORK5CYII="
          >
            <video
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/blog-editor.mp4?v=2025-11-06-1"
              poster="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAYAAACzzX7wAAAAe0lEQVR4ARSKMQoCMRREJyFrkyald7C08x4ewBPbWFiJoGzhCiH79RMSNrPZYR684tkYI1OaqaqUn1BEWEphrZWaK618RjxuVwzDAP0rpumL13tED7FzBhY6Iz3vANm/0bovyDljm90fjjidL1gaYYyBcw4hBHjv0VrDCgAA//+xwaqcAAAABklEQVQDAF05SKxDf0jAAAAAAElFTkSuQmCC"
              className="absolute bottom-0 left-0 w-full max-w-[95%] rounded-tr-xl"
              autoPlay
              loop
              muted
              playsInline
              title="Blog editor demonstration"
            />
          </StepMedia>
        </StepWrapper>
      </div>
    </div>
  </section>
);
