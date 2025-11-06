import Image from 'next/image';
import Link from 'next/link';

import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/paths';

const footerLinks = [
  {
    title: 'Overview',
    href: '#',
  },
  {
    title: 'Features',
    href: '#',
  },
  {
    title: 'Pricing',
    href: '#',
  },
  {
    title: 'Careers',
    href: '#',
  },
  {
    title: 'Help',
    href: '#',
  },
  {
    title: 'Privacy',
    href: '#',
  },
];

const Footer = () => {
  return (
    <footer className="bg-background mt-8">
      <div className="mx-auto max-w-(--breakpoint-xl)">
        <div className="flex flex-col items-start justify-between gap-x-8 gap-y-10 px-6 py-10 sm:flex-row xl:px-0">
          <div>
            {/* Logo */}
            <Link href={paths.home.getHref()}>
              <img src="/logo-full.png" alt="Logo" className="w-21" />
            </Link>

            <ul className="mt-6 flex flex-wrap items-center gap-4">
              {footerLinks.map(({ title, href }) => (
                <li key={title}>
                  <Link href={href} className="text-foreground hover:underline">
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col-reverse items-center justify-between gap-x-2 gap-y-5 px-6 py-10 sm:flex-row xl:px-0">
          {/* Copyright */}
          <span className="text-foreground">
            &copy;{' '}
            <Link href="/" target="_blank">
              Cloviana Inc.
            </Link>{' '}
            {new Date().getFullYear()}
          </span>

          <div className="text-foreground flex items-center gap-5">
            <Link target="_blank" href={'#'}>
              <Image
                width={22}
                height={22}
                alt="linkedin"
                src={'/icons/linkedin.png'}
                className="opacity-75 transition-opacity hover:opacity-100"
              />
            </Link>
            <Link href="#" target="_blank">
              <Image
                width={22}
                height={22}
                alt="twitter"
                src={'/icons/twitter.png'}
                className="opacity-75 transition-opacity hover:opacity-100"
              />
            </Link>
            <Link href="#" target="_blank">
              <Image
                width={22}
                height={22}
                alt="instagram"
                src={'/icons/instagram.png'}
                className="opacity-75 transition-opacity hover:opacity-100"
              />
            </Link>
            <Link href="#" target="_blank">
              <Image
                width={22}
                height={22}
                alt="youtube"
                src={'/icons/youtube.png'}
                className="opacity-75 transition-opacity hover:opacity-100"
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
