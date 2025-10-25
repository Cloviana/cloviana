import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invite - Cloviana',
  description:
    'Accept your Cloviana invite to access your store and start automating your SEO workflow.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
