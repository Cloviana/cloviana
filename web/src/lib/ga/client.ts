export const gaEvent = (
  name: string,
  params: Record<string, any> = {},
  cb?: () => void,
) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined')
    return;
  window.gtag('event', name, {
    ...params,
    transport_type: 'beacon',
    event_callback: cb,
  });
};
