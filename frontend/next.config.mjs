/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Server Components for pages that use client-side features
  experimental: {
    // This ensures pages with client-side features like localStorage work properly
    serverActions: false
  }
};

export default nextConfig;
