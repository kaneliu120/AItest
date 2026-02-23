# 📡 Mission Control - API 文档

## 🎯 概述

Mission Control API 提供完整的智能需求分析和技术文档生成功能。所有API端点都遵循RESTful设计原则，返回JSON格式数据。

### 基础信息
- **基础URL**: `http://localhost:3001/api`
- **内容类型**: `application/json`
- **认证**: 当前版本无需认证（生产环境建议启用）
- **版本**: v1.0.0

### 响应格式
所有API响应都遵循以下格式：
```json
{
  "success": true,
  "data": { /* 响应数据 */ },
  "metadata": { /* 元数据 */ },
  "error": null
}
```

错误响应格式：
```json
{
  "success": false,
  "data": null,
  "metadata": null,
  "error": {
    "message": "错误描述",
    "code": "ERROR_CODE",
    "details": { /* 详细错误信息 */ }
  }
}
```

## 📋 API端点索引

### 需求分析服务
- `POST /api/requirements-analysis` - 分析需求文档
- `GET /api/requirements-analysis` - 获取服务状态和信息

### 监控指标
- `GET /api/metrics` - Prometheus格式的应用指标
- `GET /api/system-metrics` - Prometheus格式的系统指标

### 健康检查
- `GET /api/health` - 系统健康检查
- `GET /api/requirements-analysis?action=status` - 服务状态检查

## 🔧 详细端点说明

### 1. 需求分析端点

#### POST /api/requirements-analysis
分析需求文档并生成技术分析结果。

**请求参数**:
- **Content-Type**: `multipart/form-data`
- **参数**:
  - `file` (File, 可选): 上传的需求文档文件
  - `text` (String, 可选): 直接输入的文本内容
  - `generateDocs` (Boolean, 可选): 是否生成技术文档，默认 `false`

**支持的文件格式**:
- `.txt` - 纯文本文件
- `.md` - Markdown文件
- `.html` - HTML文件
- `.docx` - Word文档
- `.pdf` - PDF文档

**请求示例**:
```bash
# 使用curl上传文件
curl -X POST http://localhost:3001/api/requirements-analysis \
  -F "file=@requirements.docx" \
  -F "generateDocs=true"

# 使用curl发送文本
curl -X POST http://localhost:3001/api/requirements-analysis \
  -F "text=# 项目需求..." \
  -F "generateDocs=true"
```

**响应示例** (成功):
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_123456",
      "filename": "requirements.docx",
      "content": "文档内容...",
      "metadata": {
        "size": 10240,
        "wordCount": 1500,
        "language": "zh-CN"
      }
    },
    "analysis": {
      "id": "analysis_123456",
      "categories": {
        "functional": [
          {
            "id": "FUNC_001",
            "description": "用户注册功能",
            "priority": "high",
            "complexity": "medium",
            "estimatedEffort": 40
          }
        ],
        "nonFunctional": [],
        "business": []
      },
      "techStack": {
        "frontend": [],
        "backend": [],
        "database": [],
        "deployment": []
      },
      "complexity": {
        "overall": 7,
        "technical": { "score": 8, "factors": [] },
        "business": { "score": 6, "factors": [] },
        "integration": { "score": 5, "factors": [] }
      },
      "risks": [],
      "effortEstimation": {
        "totalHours": 160,
        "breakdown": {
          "analysis": 20,
          "design": 30,
          "development": 80,
          "testing": 20,
          "deployment": 5,
          "documentation": 5
        },
        "teamSize": 2,
        "timeline": {
          "optimistic": 20,
          "realistic": 30,
          "pessimistic": 45
        }
      },
      "dependencies": [],
      "recommendations": {
        "immediateActions": [],
        "technicalDecisions": [],
        "riskMitigations": [],
        "successFactors": []
      }
    },
    "documents": {
      "srs": {
        "type": "srs",
        "filename": "software-requirements-specification.md",
        "content": "# 软件需求规格说明书..."
      },
      "tdd": {
        "type": "tdd",
        "filename": "test-driven-development.md",
        "content": "# 测试驱动开发文档..."
      },
      "projectPlan": {
        "type": "project-plan",
        "filename": "project-plan.md",
        "content": "# 项目计划..."
      },
      "deployment": {
        "type": "deployment",
        "filename": "deployment-guide.md",
        "content": "# 部署指南..."
      }
    }
  },
  "metadata": {
    "analyzedAt": "2026-02-23T08:30:00Z",
    "documentSize": 10240,
    "wordCount": 1500,
    "documentsGenerated": true
  },
  "error": null
}
```

**响应示例** (错误):
```json
{
  "success": false,
  "data": null,
  "metadata": null,
  "error": {
    "message": "请提供文件或文本内容",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "file/text",
      "constraint": "至少提供一个"
    }
  }
}
```

**状态码**:
- `200`: 分析成功
- `400`: 请求参数错误
- `413`: 文件太大
- `415`: 不支持的文档格式
- `500`: 服务器内部错误

#### GET /api/requirements-analysis
获取服务状态和信息。

**查询参数**:
- `action` (String, 可选): 
  - `status`: 获取服务状态（默认）
  - 不提供参数: 获取API信息

**请求示例**:
```bash
# 获取服务状态
curl "http://localhost:3001/api/requirements-analysis?action=status"

