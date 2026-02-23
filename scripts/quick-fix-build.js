#!/usr/bin/env node

/**
 * 快速修复构建错误
 */

const fs = require('fs');
const path = require('path');

async function fixBuildErrors() {
  console.log('🔧 快速修复构建错误...\n');
  
  const filesToFix = [
    '/src/app/requirements-analysis/page.tsx',
    '/src/app/unified-monitoring/page.tsx',
    '/src/components/integration/business-integration-dashboard.tsx',
  ];

  for (const file of filesToFix) {
    await fixFile(file);
  }
}

async function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }

  console.log(`📄 修复文件: ${filePath}`);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // 修复未闭合的JSX标签
    if (filePath.includes('requirements-analysis/page.tsx')) {
      // 检查文件是否被截断
      if (!content.includes('export default')) {
        // 添加缺失的闭合标签和导出
        const lines = content.split('\n');
        const lastLine = lines[lines.length - 1];
        
        if (!lastLine.trim().endsWith('}')) {
          // 添加闭合的大括号
          content += '\n};\n\nexport default RequirementsAnalysisPage;\n';
          modified = true;
          console.log('   添加缺失的闭合标签和导出');
        }
      }
    }

    // 修复注释问题
    if (filePath.includes('unified-monitoring/page.tsx')) {
      // 修复未闭合的注释
      content = content.replace(/\{\/\*([^*]|\*[^/])*$/g, (match) => {
        if (!match.includes('*/')) {
          return match + ' */';
        }
        return match;
      });
      modified = true;
      console.log('   修复未闭合的注释');
    }

    // 修复h3className问题
    if (filePath.includes('business-integration-dashboard.tsx')) {
      content = content.replace(/<h3className/g, '<h3 className');
      modified = true;
      console.log('   修复h3className语法错误');
    }

    if (modified) {
      // 备份原文件
      const backupPath = fullPath + '.backup-' + Date.now();
      fs.copyFileSync(fullPath, backupPath);
      
      fs.writeFileSync(fullPath, content);
      console.log(`   ✅ 修复完成 (备份: ${backupPath})`);
    } else {
      console.log(`   ✅ 无需修复`);
    }
    
  } catch (error) {
    console.log(`   ❌ 修复失败:`, error.message);
  }
}

// 运行修复
fixBuildErrors().catch(console.error);