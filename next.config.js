/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'puppeteer': 'commonjs puppeteer',
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }
    return config;
  },
  // Increase API timeout for long-running operations
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  // Optimize for Vercel deployment
  poweredByHeader: false,
  compress: true,
  // Enable standalone output for better deployment
  output: 'standalone',
};

module.exports = nextConfig;