/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloviana-assets.azureedge.net', port: '' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'google.com', port: '' },
      { protocol: 'https', hostname: 'cloviana-media-dev-f8b6ajcdbudyfxef.z01.azurefd.net', port: '' },
      { protocol: 'https', hostname: 'cloviana-media-e8b0d8eug6h9dfan.z01.azurefd.net', port: '' },
    ],
  },
  webpack(config) {
    const fileLoaderRule = config.module.rules.find((rule) => rule.test?.test?.('.svg'));

    if (!fileLoaderRule) {
      return config;
    }
    const resourceQueryNot = fileLoaderRule.resourceQuery?.not ?? [];

    config.module.rules.push({
      test: /\.svg$/i,
      ...fileLoaderRule,
      resourceQuery: /url/,
    });

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: fileLoaderRule.issuer,
      resourceQuery: { not: [...resourceQueryNot, /url/] },
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: { multipass: true, plugins: [{ name: 'removeViewBox', active: false }] },
          },
        },
      ],
    });

    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

export default nextConfig;
