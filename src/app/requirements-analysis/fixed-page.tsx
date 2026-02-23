'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Code, AlertCircle, CheckCircle, Clock, Users, BarChart, FileCode, Download, Copy, Save } from 'lucide-react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

interface AnalysisResult {
  document: any;
  analysis: any;
  metadata: any;
  documents?: any;
}

const RequirementsAnalysisPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('text');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // 配置marked
  marked.setOptions({
    highlight: function(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploadedFile(file);
    
    // 如果是文本文件，读取内容
    if (file.type.startsWith('text/') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTextInput(content);
        setActiveTab('text');
      };
      reader.readAsText(file);
    }
    
    await analyzeFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const analyzeFile = async (file: File, generateDocs = false) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (generateDocs) {
        formData.append('generateDocs', 'true');
      }
      
      const response = await fetch('/api/requirements-analysis', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }
      
      setAnalysisResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeText = async (generateDocs = false) => {
    if (!textInput.trim()) {
      setError('请输入文本内容');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('text', textInput);
      if (generateDocs) {
        formData.append('generateDocs', 'true');
      }
      
      const response = await fetch('/api/requirements-analysis', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '分析失败');
      }
      
      setAnalysisResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadDocument = (doc: any, format: 'markdown' | 'text') => {
    const content = format === 'markdown' ? doc.content : doc.content.replace(/#+\s+/g, '').replace(/`{3}[\s\S]*?`{3}/g, '');
    const blob = new Blob([content], { type: format === 'markdown' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.type}-${doc.id}.${format === 'markdown' ? 'md' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    });
  };

  const loadExample = () => {
    const example = `# 电商平台项目需求文档

## 项目概述
构建一个完整的B2C电商平台，支持商品销售、用户管理、订单处理和支付集成。

## 核心功能模块

### 1. 用户系统
- **用户注册和登录**
  - 邮箱/手机号注册
  - 第三方登录（微信、Google）
  - 忘记密码功能
  - 两步验证（可选）

- **个人资料管理**
  - 头像上传
  - 基本信息编辑
  - 地址簿管理
  - 偏好设置

### 2. 商品系统
- **商品展示**
  - 商品分类浏览
  - 高级搜索功能
  - 商品详情页
  - 图片轮播展示

- **库存管理**
  - 库存实时更新
  - 库存预警
  - 商品上下架管理

### 3. 购物车和订单
- **购物车功能**
  - 添加/删除商品
  - 数量修改
  - 价格实时计算

- **订单处理**
  - 订单创建
  - 订单状态跟踪
  - 订单历史查看
  - 退款退货流程

### 4. 支付系统
- **支付方式**
  - 支付宝支付
  - 微信支付
  - 银行卡支付
  - 货到付款

- **支付安全**
  - SSL加密
  - 支付密码验证
  - 交易记录保存

## 非功能需求

### 性能要求
- 页面加载时间 < 2秒
- 支持5000并发用户
- 99.9%可用性
- 数据库响应时间 < 100ms

### 安全要求
- 用户数据加密存储
- 防止SQL注入
- XSS攻击防护
- 定期安全审计

### 兼容性要求
- 支持主流浏览器（Chrome, Firefox, Safari, Edge）
- 移动端优先设计
- 响应式布局

## 技术约束
- 使用现代Web技术栈
- 支持云部署（AWS/Aliyun）
- 易于扩展和维护
- 良好的开发体验

## 项目里程碑
1. **第一阶段**（2周）：用户系统和商品系统
2. **第二阶段**（3周）：购物车和订单系统
3. **第三阶段**（2周）：支付系统集成
4. **第四阶段**（1周）：测试和部署

## 预算估算
- 开发成本：¥150,000
- 运维成本：¥5,000/月
- 预计上线时间：8周`;
    
    setTextInput(example);
    setActiveTab('text');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">智能需求分析系统</h1>
          <p className="text-slate-600 mt-2">
            上传需求文档或输入Markdown格式文本，自动分析需求、推荐技术栈、评估风险和估算工作量
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：输入区域 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 标签页切换 */}
            <div className="flex border-b border-slate-200">
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload className="inline-block w-4 h-4 mr-2" />
                文件上传
              </button>
              <button
                className={`flex-1 py-3 px-4 text-center font-medium ${
                  activeTab === 'text'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setActiveTab('text')}
              >
                <FileText className="inline-block w-4 h-4 mr-2" />
                Markdown编辑
              </button>
            </div>

            {/* 文件上传区域 */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-700 font-medium mb-2">
                    {isDragActive ? '释放文件以上传' : '拖放文件到这里，或点击选择文件'}
                  </p>
                  <p className="text-sm text-slate-500">
                    支持格式: TXT, MD, HTML, DOCX, PDF
                  </p>
                  <p className="text-xs text-slate-400 mt-2">最大文件大小: 100MB</p>
                </div>
                
                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-500 mr-2" />
                      <span className="font-medium text-green-800">已上传文件</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1 truncate">
                      {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Markdown编辑区域 */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                {/* 编辑/预览切换 */}
                <div className="flex border-b border-slate-200">
                  <button
                    className={`flex-1 py-2 text-center text-sm font-medium ${
                      previewMode === 'edit'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setPreviewMode('edit')}
                  >
                    编辑
                  </button>
                  <button
                    className={`flex-1 py-2 text-center text-sm font-medium ${
                      previewMode === 'preview'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setPreviewMode('preview')}
                  >
                    预览
                  </button>
                </div>

                {/* 编辑区域 */}
                {previewMode === 'edit' && (
                  <div className="space-y-3">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="# 输入您的项目需求（Markdown格式）

## 项目概述
描述您的项目目标和范围...

## 功能需求
1. 功能点1
2. 功能点2
3. 功能点3

## 技术要求
- 性能要求
- 安全要求
- 兼容性要求"
                      className="w-full h-64 p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                      rows={10}
                    />
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={loadExample}
                        className="flex-1 py-2 px-3 text-sm border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        加载示例
                      </button>
                      <button
                        onClick={() => copyToClipboard(textInput)}
                        className="flex-1 py-2 px-3 text-sm border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        复制文本
                      </button>
                    </div>
                  </div>
                )}

                {/* 预览区域 */}
                {previewMode === 'preview' && (
                  <div className="h-64 overflow-y-auto p-4 border border-slate-300 rounded-2xl bg-white">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: marked(textInput || '*无内容*') }}
                    />
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="space-y-3">
                  <button
                    onClick={() => analyzeText()}
                    disabled={isAnalyzing || !textInput.trim()}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        分析中...
                      </>
                    ) : (
                      <>
                        <FileCode className="w-4 h-4 mr-2" />
                        分析需求
                      </>
                    )}
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => analyzeText(true)}
                      disabled={isAnalyzing || !textInput.trim()}
                      className="py-2 px-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      分析并生成文档
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([textInput], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'requirements.md';
                        a.click();
                      }}
                      disabled={!textInput.trim()}
                      className="py-2 px-3 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      下载MD文件
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">错误</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* 服务状态 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-medium text-slate-900 mb-4">服务状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">文档解析</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    正常
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">需求分析</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-