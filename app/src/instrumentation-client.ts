if (process.env.NODE_ENV === 'development') {
  try {
    const { worker } = await import('@/mocks/browser');

    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
  } catch (error) {
    console.error('[MSW] Failed to start the browser worker.', error);
  }
}
