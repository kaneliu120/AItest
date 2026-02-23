#!/usr/bin/env node

/**
 * 修复JSX语法错误
 */

const fs = require('fs');
const path = require('path');

async function fixJSXErrors() {
  console.log('🔧 修复JSX语法错误...\n');
  
  const filesToFix = [
    '/src/app/requirements-analysis/page.tsx',
    '/src/components/requirements-analysis/visual-dashboard.tsx',
  ];

  for (const file of filesToFix) {
    await fixFileJSX(file);
  }
}

async function fixFileJSX(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }

  console.log(`📄 修复文件: ${filePath}`);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // 修复 export default const 语法
    if (content.includes('export default const')) {
      content = content.replace(
        /export default const (\w+) = \(\) => {/g,
        'const $1 = () => {'
      );
      
      // 确保文件末尾有正确的导出
      if (!content.includes('export default')) {
        const componentName = content.match(/const (\w+) = \(\) => {/)?.[1];
        if (componentName) {
          content += `\n\nexport default ${componentName};\n`;
        }
      }
      modified = true;
    }

    // 修复未闭合的JSX标签（简单修复）
    const lines = content.split('\n');
    const tagStack = [];
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 检查自闭合标签
      line = line.replace(/<(\w+)([^>]*)\s*>\s*<\/\1>/g, '<$1$2 />');
      
      // 检查未闭合的div标签（简单修复）
      if (line.includes('<div') && !line.includes('</div>') && !line.includes('/>')) {
        const nextLine = lines[i + 1] || '';
        if (!nextLine.includes('</div>')) {
          // 尝试找到匹配的闭合标签
          let j = i + 1;
          let found = false;
          while (j < Math.min(i + 20, lines.length)) {
            if (lines[j].includes('</div>')) {
              found = true;
              break;
            }
            j++;
          }
          
          if (!found) {
            console.log(`   ⚠️  第${i + 1}行: 可能缺少闭合的div标签`);
          }
        }
      }
      
      fixedLines.push(line);
    }
    
    if (lines.join('\n') !== fixedLines.join('\n')) {
      content = fixedLines.join('\n');
      modified = true;
    }

    if (modified) {
      // 备份原文件
      const backupPath = fullPath + '.backup';
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
fixJSXErrors().catch(console.error);