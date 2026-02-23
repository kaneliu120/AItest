#!/usr/bin/env node

/**
 * API格式更新脚本
 * 将现有API更新为使用标准化格式
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
const MIDDLEWARE_PATH = '@/middleware/api-standardizer';
const API_RESPONSE_PATH = '@/lib/api-response';

// 需要更新的API文件
const apiFiles = [
  'health/route.ts',
  'finance/route.ts',
  'ecosystem/monitoring/route.ts',
  'ecosystem/scheduler/route.ts',
  'ecosystem/skill-evaluator/route.ts',
  'workflows/route.ts',
  'testing/route.ts',
  'deployments/route.ts',
  'automation/route.ts',
  'tasks/route.ts',
  'freelance/route.ts'
];

// 模板函数
function generateStandardizedCode(originalContent) {
  // 检查是否已经标准化
  if (originalContent.includes('standardApiHandler')) {
    console.log('   ⚠️  API已经标准化，跳过');
    return originalContent;
  }

  // 提取现有逻辑
  const lines = originalContent.split('\n');
  let newContent = '';
  let inFunction = false;
  let functionName = '';
  let functionBody = '';
  let imports = new Set();
  
  // 分析现有代码
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 收集导入
    if (line.includes('import')) {
      if (line.includes('NextResponse')) {
        // 移除NextResponse导入，我们将使用标准格式
        if (!line.includes('NextRequest')) {
          // 只包含NextRequest
          newContent += line.replace('NextResponse', '').replace(',', '').trim() + '\n';
        }
      } else {
        newContent += line + '\n';
      }
      continue;
    }
    
    // 检测函数定义
    if (line.includes('export async function') || line.includes('export const') && line.includes('=') && line.includes('async')) {
      inFunction = true;
      functionName = line.match(/function (\w+)/)?.[1] || 
                    line.match(/export const (\w+)/)?.[1] || 
                    'handler';
      
      // 替换为标准化格式
      const method = functionName.toUpperCase();
      if (method === 'GET' || method === 'POST' || method === 'PUT' || method === 'DELETE') {
        newContent += `export const ${method} = standardApiHandler(async (request: NextRequest, requestId: string) => {\n`;
      } else {
        // 保持原样
        newContent += line + '\n';
        continue;
      }
    } else if (inFunction) {
      // 收集函数体
      functionBody += line + '\n';
      
      // 检查函数结束
      if (line.trim() === '}') {
        inFunction = false;
        
        // 转换函数体
        const standardizedBody = convertFunctionBody(functionBody, functionName);
        newContent += standardizedBody + '\n}\n);\n\n';
        
        functionBody = '';
        functionName = '';
      }
    } else {
      newContent += line + '\n';
    }
  }
  
  // 添加必要的导入
  const importStatements = [
    `import { NextRequest } from 'next/server';`,
    `import { successResponse, errorResponse } from '${API_RESPONSE_PATH}';`,
    `import { standardApiHandler } from '${MIDDLEWARE_PATH}';`
  ].join('\n');
  
  // 插入导入语句
  const linesWithImports = newContent.split('\n');
  let importInserted = false;
  let finalContent = '';
  
  for (const line of linesWithImports) {
    if (!importInserted && (line.includes('import') || line.includes('export'))) {
      if (!line.includes('import')) {
        // 在第一个export之前插入导入
        finalContent += importStatements + '\n\n';
        importInserted = true;
      }
    }
    finalContent += line + '\n';
  }
  
  if (!importInserted) {
    finalContent = importStatements + '\n\n' + finalContent;
  }
  
  return finalContent;
}

function convertFunctionBody(body, functionName) {
  const method = functionName.toUpperCase();
  
  // 移除外层的try-catch，标准处理器会处理
  body = body.replace(/^\s*try\s*{/, '').replace(/}\s*catch\s*\([^)]+\)\s*{[^}]+}\s*$/, '');
  
  // 替换NextResponse.json调用
  body = body.replace(
    /return\s+NextResponse\.json\(\s*{[\s\S]*?success:\s*(true|false)[\s\S]*?}\s*(,\s*{\s*status:\s*(\d+)\s*}\s*)?\)\s*;/g,
    (match, success, statusPart, statusCode) => {
      const isSuccess = success === 'true';
      const status = statusCode ? parseInt(statusCode) : (isSuccess ? 200 : 500);
      
      if (isSuccess) {
        return `return successResponse(data, {\n      message: '操作成功',\n      requestId,\n    });`;
      } else {
        return `return errorResponse(error.message, {\n      statusCode: ${status},\n      requestId,\n    });`;
      }
    }
  );
  
  // 替换简单的JSON返回
  body = body.replace(
    /return\s+NextResponse\.json\(\s*([^{]+)\s*(,\s*{\s*status:\s*(\d+)\s*}\s*)?\)\s*;/g,
    `return successResponse($1, {\n    requestId,\n  });`
  );
  
  // 添加错误处理
  if (!body.includes('catch')) {
    body = `try {\n${body}\n} catch (error) {\n  console.error('${functionName} API错误:', error);\n  \n  return errorResponse(\n    error instanceof Error ? error.message : '未知错误',\n    {\n      statusCode: 500,\n      requestId,\n    }\n  );\n}`;
  }
  
  return body;
}

// 主函数
async function updateApiFiles() {
  console.log('🚀 开始更新API格式...\n');
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const apiFile of apiFiles) {
    const filePath = path.join(API_DIR, apiFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ 文件不存在: ${apiFile}`);
      errorCount++;
      continue;
    }
    
    console.log(`📝 处理: ${apiFile}`);
    
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const newContent = generateStandardizedCode(originalContent);
      
      if (newContent !== originalContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`   ✅ 更新完成`);
        updatedCount++;
      } else {
        console.log(`   ⚠️ 无变化，跳过`);
        skippedCount++;
      }
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 更新完成统计:');
  console.log(`   ✅ 更新文件: ${updatedCount}`);
  console.log(`   ⚠️ 跳过文件: ${skippedCount}`);
  console.log(`   ❌ 错误文件: ${errorCount}`);
  console.log(`   📁 总计文件: ${apiFiles.length}`);
  
  // 创建示例文件
  createExampleFile();
  
  return { updatedCount, skippedCount, errorCount };
}

function createExampleFile() {
  const examplePath = path.join(__dirname, '..', 'src', 'app', 'api', 'example', 'route.ts');
  const exampleDir = path.dirname(examplePath);
  
  if (!fs.existsSync(exampleDir)) {
    fs.mkdirSync(exampleDir, { recursive: true });
  }
  
  const exampleContent = `/**
 * API标准化示例
 * 使用standardApiHandler包装所有API函数
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

// GET请求示例
export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    
    // 模拟数据
    const items = Array.from({ length: pageSize }, (_, i) => ({
      id: \`item-\${(page - 1) * pageSize + i + 1}\`,
      name: \`项目 \${(page - 1) * pageSize + i + 1}\`,
      createdAt: new Date().toISOString(),
    }));
    
    const total = 100;
    
    return paginatedResponse(items, total, page, pageSize, {
      message: '数据获取成功',
      requestId,
    });
    
  } catch (error) {
    console.error('GET API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// POST请求示例
export const POST = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return errorResponse('名称不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟创建操作
    const newItem = {
      id: \`item-\${Date.now()}\`,
      name: body.name,
      createdAt: new Date().toISOString(),
      metadata: {
        source: 'example-api',
        requestId,
        processingTime: 0, // 将由中间件填充
      }
    };
    
    return successResponse(newItem, {
      message: '项目创建成功',
      requestId,
    });
    
  } catch (error) {
    console.error('POST API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// PUT请求示例
export const PUT = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    
    if (!body.id || !body.name) {
      return errorResponse('ID和名称不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟更新操作
    const updatedItem = {
      id: body.id,
      name: body.name,
      updatedAt: new Date().toISOString(),
      metadata: {
        source: 'example-api',
        requestId,
        processingTime: 0,
      }
    };
    
    return successResponse(updatedItem, {
      message: '项目更新成功',
      requestId,
    });
    
  } catch (error) {
    console.error('PUT API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

// DELETE请求示例
export const DELETE = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return errorResponse('ID不能为空', {
        statusCode: 400,
        requestId,
      });
    }
    
    // 模拟删除操作
    return successResponse(
      { deleted: true, id },
      {
        message: '项目删除成功',
        requestId,
      }
    );
    
  } catch (error) {
    console.error('DELETE API错误:', error);
    
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});`;

  fs.writeFileSync(examplePath, exampleContent, 'utf8');
  console.log(`\n📚 创建示例文件: ${path.relative(process.cwd(), examplePath)}`);
}

// 执行更新
updateApiFiles().then(result => {
  console.log('\n🎉 API格式更新完成！');
  console.log('\n📋 下一步:');
  console.log('   1. 检查更新的API文件');
  console.log('   2. 运行测试验证功能正常');
  console.log('   3. 部署到生产环境');
  console.log('\n🔧 手动检查建议:');
  console.log('   - 验证所有API端点仍然正常工作');
  console.log('   - 检查响应格式是否统一');
  console.log('   - 测试错误处理是否正常');
  
  process.exit(result.errorCount > 0 ? 1 : 0);
}).catch(error => {
  console.error('脚本执行错误:', error);
  process.exit(1);
});