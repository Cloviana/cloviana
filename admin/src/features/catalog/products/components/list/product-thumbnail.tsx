import { ImageIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/** A product's image in a 32px rounded square, or a bordered image icon when it has none or it fails to load. */
export function ProductThumbnail({ src }: { src: string | null }) {
  return (
    <Avatar className="size-8 rounded-lg">
      {/* Decorative: the product's title is always shown beside it. */}
      {src && <AvatarImage src={src} alt="" className="object-cover" />}
      <AvatarFallback className="border-line border-border-default bg-surface text-icon-subtle rounded-lg">
        <ImageIcon className="size-4" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  );
}
