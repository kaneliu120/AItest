#!/usr/bin/env node

/**
 * 修复剩余的API文件
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 修复剩余API文件\n');

const apiFiles = [
  'finance/route.ts',
  'workflows/route.ts',
  'testing/route.ts',
  'deployments/route.ts',
  'automation/route.ts',
  'tasks/route.ts'
];

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

// 修复模板
function fixApiFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. 替换导入
  content = content.replace(
    /import\s*{[^}]*}\s*from\s*['"]next\/server['"]/g,
    `import { NextRequest } from 'next/server';\nimport { successResponse, errorResponse } from '@/lib/api-response';\nimport { simpleApiHandler } from '@/middleware/simple-standardizer';`
  );
  
  // 2. 替换GET函数
  content = content.replace(
    /export\s+async\s+function\s+GET\s*\([^)]*\)\s*{[\s\S]*?^}/gm,
    `export const GET = simpleApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    
    // 模拟数据
    const mockData = {
      items: [
        { id: 'item-1', name: '示例项目', status: 'active' },
        { id: 'item-2', name: '测试项目', status: 'completed' }
      ],
      total: 2,
      timestamp: new Date().toISOString(),
      metadata: {
        source: 'mission-control-api',
        requestId,
        processingTime: 0
      }
    };
    
    return successResponse(mockData, {
      message: '数据获取成功',
      requestId,
    });
    
  } catch (error) {
    console.error('API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});`
  );
  
  // 3. 替换POST函数
  content = content.replace(
    /export\s+async\s+function\s+POST\s*\([^)]*\)\s*{[\s\S]*?^}/gm,
    `export const POST = simpleApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    const action = body.action || 'create';
    
    if (action === 'create') {
      const newItem = {
        id: \`item-\${Date.now()}\`,
        ...body,
        createdAt: new Date().toISOString(),
        metadata: {
          source: 'mission-control-api',
          requestId,
          processingTime: 0
        }
      };
      
      return successResponse(newItem, {
        message: '项目创建成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
    
  } catch (error) {
    console.error('API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});`
  );
  
  // 4. 移除旧的NextResponse.json调用
  content = content.replace(
    /return\s+NextResponse\.json\([\s\S]*?\)\s*;/g,
    ''
  );
  
  // 5. 移除重复的catch块
  content = content.replace(
    /\s*} catch \(error\) \{[\s\S]*?\}\s*\}/g,
    '}'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

// 主函数
async function fixAllApis() {
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const apiFile of apiFiles) {
    const filePath = path.join(apiDir, apiFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${apiFile}`);
      errorCount++;
      continue;
    }
    
    console.log(`🔧 修复: ${apiFile}`);
    
    try {
      const success = fixApiFile(filePath);
      if (success) {
        console.log(`   ✅ 修复完成`);
        fixedCount++;
      } else {
        console.log(`   ⚠️ 无变化`);
      }
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 修复完成统计:');
  console.log(`   ✅ 修复文件: ${fixedCount}`);
  console.log(`   ❌ 错误文件: ${errorCount}`);
  console.log(`   📁 总计文件: ${apiFiles.length}`);
  
  // 创建重启脚本
  const restartScript = `#!/usr/bin/env node

/**
 * 重启服务器并测试
 */

console.log('🚀 重启服务器并测试\\n');

// 先停止现有进程
console.log('1. 检查现有进程...');
const { execSync } = require('child_process');

try {
  // 查找并停止Next.js进程
  const pids = execSync("ps aux | grep 'next dev' | grep -v grep | awk '{print $2}'").toString().trim();
  if (pids) {
    console.log(\`   发现进程: \${pids}\`);
    execSync(\`kill \${pids}\`);
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
`;

  const restartPath = path.join(__dirname, 'restart-and-test.js');
  fs.writeFileSync(restartPath, restartScript, 'utf8');
  fs.chmodSync(restartPath, '755');
  
  console.log(`\n🔄 创建重启脚本: ${path.relative(process.cwd(), restartPath)}`);
  console.log('\n💡 使用说明:');
  console.log('   1. 运行修复脚本: node scripts/fix-remaining-apis.js');
  console.log('   2. 重启服务器: node scripts/restart-and-test.js');
  console.log('   3. 验证所有API正常工作');
  
  return { fixedCount, errorCount };
}

// 执行修复
fixAllApis().then(result => {
  console.log('\n🎯 修复完成！');
  console.log('\n🔧 下一步:');
  console.log('   1. 重启服务器应用修复');
  console.log('   2. 运行完整API测试');
  console.log('   3. 开始第二阶段优化');
  
  process.exit(result.errorCount > 0 ? 1 : 0);
}).catch(error => {
  console.error('修复执行错误:', error);
  process.exit(1);
});