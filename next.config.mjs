/** @type {import('next').NextConfig} */

const nextConfig = {
  env: {
    SANDBOX_ID: 'ina8cw5gcg0ts1as7iz7o-5b7f1102',
  },
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' *.e2b.app;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
