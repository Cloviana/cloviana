import fs from 'fs';
import path from 'path';

import { marked } from 'marked';

export const metadata = {
  title: 'Privacy Policy — Cloviana',
  description: 'Read how Cloviana collects, uses, and protects your data.',
  robots: { index: false },
};

export default async function PrivacyPolicyPage() {
  const filePath = path.join(
    process.cwd(),
    'src',
    'content',
    'privacy-policy.md',
  );
  const file = fs.readFileSync(filePath, 'utf8');
  const html = await marked(file);

  return (
    <div
      className="prose mx-auto max-w-4xl py-16"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
