/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},

  // Externalize runtime components
  serverExternalPackages: [
    '@bunny/mdx-runtime',
  ],

  // Enable WASM support for webpack
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
