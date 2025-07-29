/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side rendering for dynamic routes
  output: 'standalone',
  
  // Image optimization configuration
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimental features
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['react-quill'],
    serverActionsBodySizeLimit: '2mb',
  },
  
  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Disable the filesystem cache in development
    if (dev) {
      config.cache = false;
    }
    
    // Disable source maps in production for better performance
    if (!dev) {
      config.devtool = false;
    }
    
    // Handle ES modules in node_modules
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
      layers: true,
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
