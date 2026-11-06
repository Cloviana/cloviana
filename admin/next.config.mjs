/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Vendors and shoppers authenticate on the marketplace's own host, so the session cookie
  // must be set by that host. These rewrites forward only the marketplace-auth routes to the
  // Nest API; everything else calls the API directly (see ARCHITECTURE.md). Point
  // INTERNAL_API_URL at the API itself, not a proxy that rewrites x-forwarded-host, because
  // the API resolves the marketplace from that header.
  async rewrites() {
    const api = (
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      ''
    ).replace(/\/$/, '');
    if (!api) return [];

    return [
      {
        source: '/api/platform-auth/:path*',
        destination: `${api}/platform-auth/:path*`,
      },
      {
        source: '/api/marketplace-auth/:path*',
        destination: `${api}/marketplace-auth/:path*`,
      },
      {
        source: '/api/marketplace-auth-handoff/:path*',
        destination: `${api}/marketplace-auth-handoff/:path*`,
      },
    ];
  },
};

export default nextConfig;
