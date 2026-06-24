'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

type AuthorBioProps = {
  author: {
    name: string;
    jobTitle: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    image: {
      alt: string;
      asset: { url: string; metadata: { lqip: string } };
    } | null;
  };
};

export function AuthorBio({ author }: AuthorBioProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-surface relative mt-8 flex gap-3 rounded-lg p-4 md:mt-12 md:gap-5 md:p-5 lg:p-6">
      {author.linkedinUrl && (
        <Link
          href={author.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 transition-opacity hover:opacity-70 md:top-4 md:right-4"
        >
          <Image
            src="/logos/linkedin-logo.svg"
            alt="LinkedIn"
            width={18}
            height={18}
            className="md:size-5"
          />
        </Link>
      )}
      {author.image && (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg md:size-20 lg:size-24">
          <Image
            src={author.image.asset.url}
            alt={author.image.alt}
            fill
            className="object-cover"
            placeholder="blur"
            blurDataURL={author.image.asset.metadata.lqip}
          />
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-center gap-1">
        <p className="font-gambarino text-base md:text-lg">{author.name}</p>
        {author.bio && (
          <>
            <p
              className={`text-foreground-light mt-1 text-xs md:text-sm ${expanded ? '' : 'line-clamp-2 md:line-clamp-3'}`}
            >
              {author.bio}
            </p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 w-fit text-xs underline underline-offset-2 hover:decoration-dashed md:text-sm"
            >
              {expanded ? 'Read less' : 'Read more'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
