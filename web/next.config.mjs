/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // dev-only: lets the API's headless PDF renderer reach this server over the
  // docker network; without it Next blocks dev resources and never hydrates
  allowedDevOrigins: ['web', 'nginx', 'localhost'],
  webpack(config) {
    const assetRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg'),
    );
    if (assetRule) assetRule.exclude = /\.svg$/i;
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
  images: {
    localPatterns: [
      {
        pathname: '/images/**',
      },
      {
        pathname: '/*.png',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'google.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
      },
    ],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [
          {
            loader: '@svgr/webpack',
            options: {
              dimensions: false,
              svgo: true,
              svgoConfig: {
                multipass: true,
                plugins: [{ name: 'removeViewBox', active: false }],
              },
            },
          },
        ],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