# 获取API信息
curl "http://localhost:3001/api/requirements-analysis"
```

**响应示例** (状态):
```json
{
  "success": true,
  "data": {
    "service": "requirements-analysis",
    "status": "healthy",
    "version": "1.0.0",
    "capabilities": [
      "document-parsing",
      "requirement-analysis",
      "tech-stack-recommendation",
      "ai-enhanced-analysis",
      "document-generation"
    ],
    "supportedFormats": [
      "txt",
      "md",
      "html",
      "docx",
      "pdf",
      "text"
    ]
  },
  "metadata": {
    "checkedAt": "2026-02-23T08:30:00Z"
  },
  "error": null
}
```

**响应示例** (API信息):
```json
{
  "success": true,
  "data": {
    "message": "需求分析API",
    "endpoints": {
      "POST": "/api/requirements-analysis - 分析需求文档",
      "GET": "/api/requirements-analysis?action=status - 获取服务状态"
    },
    "usage": "上传文件或提供文本内容进行需求分析"
  },
  "metadata": null,
  "error": null
}
```

### 2. 监控指标端点

#### GET /api/metrics
返回Prometheus格式的应用性能指标。

**请求示例**:
```bash
curl "http://localhost:3001/api/metrics"
```

**响应格式** (Prometheus文本格式):
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 150

# HELP http_errors_total Total HTTP errors
# TYPE http_errors_total counter
http_errors_total 3

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_sum 45.2
http_request_duration_seconds_count 150
http_request_duration_seconds_bucket{le="0.1"} 120
http_request_duration_seconds_bucket{le="0.5"} 145
http_request_duration_seconds_bucket{le="1"} 150
http_request_duration_seconds_bucket{le="5"} 150
http_request_duration_seconds_bucket{le="+Inf"} 150

# HELP node_memory_usage_bytes Node.js memory usage in bytes
# TYPE node_memory_usage_bytes gauge
node_memory_usage_bytes 125829120

# HELP node_cpu_usage_seconds Node.js CPU usage in seconds
# TYPE node_cpu_usage_seconds gauge
node_cpu_usage_seconds 45.2

# HELP uptime_seconds Application uptime in seconds
# TYPE uptime_seconds gauge
uptime_seconds 3600
```

**指标说明**:
- `http_requests_total`: 总HTTP请求数
- `http_errors_total`: 总HTTP错误数
- `http_request_duration_seconds`: HTTP请求耗时直方图
- `node_memory_usage_bytes`: Node.js内存使用量
- `node_cpu_usage_seconds`: Node.js CPU使用时间
- `uptime_seconds`: 应用运行时间

#### GET /api/system-metrics
返回Prometheus格式的系统指标。

**请求示例**:
```bash
curl "http://localhost:3001/api/system-metrics"
```

**响应格式** (Prometheus文本格式):
```
# HELP node_memory_MemTotal_bytes Total memory in bytes
# TYPE node_memory_MemTotal_bytes gauge
node_memory_MemTotal_bytes 17179869184

# HELP node_memory_MemFree_bytes Free memory in bytes
# TYPE node_memory_MemFree_bytes gauge
node_memory_MemFree_bytes 8589934592

# HELP node_memory_MemAvailable_bytes Available memory in bytes
# TYPE node_memory_MemAvailable_bytes gauge
node_memory_MemAvailable_bytes 10307921510

# HELP node_memory_MemUsed_bytes Used memory in bytes
# TYPE node_memory_MemUsed_bytes gauge
node_memory_MemUsed_bytes 8589934592

# HELP node_memory_MemUsage_percent Memory usage percentage
# TYPE node_memory_MemUsage_percent gauge
node_memory_MemUsage_percent 50.0

# HELP node_cpu_seconds_total Total CPU time in seconds
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total 120.5

# HELP node_cpu_usage_percent CPU usage percentage
# TYPE node_cpu_usage_percent gauge
node_cpu_usage_percent 25.5

# HELP node_load1 1-minute load average
# TYPE node_load1 gauge
node_load1 0.75

# HELP node_load5 5-minute load average
# TYPE node_load5 gauge
node_load5 0.68

# HELP node_load15 15-minute load average
# TYPE node_load15 gauge
node_load15 0.62

# HELP node_uptime_seconds System uptime in seconds
# TYPE node_uptime_seconds gauge
node_uptime_seconds 86400

# HELP node_process_uptime_seconds Process uptime in seconds
# TYPE node_process_uptime_seconds gauge
node_process_uptime_seconds 3600

# HELP node_network_interfaces Number of network interfaces
# TYPE node_network_interfaces gauge
node_network_interfaces 4
```

