# Mission Control 开发者指南

## 项目概述
Mission Control 是一个现代化的工具生态系统管理平台，基于 Next.js 15 + TypeScript + Tailwind CSS 构建。

## 技术栈
- **前端框架**: Next.js 15 (App Router)
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 3.4 + shadcn/ui
- **状态管理**: React Hooks (useState, useEffect)
- **API**: Next.js API Routes
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **部署**: Vercel / Docker

## 项目结构
```
mission-control/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── ecosystem/     # 生态系统API
│   │   │   ├── workflows/     # 工作流API
│   │   │   ├── monitoring/    # 监控API
│   │   │   └── health/        # 健康检查API
│   │   ├── ecosystem/         # 生态系统页面
│   │   ├── health/            # 健康监控页面
│   │   ├── skill-evaluator/   # 技能评估页面
│   │   └── layout.tsx         # 根布局
│   ├── components/            # React组件
│   │   ├── ui/               # shadcn/ui组件
│   │   ├── layout/           # 布局组件
│   │   └── dashboard/        # 仪表板组件
│   └── lib/                  # 工具函数和服务
│       ├── ecosystem-service.ts      # 生态系统服务
│       ├── workflow-coordinator.ts   # 工作流协调器
│       ├── api-monitoring-service.ts # API监控服务
│       └── types/            # TypeScript类型定义
├── public/                   # 静态资源
├── docs/                    # 文档
├── tailwind.config.ts       # Tailwind配置
├── next.config.js          # Next.js配置
└── package.json            # 依赖管理
```

## 开发环境设置

### 1. 环境要求
- Node.js 18+ 
- npm 9+ 或 yarn 1.22+
- Git

### 2. 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd mission-control

# 安装依赖
npm install
# 或
yarn install
```

### 3. 环境变量
创建 `.env.local` 文件：
```env
# 应用配置
NEXT_PUBLIC_APP_NAME=Mission Control
NEXT_PUBLIC_APP_VERSION=2.0.0

# API配置
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# 数据库配置 (可选)
DATABASE_URL=file:./dev.db
```

### 4. 启动开发服务器
```bash
# 开发模式
npm run dev
# 访问 http://localhost:3001

# 生产构建
npm run build
npm run start

# 代码检查
npm run lint
npm run type-check
```

## 开发工作流

### 1. 创建新页面
```bash
# 创建页面目录和文件
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
touch src/app/new-page/layout.tsx
```

页面模板 (`page.tsx`):
```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>新页面标题</CardTitle>
        </CardHeader>
        <CardContent>
          <p>页面内容...</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. 创建新API端点
```bash
# 创建API路由
mkdir -p src/app/api/new-endpoint
touch src/app/api/new-endpoint/route.ts
```

API模板 (`route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = {
      message: 'API端点工作正常',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

### 3. 创建新服务
```bash
# 创建服务文件
touch src/lib/new-service.ts
```

服务模板:
```typescript
export interface NewServiceData {
  id: string;
  name: string;
  createdAt: string;
}

class NewService {
  private data: NewServiceData[] = [];

  // 获取所有数据
  getAll(): NewServiceData[] {
    return this.data;
  }

  // 添加数据
  add(item: Omit<NewServiceData, 'id' | 'createdAt'>): NewServiceData {
    const newItem: NewServiceData = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    this.data.push(newItem);
    return newItem;
  }

  // 删除数据
  remove(id: string): boolean {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    return this.data.length < initialLength;
  }
}

// 导出单例实例
export const newService = new NewService();
```

## 代码规范

### 1. TypeScript规范
- 使用严格模式 (`strict: true`)
- 为所有函数和变量添加类型注解
- 避免使用 `any` 类型
- 使用接口定义数据结构

### 2. React规范
- 使用函数组件和Hooks
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名
- 一个文件一个主要组件

### 3. 样式规范
- 使用 Tailwind CSS 类
- 避免内联样式
- 自定义样式放在 `src/styles/` 目录
- 使用 CSS 变量定义主题

### 4. API规范
- 所有API返回统一格式
- 使用HTTP状态码
- 添加错误处理
- 记录API调用指标

## 测试

### 1. 单元测试
```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

测试示例 (`__tests__/example.test.ts`):
```typescript
import { describe, expect, test } from 'vitest';
import { exampleFunction } from '@/lib/example';

describe('示例测试', () => {
  test('示例函数应返回正确值', () => {
    const result = exampleFunction('test');
    expect(result).toBe('test processed');
  });
});
```

### 2. API测试
```bash
# 使用curl测试API
curl "http://localhost:3001/api/health"
curl "http://localhost:3001/api/ecosystem/status"
```

### 3. 端到端测试
```bash
# 使用Playwright
npm run test:e2e
```

## 部署

### 1. Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
vercel --prod
```

### 2. Docker部署
```bash
# 构建Docker镜像
docker build -t mission-control .

# 运行容器
docker run -p 3001:3001 mission-control
```

### 3. 手动部署
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

## 性能优化

### 1. 代码分割
```typescript
// 动态导入组件
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>加载中...</div>,
  ssr: false
});
```

### 2. 图片优化
```tsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="描述"
  width={500}
  height={300}
  priority={false}
/>
```

### 3. API缓存
```typescript
// 使用SWR进行数据获取
import useSWR from 'swr';

const { data, error } = useSWR('/api/data', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000 // 60秒去重
});
```

## 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
rm -rf .next node_modules
npm install
npm run build
```

#### 2. 类型错误
```bash
# 检查TypeScript
npm run type-check

# 修复类型
npm run type-check -- --fix
```

#### 3. API无响应
```bash
# 检查服务器状态
curl http://localhost:3001/api/health

# 查看日志
tail -f /tmp/mission-control-dev.log
```

### 调试工具
- **浏览器开发者工具**: 网络、控制台、性能
- **Next.js DevTools**: 组件树、性能分析
- **API测试工具**: Postman、Insomnia
- **日志查看**: `tail -f` 命令

## 贡献指南

### 1. 提交代码
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交更改
git add .
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin feature/new-feature
```

### 2. 提交信息规范
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具

### 3. 代码审查
- 确保代码符合规范
- 添加必要的测试
- 更新相关文档
- 检查性能影响

## 学习资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [TypeScript 文档](https://www.typescriptlang.org/docs)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)

### 教程和课程
- [Next.js学习路径](https://nextjs.org/learn)
- [TypeScript入门](https://www.typescriptlang.org/docs/handbook)
- [React官方教程](https://react.dev/learn)

### 社区支持
- [GitHub Issues](https://github.com/your-org/mission-control/issues)
- [Discord频道](https://discord.gg/your-channel)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/mission-control)

---
**最后更新**: 2026-02-23  
**版本**: 2.0.0  
**状态**: 活跃开发中 🚀