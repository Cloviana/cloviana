import { FC } from 'react';

import { cn } from '@/utils/cn';

import { HatchCard } from './hatch-card';

interface LogoWallProps {
  className?: string;
}

interface LogoProps {
  src: string;
  alt?: string;
  className?: string;
}

const LOGOS = [
  { src: '/logos/Stereogum_idr3trpdhu_1.svg', alt: 'Stereogum' },
  { src: '/logos/Spoon University_idxZY62vbh_1.svg', alt: 'Spoon University' },
  { src: '/logos/Fur_idBYFuX1Kq_1.svg', alt: 'Fur' },
  { src: '/logos/idLfBXG-XJ_1756918529631.png', alt: 'Kiss' },
  { src: '/logos/New Scientist_idGmamynOX_1.svg', alt: 'New Scientist' },
  { src: '/logos/Christianity Today_Logo_0.svg', alt: 'Christian Today' },
  { src: '/logos/casper.png', alt: 'Casper' },
  { src: '/logos/overtone.png', alt: 'Overtone' },
] as const;

const Logo: FC<LogoProps> = ({ src, alt, className }) => (
  <div
    className={cn(
      'border-dashed-wide flex items-center justify-center border px-6 py-10',
      className,
    )}
  >
    <img src={src} alt={alt ?? 'Logo'} className="max-h-5 object-contain" />
  </div>
);

const HatchRow: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'border-dashed-wide relative -mx-px h-8 overflow-hidden border-y',
      className,
    )}
  >
    <HatchCard />
  </div>
);

export const LogoWall: FC<LogoWallProps> = ({ className }) => {
  const items = LOGOS.flatMap((logo, i, arr) => {
    const out = [<Logo key={logo.src} src={logo.src} alt={logo.alt} />];
    if (i % 2 === 1 && i < arr.length - 1)
      out.push(<HatchRow key={`m-${i}`} className="col-span-2 md:hidden" />);
    if (i === 3)
      out.push(<HatchRow key="d-3" className="hidden md:col-span-4 md:flex" />);
    return out;
  });

  return (
    <section
      className={cn(
        'padding-global padding-section-medium bg-white',
        className,
      )}
    >
      <div className="border-dashed-wide container border px-0">
        <div className="border-dashed-wide mx-auto border-b px-2 py-5">
          <h2 className="text-center text-xl font-medium">
            Proudly powering 200+ businesses
            <br />
            <span className="opacity-60">
              Trusted by growing Shopify brands and teams who want results
              without the lift.
            </span>
          </h2>
        </div>
        <div className="overflow-hidden">
          <div className="-m-px grid grid-cols-2 md:grid-cols-4">{items}</div>
        </div>
      </div>
    </section>
  );
};
