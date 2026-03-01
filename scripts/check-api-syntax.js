#!/usr/bin/env node

/**
 * 检查所有API文件的语法和导入错误
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return colors[color] + text + colors.reset;
}

// 查找所有API文件
function findApiFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        traverse(fullPath);
      } else if (item.name === 'route.ts' || item.name === 'route.js') {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// 检查文件语法
function checkFileSyntax(filePath) {
  try {
    // 尝试使用TypeScript编译器检查语法
    const relativePath = path.relative(process.cwd(), filePath);
    execSync(`npx tsc --noEmit --target es2020 --module esnext --allowJs --checkJs ${filePath}`, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 检查常见导入问题
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];
  
  // 检查 financeStore.getTransactions
  if (content.includes('financeStore.getTransactions') && !content.includes('getTransactions')) {
    issues.push('使用已弃用的 financeStore.getTransactions，应使用 getTransactions');
  }
  
  // 检查 getTasksByType
  if (content.includes('getTasksByType') && !content.includes('getAllTasks')) {
    issues.push('使用已弃用的 getTasksByType，应使用 getAllTasks 然后过滤');
  }
  
  // 检查缺少导入
  const imports = content.match(/import\s+{[^}]+}\s+from\s+['"][^'"]+['"]/g) || [];
  const importedItems = imports.flatMap(imp => {
    const match = imp.match(/import\s+{([^}]+)}/);
    return match ? match[1].split(',').map(s => s.trim()) : [];
  });
  
  // 检查使用的函数是否已导入
  const functionCalls = content.match(/\b(getTransactions|getAllTasks|financeStore|taskStore)\b/g) || [];
  for (const func of functionCalls) {
    if (!importedItems.includes(func) && func !== 'taskStore') {
      issues.push(`使用未导入的函数: ${func}`);
    }
  }
  
  return issues;
}

// 检查路由方法
function checkRouteMethods(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  
  // 检查是否导出了正确的HTTP方法
  const exportedFunctions = content.match(/export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/g) || [];
  const methods = exportedFunctions.map(fn => {
    const match = fn.match(/function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/);
    return match ? match[1] : null;
  }).filter(Boolean);
  
  if (methods.length === 0) {
    issues.push('未导出任何HTTP方法函数 (GET/POST等)');
  }
  
  // 检查是否缺少错误处理
  if (!content.includes('try {') && !content.includes('catch')) {
    issues.push('缺少错误处理 (try-catch)');
  }
  
  return { methods, issues };
}

async function runAllChecks() {
  console.log(colorize('🔍 Mission Control API 语法和导入检查', 'cyan'));
  console.log(colorize('='.repeat(70), 'gray'));
  
  const apiFiles = findApiFiles(API_DIR);
  console.log(`找到 ${apiFiles.length} 个API文件`);
  
  const results = [];
  let totalIssues = 0;
  
  for (const filePath of apiFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    process.stdout.write(`检查 ${relativePath}... `);
    
    const syntaxCheck = checkFileSyntax(filePath);
    const importIssues = checkImports(filePath);
    const routeCheck = checkRouteMethods(filePath);
    
    const allIssues = [
      ...(syntaxCheck.success ? [] : [`语法错误: ${syntaxCheck.error.substring(0, 100)}...`]),
      ...importIssues,
      ...routeCheck.issues,
    ];
    
    if (allIssues.length === 0) {
      console.log(colorize('✅ 通过', 'green'));
    } else {
      console.log(colorize(`❌ ${allIssues.length} 个问题`, 'red'));
      totalIssues += allIssues.length;
    }
    
    results.push({
      file: relativePath,
      issues: allIssues,
      methods: routeCheck.methods,
      hasSyntaxError: !syntaxCheck.success,
    });
  }
  
  // 打印汇总报告
  console.log('\n' + colorize('📊 检查结果汇总', 'cyan'));
  console.log(colorize('='.repeat(70), 'gray'));
  console.log(`总计: ${apiFiles.length} 个API文件`);
  console.log(colorize(`有问题的文件: ${results.filter(r => r.issues.length > 0).length}`, totalIssues > 0 ? 'red' : 'green'));
  console.log(`总问题数: ${totalIssues}`);
  
  // 打印问题详情
  if (totalIssues > 0) {
    console.log('\n' + colorize('🔧 问题详情', 'yellow'));
    
    for (const result of results.filter(r => r.issues.length > 0)) {
      console.log(`\n${colorize(result.file, 'magenta')}`);
      console.log(`  支持的方法: ${result.methods.join(', ') || '无'}`);
      
      for (const issue of result.issues) {
        console.log(`  • ${colorize(issue, 'red')}`);
      }
    }
  }
  
  // 统计常见问题
  console.log('\n' + colorize('📈 常见问题统计', 'cyan'));
  console.log(colorize('='.repeat(70), 'gray'));
  
  const issueTypes = {};
  results.forEach(result => {
    result.issues.forEach(issue => {
      const type = issue.split(':')[0];
      issueTypes[type] = (issueTypes[type] || 0) + 1;
    });
  });
  
  Object.entries(issueTypes).forEach(([type, count]) => {
    console.log(`${type.padEnd(30)}: ${count}`);
  });
  
  // 生成修复建议
  console.log('\n' + colorize('💡 修复建议', 'magenta'));
  console.log(colorize('='.repeat(70), 'gray'));
  
  if (totalIssues === 0) {
    console.log('✅ 所有API文件语法正确，无需修复。');
  } else {
    console.log('需要修复的问题:');
    
    // financeStore.getTransactions 问题
    const financeStoreIssues = results.filter(r => 
      r.issues.some(i => i.includes('financeStore.getTransactions'))
    );
    if (financeStoreIssues.length > 0) {
      console.log('\n1. financeStore.getTransactions 问题:');
      console.log('   问题: financeStore 对象没有 getTransactions 方法');
      console.log('   修复: 使用 getTransactions 函数代替');
      console.log('   示例:');
      console.log('     错误: financeStore.getTransactions()');
      console.log('     正确: getTransactions()');
      console.log('   需要导入: import { getTransactions } from "@/lib/finance-store"');
    }
    
    // getTasksByType 问题
    const tasksByTypeIssues = results.filter(r => 
      r.issues.some(i => i.includes('getTasksByType'))
    );
    if (tasksByTypeIssues.length > 0) {
      console.log('\n2. getTasksByType 问题:');
      console.log('   问题: getTasksByType 函数不存在或数据库缺少 type 列');
      console.log('   修复: 使用 getAllTasks 然后过滤');
      console.log('   示例:');
      console.log('     错误: getTasksByType("development")');
      console.log('     正确: getAllTasks().filter(task => task.type === "development")');
    }
    
    // 缺少错误处理
    const errorHandlingIssues = results.filter(r => 
      r.issues.some(i => i.includes('缺少错误处理'))
    );
    if (errorHandlingIssues.length > 0) {
      console.log('\n3. 缺少错误处理:');
      console.log('   问题: API函数缺少 try-catch 错误处理');
      console.log('   修复: 添加错误处理代码');
      console.log('   示例:');
      console.log('     export async function GET(request: NextRequest) {');
      console.log('       try {');
      console.log('         // 业务逻辑');
      console.log('         return NextResponse.json({ success: true, data: result });');
      console.log('       } catch (error) {');
      console.log('         console.error("API错误:", error);');
      console.log('         return NextResponse.json({ success: false, error: error.message }, { status: 500 });');
      console.log('       }');
      console.log('     }');
    }
  }
  
  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: apiFiles.length,
    filesWithIssues: results.filter(r => r.issues.length > 0).length,
    totalIssues,
    results: results.map(r => ({
      file: r.file,
      issues: r.issues,
      methods: r.methods,
      hasSyntaxError: r.hasSyntaxError,
    })),
  };
  
  const reportFile = '/tmp/api-syntax-report.json';
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 详细报告已保存到: ${reportFile}`);
  
  return totalIssues === 0 ? 0 : 1;
}

runAllChecks().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(colorize('检查过程中发生错误:', 'red'), error);
  process.exit(1);
});