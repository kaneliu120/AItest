/**
 * 示例自动化测试任务
 */

export const sampleTasks = [
  {
    id: 'test-aiassist-web',
    name: 'AI Assist Web 测试',
    description: '使用 AI Assist 测试网站功能',
    moduleId: 'aiassist-automation',
    action: 'run-web-test',
    schedule: {
      cron: '0 9 * * *', // 每天上午9点
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
    name: 'CortexaAI API 测试',
    description: '使用 CortexaAI 测试 API 接口',
    moduleId: 'cortexaai-automation',
    action: 'run-api-test',
    schedule: {
      cron: '*/30 * * * *', // 每30分钟
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
    name: '每日网站截图',
    description: '每天对关键页面进行截图',
    moduleId: 'aiassist-automation',
    action: 'take-screenshot',
    schedule: {
      cron: '0 18 * * *', // 每天下午6点
      enabled: true
    },
    parameters: {
      url: 'https://myskillstore.dev',
      fullPage: true
    }
  },
  {
    id: 'performance-monitor',
    name: '性能监控',
    description: '监控网站性能',
    moduleId: 'cortexaai-automation',
    action: 'run-performance-test',
    schedule: {
      cron: '0 */6 * * *', // 每6小时
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
export async function registerSampleTasks(taskScheduler: any) {
  console.log('注册示例自动化测试任务...');
  
  for (const task of sampleTasks) {
    try {
      // 这里应该调用任务调度器的注册方法
      console.log(`  • ${task.name} (${task.id})`);
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      console.error(`  ❌ ${task.name} 注册失败:`, error);
    }
  }
  
  console.log(`示例任务注册完成，共 ${sampleTasks.length} 个任务`);
  return sampleTasks;
}

export default {
  sampleTasks,
  registerSampleTasks
};
