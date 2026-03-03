import { logger } from '@/lib/logger';
/**
 * ExampleAutomationTestTask
 */

export const sampleTasks = [
  {
    id: 'test-aiassist-web',
    name: 'AI Assist Web Test',
    description: 'using AI Assist Test网站功can',
    moduleId: 'aiassist-automation',
    action: 'run-web-test',
    schedule: {
      cron: '0 9 * * *', // 每d上午9点
      enabled: true
    },
    parameters: {
      url: 'https://example.com',
      testScript: 'test/login.js',
      waitForSelector: '.dashboard'
    },
    retryPolicy: {
      maxRetries: 3,
      retryDelay: 5000
    }
  },
  {
    id: 'test-cortexaai-api',
    name: 'CortexaAI API Test',
    description: 'using CortexaAI Test API Interface',
    moduleId: 'cortexaai-automation',
    action: 'run-api-test',
    schedule: {
      cron: '*/30 * * * *', // 每30min
      enabled: true
    },
    parameters: {
      endpoint: 'http://localhost:3000/api/health',
      method: 'GET',
      expectedStatus: 200
    },
    retryPolicy: {
      maxRetries: 2,
      retryDelay: 3000
    }
  },
  {
    id: 'daily-screenshot',
    name: '每日网站截Graph',
    description: '每dforOff键页面In Progress截Graph',
    moduleId: 'aiassist-automation',
    action: 'take-screenshot',
    schedule: {
      cron: '0 18 * * *', // 每d下午6点
      enabled: true
    },
    parameters: {
      url: 'https://myskillstore.dev',
      fullPage: true
    }
  },
  {
    id: 'performance-monitor',
    name: 'PerformanceMonitoring',
    description: 'Monitoring网站Performance',
    moduleId: 'cortexaai-automation',
    action: 'run-performance-test',
    schedule: {
      cron: '0 */6 * * *', // 每6Small时
      enabled: true
    },
    parameters: {
      endpoint: 'https://myskillstore.dev',
      concurrentUsers: 50,
      duration: 30,
      rampUp: 5
    }
  }
];

/**
 * RegisterExampleTask
 */
export async function registerSampleTasks(taskScheduler: { createTask?: (task: unknown) => unknown }) {
  console.log('RegisterExampleAutomationTestTask...');
  
  for (const task of sampleTasks) {
    try {
      // 这里should调用TaskScheduling器'sRegistermethod
      console.log(`  • ${task.name} (${task.id})`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      logger.error('ExampleTaskRegisterfailed', error, { taskId: task.id, taskName: task.name });
    }
  }
  
  console.log(`ExampleTaskRegisterCompleted, 共 ${sampleTasks.length}  Task`);
  return sampleTasks;
}

export default {
  sampleTasks,
  registerSampleTasks
};
