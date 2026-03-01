// 简单的API监控脚本
const http = require('http');

const API_URL = 'http://localhost:3002/api/health';
const LOG_FILE = '/tmp/api-monitor.log';
const fs = require('fs').promises;

async function checkAPI() {
  const timestamp = new Date().toISOString();
  
  return new Promise((resolve) => {
    const req = http.get(API_URL, { timeout: 5000 }, async (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', async () => {
        try {
          const result = JSON.parse(data);
          const log = `[${timestamp}] ✅ API正常 | 数据库: ${result.database || 'unknown'}\n`;
          await fs.appendFile(LOG_FILE, log);
          resolve({ healthy: true, database: result.database });
        } catch (e) {
          const log = `[${timestamp}] ❌ API响应解析失败\n`;
          await fs.appendFile(LOG_FILE, log);
          resolve({ healthy: false, error: 'parse error' });
        }
      });
    });

    req.on('error', async (err) => {
      const log = `[${timestamp}] ❌ API连接失败: ${err.message}\n`;
      await fs.appendFile(LOG_FILE, log);
      resolve({ healthy: false, error: err.message });
    });

    req.on('timeout', async () => {
      const log = `[${timestamp}] ❌ API请求超时\n`;
      await fs.appendFile(LOG_FILE, log);
      req.destroy();
      resolve({ healthy: false, error: 'timeout' });
    });
  });
}

// 执行监控
async function main() {
  console.log('🔍 检查API服务器状态...');
  const result = await checkAPI();
  
  if (result.healthy) {
    console.log(`✅ API服务器正常 | 数据库: ${result.database}`);
    process.exit(0);
  } else {
    console.log(`❌ API服务器异常: ${result.error}`);
    process.exit(1);
  }
}

main().catch(console.error);
