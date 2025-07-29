import { Button, ButtonGroup } from '@/components/actions';
import { links } from '@/config/links';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';
import { FC, HTMLAttributes } from 'react';

interface FinalCTAProps extends HTMLAttributes<HTMLDivElement> {}

export const FinalCTA: FC<FinalCTAProps> = ({ className, ...props }) => (
  <div
    className={cn(
      "overflow-hidden bg-sky-100/80 bg-[url('/one-suite-banner.webp')] bg-cover bg-center md:container md:aspect-[100/39] md:rounded-md",
      className,
    )}
    {...props}
  >
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-white">
        Free your team.
        <br />
        Launch your first AI SEO agent today!
      </h1>
      <p className="max-w-xl text-center text-white">
        If you're exploring Cloviana for the first time or discovering new
        features, we'll quickly guide you to start doing great work immediately.
      </p>
      <div className="mt-4">
        <ButtonGroup>
          <Button variant="secondary" className="text-white" url={links.demo}>
            Request a demo
          </Button>
          <Button
            variant="primary"
            className="text-white"
            url={paths.auth.signup.getHref()}
          >
            Start free trial
          </Button>
        </ButtonGroup>
      </div>
    </div>
  </div>
);
