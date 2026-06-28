import type { Metadata } from 'next';

import { Audit } from '@/features/audit';

import { AuditContent } from './_components/audit-content';

async function fetchAuditServer(auditSlug: string): Promise<Audit | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/audits/${auditSlug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ auditId: string }>;
}): Promise<Metadata> {
  const { auditId: auditSlug } = await params;
  const audit = await fetchAuditServer(auditSlug);

  if (!audit) {
    return {
      title: 'AI Visibility Report | Cloviana',
      description:
        'See how your brand ranks across ChatGPT, Perplexity, and Google AIO vs. competitors.',
    };
  }

  const name = audit.brandName ?? audit.domain;
  const visibilityEntry = audit.visibilityLeaderboard?.find(
    (b) => b.domain === audit.domain,
  );
  const mentionShare = visibilityEntry?.mentionShare;
  const scoreClause =
    mentionShare != null
      ? ` AI visibility score: ${mentionShare.toFixed(1)}%.`
      : '';

  const title = `${name}'s AI Visibility Report | Cloviana`;
  const description = `See how ${name} ranks across ChatGPT, Perplexity, and Google AIO vs. competitors.${scoreClause}`;
  const url = `https://cloviana.com/audits/${audit.slug}`;

  return {
    title,
    description,
    robots: { index: false },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Cloviana',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AuditPage({
  params,
}: {
  params: Promise<{ auditId: string }>;
}) {
  const { auditId: auditSlug } = await params;
  const audit = await fetchAuditServer(auditSlug);

  const reportSchema = audit
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Report',
        name: `${audit.brandName ?? audit.domain} AI Visibility Report`,
        description: `AI visibility analysis for ${audit.brandName ?? audit.domain} across ChatGPT, Perplexity, and Google AI Overviews.`,
        about: {
          '@type': 'Organization',
          name: audit.brandName ?? audit.domain,
          url: `https://${audit.domain}`,
        },
        creator: {
          '@type': 'Organization',
          name: 'Cloviana',
          url: 'https://cloviana.com',
        },
      })
    : null;

  return (
    <>
      {reportSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: reportSchema }}
        />
      )}
      <AuditContent auditSlug={audit?.slug ?? auditSlug} initialData={audit} />
    </>
  );
}
