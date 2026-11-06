import Image from 'next/image';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';

interface ThemePreviewProps {
  name: string;
  src: string | null;
  editHref: string;
}

// The whole screenshot links to the editor, like Shopify's.
export function ThemePreview({ name, src, editHref }: ThemePreviewProps) {
  return (
    <Link
      href={editHref}
      aria-label={`Edit ${name}`}
      className="focus-visible:ring-border-focused block outline-none focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-inset"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        {src ? (
          <Image
            src={src}
            alt={`${name} preview`}
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        ) : (
          <Skeleton className="size-full rounded-none" />
        )}
      </div>
    </Link>
  );
}
