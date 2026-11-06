import { links } from '@/config/links';
import { gaEvent } from '@/lib/ga/client';

export function useBookDemo() {
  return (email?: string) => {
    let calendlyUrl = links.demo;

    if (email) calendlyUrl += `?email=${encodeURIComponent(email)}`;

    gaEvent('book_demo', { email });

    window.open(calendlyUrl, '_blank');
  };
}
