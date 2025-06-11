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
  webpack: (config, { isServer, webpack }) => {
    // The "Critical dependency: the request of a dependency is an expression" warning
    // often originates from libraries like @supabase/realtime-js when they use
    // dynamic requires or imports that Webpack cannot statically analyze.

    // If this warning appears during server-side bundling (e.g., for API routes, as in this case),
    // making @supabase/realtime-js external can resolve it. This means Node.js
    // will require() it at runtime instead of Webpack trying to bundle it.
    // This is generally safe if its real-time client features aren't actively used
    // in the server-side context where it's imported.
    if (isServer) {
      config.externals = [...config.externals, '@supabase/realtime-js'];
    }

    // Additionally, @supabase/realtime-js or its dependencies (like WebSocket libraries)
    // might try to optionally include native modules like 'bufferutil' and 'utf-8-validate'.
    // Making these external tells Webpack not to bundle them and can prevent related warnings.
    // This is a common fix for issues involving the 'ws' package or similar.
    config.externals.push('bufferutil', 'utf-8-validate');

    return config;
  },
};

export default nextConfig;
