import { cva, VariantProps } from 'class-variance-authority';
import Image from 'next/image';
import { FC } from 'react';

import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

interface ProductProps extends VariantProps<typeof productRootVariants> {
  className?: string;
  title: string;
  paragraph: string;
  image: {
    src: string;
    alt: string;
    blurDataURL?: string;
  };
}

const productRootVariants = cva('rounded-t-xl overflow-hidden sticky', {
  variants: {
    variant: {
      green: 'bg-[#156a47]',
      purple: 'bg-[#5e3966]',
      blue: 'bg-[#1a5675]',
      red: 'bg-[#7d2f1e]',
    },
  },
});

const tileVariants = cva('relative border-t border-b border-[#ffffff29]', {
  variants: {
    variant: {
      green: 'bg-[#166e4a]',
      purple: 'bg-[#684071]',
      blue: 'bg-[#225e7d]',
      red: 'bg-[#8c3421]',
    },
    position: {
      top: 'border-t-0',
      middle: '',
    },
  },
});

const squareVariants = cva('absolute w-2 h-2 [inset:auto_-4px_-4px_auto]', {
  variants: {
    variant: {
      green: 'bg-[#17cf84]',
      purple: 'bg-[#e670ff]',
      blue: 'bg-[#61c9ff]',
      red: 'bg-[#ff8368]',
    },
    position: {
      'bottom-right': '',
      'bottom-left': '-left-1 right-auto',
      'top-right': '-top-1 bottom-auto',
      'top-left': '[inset:-4px_auto_auto_-4px]',
    },
  },
});

const productContentVariants = cva(
  'rounded-tl-[0.125rem] rounded-tr-[0.125rem] justify-center items-end pt-[1rem] md:pt-[3rem] pr-[1rem] md:pr-[3rem] pl-[1rem] md:pl-[3rem] flex',
  {
    variants: {
      variant: {
        green: 'bg-[#a3dfc6]',
        purple: 'bg-[#dec3e4]',
        blue: 'bg-[#aed6eb]',
        red: 'bg-[#f8bbae]',
      },
    },
  },
);

export const Product: FC<ProductProps> = ({
  variant,
  className,
  title,
  paragraph,
  image,
}) => {
  return (
    <div
      className={cn(
        productRootVariants({
          variant,
        }),
        className,
      )}
    >
      <div className="grid w-full [grid-auto-columns:1fr] [grid-template-columns:minmax(1.25rem,1fr)_minmax(1.25rem,1.25rem)_minmax(auto,68.5rem)_minmax(1.25rem,1.25rem)_minmax(1.25rem,1fr)] [grid-template-rows:minmax(1.5rem,1.5rem)_auto_auto_minmax(1px,auto)_minmax(auto,5rem)_auto_auto_minmax(auto,5rem)] items-stretch [grid-column-gap:0rem] [grid-row-gap:0rem]">
        <div className="relative flex flex-col items-start justify-between px-5 py-10 [grid-area:2/3/3/4] md:flex-row">
          <div className="w-full max-w-[30rem]">
            <h2 className="text-[2.5rem] leading-[1] tracking-[-0.02em] text-white">
              {title}
            </h2>
          </div>
          <div className="w-full max-w-[21rem]">
            <div className="flex flex-col items-start justify-start gap-5">
              <p className="text-[0.875rem] text-white">{paragraph}</p>
              <Button asChild className="group" variant={variant}>
                <a
                  href={paths.auth.signup.getHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                  <GIcon
                    name="arrow_forward"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </Button>
            </div>
          </div>
          <div className="pointer-events-none absolute [inset:auto_0_0_-50vw] h-px w-[200vw] bg-[#ffffff29]"></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:1/1/3/2]',
            tileVariants({ variant, position: 'top' }),
          )}
        >
          <div
            className={cn(
              squareVariants({ variant, position: 'bottom-right' }),
            )}
          ></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:1/5/3/6]',
            tileVariants({ variant, position: 'top' }),
          )}
        >
          <div
            className={cn(squareVariants({ variant, position: 'bottom-left' }))}
          ></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:4/1/6/2]',
            tileVariants({ variant, position: 'middle' }),
          )}
        >
          <div
            className={cn(squareVariants({ variant, position: 'top-right' }))}
          ></div>
          <div
            className={cn(
              squareVariants({ variant, position: 'bottom-right' }),
            )}
          ></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:7/1/9/2]',
            tileVariants({ variant }),
          )}
        >
          <div
            className={cn(squareVariants({ variant, position: 'top-right' }))}
          ></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:4/5/6/6]',
            tileVariants({ variant, position: 'middle' }),
          )}
        >
          <div
            className={cn(squareVariants({ variant, position: 'top-left' }))}
          ></div>
          <div
            className={cn(squareVariants({ variant, position: 'bottom-left' }))}
          ></div>
        </div>

        <div
          className={cn(
            'place-self-stretch [grid-area:7/5/9/6]',
            tileVariants({ variant }),
          )}
        >
          <div
            className={cn(squareVariants({ variant, position: 'top-left' }))}
          ></div>
        </div>

        <div
          className={cn(
            '[grid-area:3/3/9/4]',
            productContentVariants({ variant }),
          )}
        >
          <Image
            src={image.src}
            alt={image.alt}
            width={1200}
            height={900}
            priority
            placeholder={image.blurDataURL ? 'blur' : undefined}
            blurDataURL={image.blurDataURL}
            sizes="(max-width: 1024px) 100vw, 68.5rem"
            className="h-auto w-full rounded-t-lg border border-b-0 border-black/60"
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 px-5">
        <div className="static mx-auto h-full w-full max-w-[71rem] border-r border-l border-[#ffffff29] px-5">
          <div className="static mx-auto h-full w-full max-w-full border-r border-l border-[#ffffff29] px-5"></div>
        </div>
        <div className="pointer-events-none absolute [inset:1.5rem_0_auto] top-6 h-px bg-[#ffffff29]"></div>
      </div>
    </div>
  );
};
