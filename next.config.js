/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 移除 basePath: '/mission'，直接用根路径
  // 修复 Turbopack workspace 根目录识别问题
  turbopack: {
    root: path.resolve(__dirname),
  },
};

module.exports = nextConfig;
