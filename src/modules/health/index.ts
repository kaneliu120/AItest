/**
 * Health monitoring module exports
 */

// Type exports
export * from './types';

// Service exports
export { healthService, HealthService } from './services/health.service';

// Component exports
export { default as HealthDashboard } from './components/HealthDashboard';

// Utility functions
export * from './utils/health.utils';

// Module configuration
export const healthModuleConfig = {
  name: 'health-monitoring',
  version: '1.0.0',
  description: 'System health monitoring module',
  dependencies: ['shared-types', 'shared-api']
};