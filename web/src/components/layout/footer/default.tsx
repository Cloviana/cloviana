import Link from 'next/link';

import { paths } from '@/config/paths';

const NAV = [
  {
    heading: 'Platform',
    links: [
      { label: 'AI Visibility Audit', href: '/audits' },
      { label: 'GEO Optimization', href: '#' },
      { label: 'AI Search Monitoring', href: '#' },
    ],
  },
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'For B2B SaaS', href: '#' },
      { label: 'For marketing teams', href: '#' },
      { label: 'For agencies', href: '#' },
      { label: 'Explore more…', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/cloviana' },
      { label: 'Press', href: '#' },
      { label: 'Contact us', href: 'https://calendly.com/cloviana/30min' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Blog', href: paths.blog.getHref() },
      { label: 'GEO Guide', href: '#' },
      { label: 'Case studies', href: '#' },
      { label: 'ROI Calculator', href: '#' },
      { label: 'Documentation', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Affiliates', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Privacy', href: '/regulations/privacy-policy' },
    ],
  },
];

function LinkedInIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/cloviana',
    Icon: LinkedInIcon,
  },
  { label: 'X (Twitter)', href: '#', Icon: XIcon },
  { label: 'YouTube', href: '#', Icon: YouTubeIcon },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith('http');
  const className =
    'flex min-h-6 items-center py-2 underline transition-all decoration-transparent hover:decoration-current underline-offset-2 hover:underline-offset-4 md:py-0.5 text-balance text-sm text-foreground';

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="padding-global border-border text-foreground w-full border-t pt-10 pb-24 text-sm md:pt-12 md:pb-16">
      <div className="container">
        {/* Nav columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:grid-cols-4 lg:gap-x-12">
          {NAV.map(({ heading, links }) => (
            <div key={heading} className="flex min-w-0 flex-col gap-1.5">
              <p className="mb-2 font-serif text-xl leading-none tracking-tight sm:text-2xl">
                {heading}
              </p>
              {links.map((link) => (
                <NavLink key={link.label} {...link} />
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-8 pb-4 sm:flex-row sm:items-center sm:justify-between md:mt-16">
          {/* Social icons */}
          <div className="text-muted-foreground flex items-center gap-4">
            {SOCIAL.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="hover:text-foreground transition-colors"
              >
                <Icon />
              </a>
            ))}
          </div>

          {/* Copyright with hover reveal */}
          <div className="group text-muted-foreground relative overflow-hidden text-left sm:text-right">
            <span className="block whitespace-nowrap transition-transform duration-700 ease-in-out md:group-hover:-translate-x-[26ch]">
              © Cloviana, Inc. 2026
            </span>
            <span
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden whitespace-nowrap transition-[clip-path] delay-100 duration-500 ease-in-out [clip-path:inset(0_0_0_100%)] group-hover:[clip-path:inset(0_0_0_0)] md:block"
            >
              Built for the AI-first era
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
