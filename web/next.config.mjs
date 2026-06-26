/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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
