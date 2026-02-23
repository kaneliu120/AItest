# Mission Control API 文档

## 概述
Mission Control 提供完整的 RESTful API，用于管理系统状态、工具监控、工作流管理和性能监控。

**基础URL**: `http://localhost:3001/api`

**响应格式**: 所有API返回JSON格式，包含以下字段：
```json
{
  "success": boolean,
  "data": any,
  "error": string, // 仅当success=false时存在
  "timestamp": string // ISO格式时间戳
}
```

## 认证
当前版本API无需认证，但生产环境建议配置API密钥。

## API端点

### 1. 生态系统状态 API

#### GET `/api/ecosystem/status`
获取生态系统整体状态。

**查询参数**:
- `format` (可选): `json` (默认) 或 `html`

**响应示例**:
```json
{
  "success": true,
  "timestamp": "2026-02-23T02:00:10.621Z",
  "data": {
    "monitoring": {
      "totalTools": 20,
      "healthyTools": 17,
      "warningTools": 2,
      "errorTools": 1,
      "lastUpdate": "2026-02-23T02:00:10.621Z",
      "recentAlerts": [...]
    },
    "scheduler": {
      "pending": 3,
      "running": 2,
      "completed": 15,
      "success": 14,
      "failed": 1,
      "total": 20,
      "health": 70,
      "lastUpdate": "2026-02-23T02:00:10.621Z"
    },
    "tools": [...],
    "summary": {
      "totalTools": 20,
      "healthyTools": 17,
      "warningTools": 2,
      "errorTools": 1,
      "connectionRate": 85,
      "lastUpdate": "2026-02-23T02:00:10.621Z"
    }
  }
}
```

#### GET `/api/ecosystem/tools`
获取工具列表，支持过滤。

**查询参数**:
- `id` (可选): 工具ID（模糊匹配名称）
- `category` (可选): 工具类型过滤
- `status` (可选): 状态过滤 (`healthy`|`warning`|`error`)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Mission Control",
      "status": "healthy",
      "type": "dashboard",
      "version": "2.0.0",
      "lastChecked": "2026-02-23T02:00:10.621Z",
      "details": "主控制系统 - 统一管理所有子系统"
    }
  ],
  "total": 1,
  "timestamp": "2026-02-23T02:00:10.621Z"
}
```

#### POST `/api/ecosystem/tools`
管理工具（添加、更新状态）。

**请求体**:
```json
{
  "action": "add" | "update-status",
  "tool": { /* 工具信息 */ }, // action=add时必需
  "toolId": "string", // action=update-status时必需
  "status": "healthy" | "warning" | "error" // action=update-status时必需
}
```

### 2. 工作流管理 API

#### GET `/api/workflows`
获取工作流列表或状态。

**查询参数**:
- `action` (可选): `list` (默认) 或 `status`
- `status` (可选): 当action=status时，`all` (默认) 或 `running`

**响应示例** (action=list):
```json
{
  "success": true,
  "data": {
    "workflows": [...],
    "total": 4,
    "predefined": 4
  },
  "timestamp": "2026-02-23T02:00:10.621Z"
}
```

#### POST `/api/workflows`
管理工作流。

**请求体**:
```json
{
  "action": "start" | "stop" | "register",
  "workflowId": "string", // action=start时必需
  "instanceId": "string", // action=stop时必需
  "workflow": { /* 工作流定义 */ }, // action=register时必需
  "parameters": {} // action=start时的可选参数
}
```

### 3. 性能监控 API

#### GET `/api/monitoring`
获取性能监控数据。

**查询参数**:
- `action` (可选): `stats` (默认), `alerts`, `metrics`, `endpoint`
- `includeResolved` (可选): `true`|`false` (仅action=alerts时)
- `limit` (可选): 数字 (仅action=metrics时，默认100)
- `endpoint` (必需): API端点路径 (仅action=endpoint时)
- `method` (可选): HTTP方法 (仅action=endpoint时，默认GET)

**响应示例** (action=stats):
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "successfulRequests": 145,
    "failedRequests": 5,
    "averageResponseTime": 45.2,
    "p95ResponseTime": 120.5,
    "p99ResponseTime": 250.8,
    "endpoints": {
      "GET /api/ecosystem/status": {
        "total": 50,
        "success": 50,
        "failure": 0,
        "avgResponseTime": 32.1,
        "lastCalled": "2026-02-23T02:00:10.621Z"
      }
    },
    "hourlyTraffic": {...},
    "dailyTraffic": {...}
  },
  "timestamp": "2026-02-23T02:00:10.621Z"
}
```

#### POST `/api/monitoring`
管理性能监控。

**请求体**:
```json
{
  "action": "resolve-alert" | "clear-metrics" | "record-metric",
  "alertId": "string", // action=resolve-alert时必需
  "metric": { /* 指标数据 */ } // action=record-metric时必需
}
```

### 4. 健康检查 API

#### GET `/api/health`
系统健康检查。

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-23T02:00:10.621Z",
    "services": {
      "database": "connected",
      "cache": "connected",
      "api": "running"
    },
    "uptime": "5d 3h 12m",
    "version": "2.0.0"
  },
  "timestamp": "2026-02-23T02:00:10.621Z"
}
```

## 错误处理

### 错误代码
- `400`: 请求参数错误
- `404`: 资源未找到
- `500`: 服务器内部错误

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "timestamp": "2026-02-23T02:00:10.621Z"
}
```

## 使用示例

### JavaScript/TypeScript
```javascript
// 获取生态系统状态
const response = await fetch('http://localhost:3001/api/ecosystem/status');
const data = await response.json();

if (data.success) {
  console.log('连接率:', data.data.summary.connectionRate);
  console.log('健康工具:', data.data.monitoring.healthyTools);
}

// 获取特定状态的工具
const toolsResponse = await fetch('http://localhost:3001/api/ecosystem/tools?status=healthy');
const toolsData = await toolsResponse.json();

// 启动工作流
const workflowResponse = await fetch('http://localhost:3001/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'start',
    workflowId: 'evening-proactive'
  })
});
```

### cURL
```bash
# 获取生态系统状态
curl "http://localhost:3001/api/ecosystem/status?format=json"

# 获取健康工具
curl "http://localhost:3001/api/ecosystem/tools?status=healthy"

# 获取性能统计
curl "http://localhost:3001/api/monitoring?action=stats"
```

## 速率限制
当前版本无速率限制，但生产环境建议配置：
- 每个IP: 100请求/分钟
- 每个API密钥: 1000请求/分钟

## 版本控制
API版本通过URL路径控制：
- 当前版本: `/api/*`
- 未来版本: `/api/v2/*`

## 更新日志

### v2.0.0 (2026-02-23)
- 新增生态系统状态API
- 新增工作流管理API
- 新增性能监控API
- 统一响应格式
- 完整的错误处理

## 支持
如有问题或建议，请联系系统管理员。

---
**最后更新**: 2026-02-23  
**API版本**: 2.0.0  
**状态**: 生产就绪 ✅