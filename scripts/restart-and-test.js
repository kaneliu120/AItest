#!/usr/bin/env node

/**
 * 重启服务器并测试
 */

console.log('🚀 重启服务器并测试\n');

// 先停止现有进程
console.log('1. 检查现有进程...');
const { execSync } = require('child_process');

try {
  // 查找并停止Next.js进程
  const pids = execSync("ps aux | grep 'next dev' | grep -v grep | awk '{print $2}'").toString().trim();
  if (pids) {
    console.log(`   发现进程: ${pids}`);
    execSync(`kill ${pids}`);
    console.log('   进程已停止');
  } else {
    console.log('   无运行中的进程');
  }
} catch (error) {
  // 忽略错误
}

// 等待
console.log('2. 等待2秒...');
setTimeout(() => {
  console.log('3. 启动服务器...');
  
  const { spawn } = require('child_process');
  const server = spawn('npm', ['run', 'dev'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    detached: true
  });
  
  server.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready')) {
      console.log('   ✅ 服务器启动成功');
      console.log('4. 等待3秒后测试...');
      
      setTimeout(() => {
        console.log('5. 运行API测试...');
        const testScript = require('./test-all-apis-final.js');
      }, 3000);
    }
    console.log(output.trim());
  });
  
  server.stderr.on('data', (data) => {
    console.error('服务器错误:', data.toString());
  });
  
  // 保存进程ID
  fs.writeFileSync('.server.pid', server.pid.toString());
  
}, 2000);
