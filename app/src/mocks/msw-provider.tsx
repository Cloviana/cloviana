'use client';

import { useEffect } from 'react';

let started = false;

export function MSWProvider() {
  useEffect(() => {
    if (started) return;
    started = true;
    import('./browser').then(({ worker }) =>
      worker.start({
        onUnhandledRequest(request, print) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
          if (
            apiUrl &&
            request.url.startsWith(`${apiUrl}/businesses`) &&
            request.url.includes('/documents')
          ) {
            print.warning();
          }
        },
      }),
    );
  }, []);

  return null;
}
