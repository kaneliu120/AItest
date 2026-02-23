  tokenSavings: number;
  actualTime: number;
  timeSavings: number;
  qualityScore: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
`;
    
    // 在文件开头添加类型定义
    const newContent = typeDefinitions + '\n' + content;
    return {
      fixed: true,
      content: newContent,
      description: '添加TypeScript类型定义'
    };
  }
  
  return { fixed: false, content, description: '无法修复类型安全' };
}

// 修复响应式设计
function fixResponsiveDesign(content, fileName, fileType, issue) {
  if (fileType === 'ui-page') {
    // 添加响应式CSS类
    const responsiveClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    // 查找容器div并添加响应式类
    const containerMatch = content.match(/<div className="[^"]*">/);
    if (containerMatch) {
      const newContainer = containerMatch[0].replace(/className="([^"]*)"/, `className="$1 ${responsiveClasses}"`);
      const newContent = content.replace(containerMatch[0], newContainer);
      return {
        fixed: true,
        content: newContent,
        description: '添加响应式网格布局'
      };
    }
  }
  
  return { fixed: false, content, description: '无法修复响应式设计' };
}

// 修复状态管理
function fixStateManagement(content, fileName, fileType, issue) {
  if (fileType === 'ui-page') {
    // 添加useState和useEffect导入
    if (!content.includes('useState') || !content.includes('useEffect')) {
      const importMatch = content.match(/import \{ [^}]* \} from ['"]react['"]/);
      if (importMatch) {
        const newImport = importMatch[0].replace('{ ', '{ useState, useEffect, ');
        const newContent = content.replace(importMatch[0], newImport);
        return {
          fixed: true,
          content: newContent,
          description: '添加React状态钩子导入'
        };
      }
    }
  }
  
  return { fixed: false, content, description: '无法修复状态管理' };
}

// 修复进度日志
function fixProgressLogging(content, fileName, fileType, issue) {
  if (fileType === 'workflow-script') {
    // 添加进度日志函数
    const loggingFunctions = `
// 进度日志函数
function logProgress(message, type = 'info') {
  const timestamp = new Date().toLocaleString('zh-CN');
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(\`\${prefix} [\${timestamp}] \${message}\`);
}

function logSection(title) {
  console.log(\`\\n\${'='.repeat(60)}\`);
  console.log(\`\${title}\`);
  console.log(\`\${'='.repeat(60)}\`);
}
`;
    
    // 在文件开头添加日志函数
    const newContent = loggingFunctions + '\n' + content;
    
    // 替换现有的console.log调用
    const updatedContent = newContent
      .replace(/console\.log\('✅/g, "logProgress('")
      .replace(/console\.log\('❌/g, "logProgress('")
      .replace(/console\.log\('⚠️/g, "logProgress('")
      .replace(/console\.log\('ℹ️/g, "logProgress('");
    
    return {
      fixed:      fixed: true,
      content: updatedContent,
      description: '添加结构化进度日志系统'
    };
  }
  
  return { fixed: false, content, description: '无法修复进度日志' };
}

// 应用修复
function applyFix(content, filePath, issue) {
  const fileName = path.basename(filePath);
  const fileType = PHASE5_FILES.find(f => f.path === filePath)?.type;
  
  switch (issue.type) {
    case 'missing-section':
      return fixMissingSection(content, fileName, fileType, issue);
    case 'missing-metric':
      return fixMissingMetric(content, fileName, fileType, issue);
    case 'missing-strategy':
      return fixMissingStrategy(content, fileName, fileType, issue);
    case 'missing-endpoint':
      return fixMissingEndpoint(content, fileName, fileType, issue);
    case 'missing-error-handling':
      return fixMissingErrorHandling(content, fileName, fileType, issue);
    case 'missing-component':
      return fixMissingComponent(content, fileName, fileType, issue);
    case 'missing-feature':
      return fixMissingFeature(content, fileName, fileType, issue);
    case 'missing-function':
      return fixMissingFunction(content, fileName, fileType, issue);
    case 'todo-fixme':
      return fixTodoFixme(content, fileName, fileType, issue);
    case 'console-log':
      return fixConsoleLog(content, fileName, fileType, issue);
    case 'error-handling':
      return fixErrorHandling(content, fileName, fileType, issue);
    case 'type-safety':
      return fixTypeSafety(content, fileName, fileType, issue);
    case 'responsive-design':
      return fixResponsiveDesign(content, fileName, fileType, issue);
    case 'state-management':
      return fixStateManagement(content, fileName, fileType, issue);
    case 'progress-logging':
      return fixProgressLogging(content, fileName, fileType, issue);
    default:
      return { fixed: false, content, description: '未知问题类型，无法自动修复' };
  }
}

// 修复缺失组件（占位函数）
function fixMissingComponent(content, fileName, fileType, issue) {
  return { fixed: false, content, description: 'UI组件修复需要手动实现' };
}

// 修复缺失功能（占位函数）
function fixMissingFeature(content, fileName, fileType, issue) {
  return { fixed: false, content, description: '功能修复需要手动实现' };
}

// 修复缺失函数（占位函数）
function fixMissingFunction(content, fileName, fileType, issue) {
  return { fixed: false, content, description: '函数修复需要手动实现' };
}

module.exports = {
  analyzeCodeFile,
  reviewCodeWithAutomationEfficiency,
  generateCodeReviewReport,
  autoFixCodeIssues
};