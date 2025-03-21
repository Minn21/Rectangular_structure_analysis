/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  webpack: (config) => {
    // This is needed for proper handling of Three.js modules
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx']
    };
    
    return config;
  },
};

module.exports = nextConfig; 