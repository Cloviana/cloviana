import { readFileSync } from 'fs';
import { join } from 'path';

import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const font = readFileSync(
    join(process.cwd(), 'public/fonts/satoshi/OTF/Satoshi-Bold.otf'),
  );
  const logo = readFileSync(join(process.cwd(), 'public/logo-full.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    <div
      style={{
        background: '#f4f2f0',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        fontFamily: 'Satoshi',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <img
          src={logoSrc}
          alt="Cloviana"
          width={180}
          height={40}
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: '#1a1a1a',
          lineHeight: 1.1,
          maxWidth: 800,
        }}
      >
        Be the Answer Every B2B Buyer Gets
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 24,
          color: '#666',
          maxWidth: 700,
        }}
      >
        Autonomous GEO agent for B2B SaaS — appear in ChatGPT, Perplexity &
        Gemini
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Satoshi', data: font, weight: 700 }],
    },
  );
}
