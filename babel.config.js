module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }], // 自动导入React，无需手写import React
    '@babel/preset-typescript',
  ],
};
