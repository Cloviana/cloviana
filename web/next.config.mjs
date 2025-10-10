/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'google.com',
        port: ''
      }
    ]
   
  },
  webpack(config, { isServer, dev }) {
    const imageAssetRule = config.module.rules.find((rule) => {
      return (
        rule.test &&
        rule.test instanceof RegExp &&
        rule.test.test('.svg')
      );
    });

    if (imageAssetRule) {
      const newRegex = new RegExp(
        imageAssetRule.test
          .source
          .replace(/\|?svg\|?/, '')
      );

      imageAssetRule.test = newRegex;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgo: true,
            svgoConfig: {
              multipass: true,
              plugins: [
                { name: 'removeViewBox', active: false },
              ],
            },
          },
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
