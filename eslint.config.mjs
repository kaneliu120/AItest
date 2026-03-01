import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 基础 JS 推荐 (降级部分规则为 warn)
  {
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      // 降级为 warn，允许项目渐进式修复
      'no-case-declarations': 'warn',
      'no-undef': 'off',        // TypeScript 已处理
    },
  },

  // TypeScript 规则
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    rules: {
      ...config.rules,
      '@typescript-eslint/no-explicit-any': 'off',          // 遗留代码中普遍使用
      '@typescript-eslint/no-empty-object-type': 'warn',    // 降级
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  })),

  // 项目级规则覆盖
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      'no-case-declarations': 'warn',
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },

  // 忽略的文件/目录
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'src/lib/requirements-analysis/**',
      'src/components/requirements-analysis/visual-dashboard.tsx',
      'src/components/requirements-analysis/visualization-dashboard.tsx',
      '*.config.*',
      'scripts/**',
    ],
  }
);
