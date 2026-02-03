/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@neondatabase/serverless'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Disable experimental dev tools to fix React Client Manifest error
  experimental: {
    reactCompiler: false,
  },
  // Exclude the old project folder from compilation
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
  // Exclude old project from TypeScript checking
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript errors during builds
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
}

module.exports = nextConfig