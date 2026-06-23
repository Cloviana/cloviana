import { readFileSync } from 'fs';
import { join } from 'path';

import { ImageResponse } from 'next/og';

import { sanityClient } from '@/sanity/client';
import { POST_QUERY, type BlogPost } from '@/sanity/queries/post';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await sanityClient.fetch<BlogPost | null>(POST_QUERY, { slug });

  const font = readFileSync(
    join(process.cwd(), 'public/fonts/satoshi/OTF/Satoshi-Bold.otf'),
  );
  const logo = readFileSync(join(process.cwd(), 'public/logo-full.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  const title = post?.title ?? 'Cloviana Blog';
  const author = post?.author?.name;
  const thumbnailUrl = post?.thumbnail?.asset.url;

  return new ImageResponse(
    <div
      style={{
        background: '#f4f2f0',
        width: '100%',
        height: '100%',
        display: 'flex',
        fontFamily: 'Satoshi',
      }}
    >
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.15,
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 80px',
          width: '100%',
        }}
      >
        <img
          src={logoSrc}
          alt="Cloviana"
          width={160}
          height={36}
          style={{ objectFit: 'contain' }}
        />
        <div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {author && (
            <div style={{ marginTop: 20, fontSize: 22, color: '#666' }}>
              By {author}
            </div>
          )}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Satoshi', data: font, weight: 700 }],
    },
  );
}
