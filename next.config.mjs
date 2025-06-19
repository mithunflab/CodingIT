import { readFile } from 'fs/promises';
import { join } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    config.externals.push({
      '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
    });

    // Handling large JSON files by reading them at build time
    const templatesPath = join(process.cwd(), 'lib', 'templates.json');
    config.plugins.push(
      new (class {
        apply(compiler) {
          compiler.hooks.thisCompilation.tap(
            'InjectTemplatesPlugin',
            compilation => {
              compilation.hooks.processAssets.tapAsync(
                {
                  name: 'InjectTemplatesPlugin',
                  stage:
                    compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
                },
                async (assets, callback) => {
                  try {
                    const templatesContent = await readFile(
                      templatesPath,
                      'utf-8',
                    );
                    const templatesJson = JSON.stringify(
                      JSON.parse(templatesContent),
                    );
                    const assetId = 'lib/templates.json';
                    assets[assetId] = {
                      source: () => `export default ${templatesJson}`,
                      size: () => templatesJson.length,
                    };
                    callback();
                  } catch (error) {
                    callback(error);
                  }
                },
              );
            },
          );
        }
      })(),
    );

    return config;
  },
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
