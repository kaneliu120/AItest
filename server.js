/**
 * 简化的API服务器
 * 只提供核心的需求分析API
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 文件上传配置
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mission-control-api',
      version: '1.0.0'
    }
  });
});

// 需求分析服务状态
app.get('/api/requirements-analysis', (req, res) => {
  const action = req.query.action;
  
  if (action === 'status') {
    res.json({
      success: true,
      data: {
        service: 'requirements-analysis',
        status: 'healthy',
        version: '1.0.0',
        capabilities: ['document-parsing', 'requirement-analysis', 'tech-stack-recommendation'],
        supportedFormats: ['txt', 'md', 'html', 'docx', 'pdf', 'text']
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        message: '需求分析API',
        endpoints: {
          POST: '/api/requirements-analysis - 分析需求文档',
          GET: '/api/requirements-analysis?action=status - 获取服务状态'
        }
      }
    });
  }
});

// 需求分析端点
app.post('/api/requirements-analysis', upload.single('file'), async (req, res) => {
  try {
    const { text, generateDocs } = req.body;
    const file = req.file;
    
    if (!file && !text) {
      return res.status(400).json({
        success: false,
        error: {
          message: '请提供文件或文本内容',
          code: 'VALIDATION_ERROR'
        }
      });
    }
    
    let content = '';
    let filename = 'text-input.txt';
    
    if (file) {
      // 读取上传的文件
      content = fs.readFileSync(file.path, 'utf8');
      filename = file.originalname;
    } else {
      content = text;
    }
    
    // 模拟分析过程
    const analysis = await analyzeRequirements(content);
    
    const response = {
      success: true,
      data: {
        document: {
          id: `doc_${Date.now()}`,
          filename,
          content: content.substring(0, 500) + '...', // 只返回部分内容
          metadata: {
            size: content.length,
            wordCount: content.split(/\s+/).length,
            language: 'zh-CN'
          }
        },
        analysis
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        documentSize: content.length,
        wordCount: content.split(/\s+/).length,
        documentsGenerated: generateDocs === 'true'
      }
    };
    
    // 如果请求生成文档，添加文档数据
    if (generateDocs === 'true') {
      response.data.documents = generateDocuments(analysis);
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('需求分析错误:', error);
    res.status(500).json({
      success: false,
      error: {
        message: '需求分析失败',
        code: 'ANALYSIS_ERROR',
        details: error.message
      }
    });
  }
});

// 指标端点
app.get('/api/metrics', (req, res) => {
  const metrics = `
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 1

# HELP http_errors_total Total HTTP errors
# TYPE http_errors_total counter
http_errors_total 0

# HELP node_memory_usage_bytes Node.js memory usage in bytes
# TYPE node_memory_usage_bytes gauge
node_memory_usage_bytes ${process.memoryUsage().heapUsed}

# HELP uptime_seconds Application uptime in seconds
# TYPE uptime_seconds gauge
uptime_seconds ${process.uptime()}
`;

  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

// 模拟需求分析函数
async function analyzeRequirements(content) {
  // 简单的需求分析逻辑
  const words = content.split(/\s+/);
  const sentences = content.split(/[.!?]+/);
  
  return {
    id: `analysis_${Date.now()}`,
    categories: {
      functional: extractFunctionalRequirements(content),
      nonFunctional: extractNonFunctionalRequirements(content),
      business: extractBusinessRequirements(content)
    },
    techStack: recommendTechStack(content),
    complexity: assessComplexity(content),
    risks: identifyRisks(content),
    effortEstimation: estimateEffort(content)
  };
}

function extractFunctionalRequirements(content) {
  // 简单的功能需求提取
  const lines = content.split('\n');
  const requirements = [];
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('功能') || line.includes('1.') || line.includes('-')) {
      requirements.push({
        id: `FUNC_${index + 1}`,
        description: line.trim(),
        priority: index < 3 ? 'high' : index < 6 ? 'medium' : 'low',
        complexity: line.length > 100 ? 'complex' : line.length > 50 ? 'medium' : 'simple',
        estimatedEffort: Math.ceil(line.length / 10)
      });
    }
  });
  
  return requirements.slice(0, 10); // 最多返回10个
}

function extractNonFunctionalRequirements(content) {
  const types = ['performance', 'security', 'usability', 'reliability', 'scalability'];
  return types.map((type, index) => ({
    id: `NFR_${index + 1}`,
    type,
    description: `${type} 要求`,
    requirements: [`确保系统${type}满足业务需求`]
  }));
}

function extractBusinessRequirements(content) {
  return [{
    id: 'BUS_001',
    description: '业务核心需求',
    businessValue: 'critical',
    stakeholders: ['业务部门', '技术团队', '最终用户']
  }];
}

function recommendTechStack(content) {
  return {
    frontend: [
      {
        framework: 'React',
        recommendation: '适用于复杂交互的现代Web应用',
        pros: ['组件化', '生态系统丰富', '性能优秀'],
        cons: ['学习曲线陡峭', '配置复杂'],
        suitability: 85
      }
    ],
    backend: [
      {
        framework: 'Node.js',
        recommendation: '适用于高并发IO密集型应用',
        pros: ['JavaScript全栈', '高性能', '生态系统丰富'],
        cons: ['CPU密集型任务性能一般'],
        suitability: 90
      }
    ],
    database: [
      {
        type: 'PostgreSQL',
        recommendation: '适用于关系型数据存储',
        pros: ['ACID兼容', '功能丰富', '稳定性高'],
        cons: ['配置复杂', '需要专业维护'],
        suitability: 80
      }
    ],
    deployment: [
      {
        platform: 'Docker + Kubernetes',
        recommendation: '适用于微服务架构和云原生部署',
        pros: ['可移植性', '弹性伸缩', '易于管理'],
        cons: ['学习成本高', '配置复杂'],
        suitability: 75
      }
    ]
  };
}

function assessComplexity(content) {
  const wordCount = content.split(/\s+/).length;
  const score = Math.min(10, Math.ceil(wordCount / 100));
  
  return {
    overall: score,
    technical: { score: Math.min(10, score + 2), factors: ['技术集成', '性能要求'] },
    business: { score: Math.min(10, score + 1), factors: ['业务流程', '用户需求'] },
    integration: { score: Math.min(10, score), factors: ['系统集成', '数据迁移'] }
  };
}

function identifyRisks(content) {
  return [
    {
      id: 'RISK_001',
      description: '需求变更频繁',
      probability: 'medium',
      impact: 'high',
      mitigation: '建立变更控制流程，设置需求冻结期'
    },
    {
      id: 'RISK_002',
      description: '技术债务积累',
      probability: 'high',
      impact: 'medium',
      mitigation: '定期代码审查，保持高测试覆盖率'
    }
  ];
}

function estimateEffort(content) {
  const wordCount = content.split(/\s+/).length;
  const totalHours = Math.max(40, Math.ceil(wordCount / 10));
  
  return {
    totalHours,
    breakdown: {
      analysis: Math.ceil(totalHours * 0.1),
      design: Math.ceil(totalHours * 0.2),
      development: Math.ceil(totalHours * 0.5),
      testing: Math.ceil(totalHours * 0.15),
      deployment: Math.ceil(totalHours * 0.03),
      documentation: Math.ceil(totalHours * 0.02)
    },
    teamSize: 2,
    timeline: {
      optimistic: Math.ceil(totalHours / 8 / 2), // 2人团队，每天8小时
      realistic: Math.ceil(totalHours / 8 / 2 * 1.5),
      pessimistic: Math.ceil(totalHours / 8 / 2 * 2)
    }
  };
}

function generateDocuments(analysis) {
  return {
    srs: {
      type: 'srs',
      filename: 'software-requirements-specification.md',
      content: `# 软件需求规格说明书

## 项目概述
基于需求分析生成的技术文档。

## 功能需求
${analysis.categories.functional.map(req => `- ${req.id}: ${req.description}`).join('\n')}

## 技术架构
${Object.entries(analysis.techStack).map(([category, items]) => 
  `### ${category}\n${items.map(item => `- ${item.framework || item.type}: ${item.recommendation}`).join('\n')}`
).join('\n\n')}

## 风险评估
${analysis.risks.map(risk => `- ${risk.id}: ${risk.description} (概率: ${risk.probability}, 影响: ${risk.impact})`).join('\n')}

## 工作量估算
- 总工时: ${analysis.effortEstimation.totalHours} 小时
- 团队规模: ${analysis.effortEstimation.teamSize} 人
- 预计时间线: ${analysis.effortEstimation.timeline.realistic} 天`
    },
    tdd: {
      type: 'tdd',
      filename: 'test-driven-development.md',
      content: '# 测试驱动开发文档\n\n基于需求分析的测试用例设计。'
    }
  };
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mission Control API 服务器运行在端口 ${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🔧 API文档: http://localhost:${PORT}/api/requirements-analysis`);
});