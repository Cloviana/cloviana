import { FC } from 'react';

import { Anchor } from '@/components/actions';
import { paths } from '@/config/paths';

export const Footer: FC = () => (
  <footer className="border-t bg-surface-100">
    <div className="container flex items-center justify-between py-8">
      <div className="flex items-center gap-5 text-sm">
        <span className="text-foreground-lighter">Cloviana © 2025</span>
        <Anchor
          href={paths.regulations.privacyPolicy.getHref()}
          variant={'subtle'}
        >
          Terms
        </Anchor>
        <Anchor
          href={paths.regulations.privacyPolicy.getHref()}
          variant={'subtle'}
        >
          Privacy
        </Anchor>
      </div>
      <div className="flex items-center gap-3">
        <img
          src="/icons/linkedin.svg"
          alt="linkedin"
          className="size-[18px] opacity-70"
        />
        <img
          src="/icons/instagram.svg"
          alt="instagram"
          className="size-[18px] opacity-70"
        />
        <img
          src="/icons/youtube.svg"
          alt="youtube"
          className="size-5 opacity-70"
        />
      </div>
    </div>
  </footer>
);
