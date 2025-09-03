import Link from 'next/link';
import { FC } from 'react';

import { Button } from '@/components/actions';
import { GIcon } from '@/components/icons';
import { links } from '@/config/links';

type NavItem = { label: string; href: string };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Links',
    items: [
      { label: 'Home', href: '#' },
      { label: 'Company', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
  {
    title: 'Product',
    items: [
      { label: 'Workflows', href: '#' },
      { label: 'Email Design', href: '#' },
      { label: 'Audiences', href: '#' },
      { label: 'Reporting', href: '#' },
    ],
  },
  {
    title: 'Other',
    items: [
      { label: 'Data Security', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Privacy Policy', href: '#' },
    ],
  },
];

const SOCIAL_ICONS: {
  alt: string;
  src: string;
  href: string;
  size?: string;
}[] = [
  {
    alt: 'LinkedIn',
    src: '/icons/linkedin.svg',
    href: '#',
    size: 'size-[22px]',
  },
  {
    alt: 'Instagram',
    src: '/icons/instagram.svg',
    href: '#',
    size: 'size-[22px]',
  },
  { alt: 'YouTube', src: '/icons/youtube.svg', href: '#', size: 'size-6' },
];

export const Footer: FC = () => (
  <footer className="padding-global font-inter py-12">
    <div className="container flex flex-col justify-between gap-12 md:flex-row md:gap-16">
      <div className="flex flex-col justify-between gap-4">
        <div className="flex flex-col gap-2">
          <img src="/logo-full.png" className="w-22" alt="Relentlo logo" />
          <span className="font-medium">AI-Native Marketing Automation</span>
        </div>
        <Button asChild className="group w-fit" size="sm">
          <a href={links.demo} target="_blank" rel="noopener noreferrer">
            Book a demo
            <GIcon
              name="arrow_forward"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </a>
        </Button>
      </div>

      <nav className="flex flex-1 gap-x-12" aria-label="Footer navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <span className="text-foreground/70 text-[13px] font-medium tracking-wider uppercase">
              {section.title}
            </span>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="max-md:text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>

    <div className="border-foreground/10 container mt-12 border-t pt-6">
      <div className="flex items-center justify-between">
        <span className="text-sm">© Relentlo Inc. 2025</span>
        <div className="flex items-center gap-4">
          {SOCIAL_ICONS.map((icon) => (
            <Link
              key={icon.alt}
              href={icon.href}
              aria-label={icon.alt}
              className="opacity-80 hover:opacity-100"
            >
              <img
                src={icon.src}
                alt={icon.alt}
                className={icon.size ?? 'size-5'}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  </footer>
);