### 3. 健康检查端点

#### GET /api/health
系统健康检查端点。

**请求示例**:
```bash
curl "http://localhost:3001/api/health"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-23T08:30:00Z",
    "services": {
      "api": "healthy",
      "database": "healthy",
      "cache": "healthy",
      "fileSystem": "healthy"
    },
    "metrics": {
      "uptime": 3600,
      "memoryUsage": "125MB",
      "cpuUsage": "25%",
      "activeConnections": 5
    }
  },
  "metadata": {
    "version": "1.0.0",
    "environment": "production"
  },
  "error": null
}
```

## 🔒 安全考虑

### 1. 输入验证
所有API端点都进行严格的输入验证：
- 文件类型和大小限制
- 文本内容长度限制
- 参数类型和格式验证

### 2. 错误处理
- 详细的错误信息和错误码
- 适当的HTTP状态码
- 不泄露敏感信息的错误消息

### 3. 性能考虑
- 请求超时设置
- 文件大小限制
- 响应压缩
- 缓存策略

### 4. 生产环境建议
```bash
# 启用HTTPS
NODE_ENV=production
ENABLE_HTTPS=true

# 启用认证
ENABLE_AUTHENTICATION=true
JWT_SECRET=your_secure_secret

# 启用速率限制
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

## 🧪 测试示例

### 使用Python测试
```python
import requests

# 测试服务状态
response = requests.get("http://localhost:3001/api/requirements-analysis?action=status")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# 测试文本分析
data = {
    "text": "# 电商平台需求\n\n## 核心功能\n1. 用户注册和登录\n2. 商品浏览和搜索\n3. 购物车和订单管理",
    "generateDocs": "true"
}

files = {}
response = requests.post("http://localhost:3001/api/requirements-analysis", data=data, files=files)
print(f"Analysis Status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"Analysis ID: {result['data']['analysis']['id']}")
    print(f"Estimated Hours: {result['data']['analysis']['effortEstimation']['totalHours']}")
```

### 使用JavaScript测试
```javascript
// 测试服务状态
fetch('http://localhost:3001/api/requirements-analysis?action=status')
  .then(response => response.json())
  .then(data => console.log('Service Status:', data.data.status));

// 测试文本分析
const formData = new FormData();
formData.append('text', '# 项目需求...');
formData.append('generateDocs', 'true');

fetch('http://localhost:3001/api/requirements-analysis', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Analysis completed:', data.data.analysis.id);
  } else {
    console.error('Analysis failed:', data.error.message);
  }
});
```

## 📊 性能指标

### 预期性能
| 指标 | 目标值 | 说明 |
|------|--------|------|
| 响应时间 | < 100ms (P95) | API响应时间 |
| 吞吐量 | > 100 req/s | 每秒请求数 |
| 可用性 | > 99.9% | 服务可用性 |
| 错误率 | < 1% | HTTP错误率 |

### 监控指标
1. **应用指标**:
   - 请求计数和错误计数
   - 响应时间分布
   - 内存和CPU使用率
   - 垃圾回收统计

2. **业务指标**:
   - 文档分析成功率
   - 平均分析时间
   - 文档生成成功率
   - 用户满意度

## 🚨 故障排除

### 常见问题
1. **API返回400错误**
   - 检查请求参数格式
   - 验证文件类型和大小
   - 检查必填参数

2. **API返回500错误**
   - 查看服务器日志
   - 检查依赖服务状态
   - 验证系统资源

3. **性能问题**
   - 检查系统资源使用情况
   - 优化数据库查询
   - 启用缓存功能

4. **监控指标缺失**
   - 验证Prometheus配置
   - 检查指标端点可访问性
   - 查看应用日志

### 调试工具
```bash
# 查看API日志
tail -f ./logs/app.log | grep "API"

# 测试端点连通性
curl -v "http://localhost:3001/api/health"

# 检查性能指标
curl "http://localhost:3001/api/metrics" | grep -E "(http_requests_total|http_request_duration_seconds)"

# 监控实时请求
watch -n 1 'curl -s "http://localhost:3001/api/requirements-analysis?action=status" | jq .data.status'
```

## 🔮 未来扩展

### 计划中的API端点
1. **用户管理API**
   - 用户注册和登录
   - 权限管理
   - 个人设置

2. **项目管理API**
   - 项目创建和管理
   - 团队协作
   - 版本控制

3. **高级分析API**
   - 自定义分析模板
   - 批量处理
   - 历史数据分析

4. **集成API**
   - GitHub集成
   - Jira集成
   - Slack集成

### API版本管理
- 当前版本: v1.0.0
- 版本前缀: `/api/v1/`
- 向后兼容性保证

---

**文档版本**: 1.0