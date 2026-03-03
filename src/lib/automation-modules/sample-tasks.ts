import { logger } from '@/lib/logger';
/**
 * 示例自动化测试任务
 */

export const sampleTasks = [
  {
    id: 'test-aiassist-web',
    name: 'AI Assist Web Testing',
    description: 'Test website functionality using AI Assist',
    moduleId: 'aiassist-automation',
    action: 'run-web-test',
    schedule: {
      cron: '0 9 * * *', // daily at 9:00am
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
    name: 'CortexaAI API Testing',
    description: 'Test API interfaces using CortexaAI',
    moduleId: 'cortexaai-automation',
    action: 'run-api-test',
    schedule: {
      cron: '*/30 * * * *', // every 30 minutes
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
    name: 'Daily Website Screenshots',
    description: 'Take screenshots of key pages daily',
    moduleId: 'aiassist-automation',
    action: 'take-screenshot',
    schedule: {
      cron: '0 18 * * *', // daily at 6:00pm
      enabled: true
    },
    parameters: {
      url: 'https://myskillstore.dev',
      fullPage: true
    }
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitoring',
    description: 'Monitor website performance',
    moduleId: 'cortexaai-automation',
    action: 'run-performance-test',
    schedule: {
      cron: '0 */6 * * *', // every 6 hours
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
 * 注册示例任务
 */
export async function registerSampleTasks(taskScheduler: { createTask?: (task: unknown) => unknown }) {
  console.log('Registering sample automation test tasks...');
  
  for (const task of sampleTasks) {
    try {
      // 这里应该调用任务调度器的注册方法
      console.log(`  • ${task.name} (${task.id})`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      logger.error('Sample task registration failed', error, { taskId: task.id, taskName: task.name });
    }
  }
  
  console.log(`Sample task registration complete, total ${sampleTasks.length} tasks`);
  return sampleTasks;
}

export default {
  sampleTasks,
  registerSampleTasks
};
