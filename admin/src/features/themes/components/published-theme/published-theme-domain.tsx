import { PencilIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';

interface PublishedThemeDomainProps {
  domain: string;
  href: string;
}

export function PublishedThemeDomain({
  domain,
  href,
}: PublishedThemeDomainProps) {
  return (
    <div className="group/domain flex min-w-0 items-center gap-1">
      <Heading
        as="h2"
        variant="section"
        className="text-text-inverse min-w-0 truncate"
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Preview (${domain})`}
        >
          {domain}
        </a>
      </Heading>
      {/* Disabled until domain settings exist. */}
      <Button
        variant="overlay-ghost"
        size="icon-sm"
        aria-label="Domain settings"
        className="opacity-0 group-hover/domain:opacity-100"
      >
        <PencilIcon />
      </Button>
    </div>
  );
}
