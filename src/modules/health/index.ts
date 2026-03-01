/**
 * 健康监控模块导出
 */

// 类型导出
export * from './types';

// 服务导出
export { healthService, HealthService } from './services/health.service';

// 组件导出
export { default as HealthDashboard } from './components/HealthDashboard';

// 工具函数
export * from './utils/health.utils';

// 模块配置
export const healthModuleConfig = {
  name: 'health-monitoring',
  version: '1.0.0',
  description: '系统健康监控模块',
  dependencies: ['shared-types', 'shared-api']
};