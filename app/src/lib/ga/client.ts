export const gaEvent = (name: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
    window.gtag('event', name, params || {});
  }
};
