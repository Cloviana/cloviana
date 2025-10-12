/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cloviana-assets.azureedge.net', port: '' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: 'google.com', port: '' },
      { protocol: 'https', hostname: 'clovianadev.blob.core.windows.net', port: '' },
    ],
  },
  webpack(config) {
    const assetRule = config.module.rules.find(
      (rule) => rule.test && rule.test instanceof RegExp && rule.test.test('.svg')
    );
    if (assetRule) {
      assetRule.exclude = /\.svg$/i;
    }
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
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
    return config;
  },
};

export default nextConfig;
