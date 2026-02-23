/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // 允许生产构建在存在 TypeScript 错误时也能通过
    // 类型错误通过单独的 type-check 步骤捕获
    ignoreBuildErrors: true,
  },
  eslint: {
    // 同样允许 lint 错误不阻断构建
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
