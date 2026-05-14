import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';

export function useBookDemo() {
  return (email?: string, auditId?: string) => {
    let calendlyUrl = links.demo;

    if (email) calendlyUrl += `?email=${encodeURIComponent(email)}`;

    gaEvent('book_demo', { email, audit_id: auditId });

    window.open(calendlyUrl, '_blank');
  };
}
