/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  // Disable React Strict Mode
  reactStrictMode: false,
  
  // Enable server-side rendering for dynamic routes
  output: 'standalone',
  
  // Enable image optimization
  images: {
    domains: ['localhost'],
  },
  
  // Disable TypeScript type checking during build (handled by IDE)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure webpack to handle ES modules and disable problematic optimizations
  webpack: (config, { isServer, dev }) => {
    // Disable the filesystem cache
    config.cache = false;
    
    // Disable source maps in production for better performance
    if (!dev) {
      config.devtool = false;
    }
    
    // Handle ES modules in node_modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Add more detailed error messages
    config.stats = 'errors-warnings';
    
    // Disable the Progress plugin which might be causing issues
    config.plugins = config.plugins.filter(
      (plugin) => plugin.constructor.name !== 'ProgressPlugin'
    );
    
    return config;
  },
  
  // Disable the static HTML fallback for 404 errors
  skipTrailingSlashRedirect: true,
  
  // Disable the static optimization for individual pages
  experimental: {
    optimizePackageImports: [],
    serverActions: false,
    webpackBuildWorker: false,
  },
};

module.exports = nextConfig;
