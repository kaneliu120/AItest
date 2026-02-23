# Mission Control 生产部署配置

## 部署目标
- **环境**: 生产环境
- **平台**: Vercel (推荐) 或 自定义服务器
- **域名**: mission-control.yourdomain.com
- **数据库**: PostgreSQL (生产) 或 SQLite (开发)

## 1. Vercel 部署 (推荐)

### 1.1 准备工作
```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login
```

### 1.2 环境变量配置
创建 `.env.production` 文件:
```env
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/mission_control
# 或使用SQLite (仅开发)
# DATABASE_URL=file:./mission-control.db

# 应用配置
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://mission-control.yourdomain.com

# 功能开关
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
ENABLE_AUTOMATION=true

# 外部API密钥 (按需配置)
GITHUB_TOKEN=your-github-token
OPENAI_API_KEY=your-openai-key
GOOGLE_ANALYTICS_KEY=your-ga-key
```

### 1.3 Vercel 项目配置 (`vercel.json`)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 1.4 部署命令
```bash
# 预览部署
vercel

# 生产部署
vercel --prod

# 设置自定义域名
vercel domains add mission-control.yourdomain.com
```

## 2. 自定义服务器部署 (Docker)

### 2.1 Dockerfile
```dockerfile
# 使用官方Node.js镜像
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 构建应用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### 2.2 Docker Compose 配置
```yaml
version: '3.8'

services:
  mission-control:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/mission_control
    depends_on:
      - db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mission_control
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### 2.3 部署脚本
```bash
#!/bin/bash
# deploy.sh

echo "=== Mission Control 部署 ==="

# 1. 构建Docker镜像
echo "1. 构建Docker镜像..."
docker build -t mission-control:latest .

# 2. 停止旧容器
echo "2. 停止旧容器..."
docker stop mission-control || true
docker rm mission-control || true

# 3. 启动新容器
echo "3. 启动新容器..."
docker run -d \
  --name mission-control \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --env-file .env.production \
  mission-control:latest

# 4. 检查状态
echo "4. 检查部署状态..."
sleep 5
docker ps | grep mission-control

echo "✅ 部署完成!"
echo "访问: http://localhost:3000"
```

## 3. 数据库配置

### 3.1 PostgreSQL 设置
```sql
-- 创建数据库
CREATE DATABASE mission_control;

-- 创建用户
CREATE USER mission_user WITH PASSWORD 'secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE mission_control TO mission_user;

-- 扩展 (如果需要)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3.2 数据库迁移
```typescript
// 创建迁移脚本: scripts/migrate-db.ts
import { DatabaseManager } from './src/lib/database';

async function migrate() {
  const db = new DatabaseManager();
  
  try {
    await db.initialize();
    console.log('✅ 数据库迁移完成');
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

migrate();
```

## 4. 监控和日志

### 4.1 日志配置
```typescript
// src/lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export default logger;
```

### 4.2 健康检查端点
```typescript
// src/app/api/health/route.ts (扩展)
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: await checkDatabase(),
    services: await checkServices()
  };
  
  return NextResponse.json(health);
}
```

## 5. 安全配置

### 5.1 环境安全检查
```bash
#!/bin/bash
# security-check.sh

echo "=== 安全配置检查 ==="

# 检查环境变量
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET")
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ 缺少环境变量: $var"
    exit 1
  fi
done

# 检查文件权限
echo "检查文件权限..."
find . -name "*.env*" -exec stat -f "%Sp %N" {} \; | grep -v "600"

# 检查依赖安全
echo "检查依赖安全..."
npm audit --production

echo "✅ 安全检查完成"
```

### 5.2 CORS 配置
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' }
        ]
      }
    ];
  }
};
```

## 6. 备份和恢复

### 6.1 备份脚本
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mission-control_$DATE.tar.gz"

echo "=== 备份 Mission Control ==="

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
if [ -f "mission-control.db" ]; then
  echo "备份SQLite数据库..."
  cp mission-control.db $BACKUP_DIR/mission-control_$DATE.db
fi

# 备份配置文件
echo "备份配置文件..."
tar -czf $BACKUP_FILE \
  .env.production \
  vercel.json \
  docker-compose.yml \
  Dockerfile \
  package.json \
  tsconfig.json

echo "✅ 备份完成: $BACKUP_FILE"
echo "备份大小: $(du -h $BACKUP_FILE | cut -f1)"
```

### 6.2 恢复脚本
```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "用法: $0 <备份文件>"
  exit 1
fi

echo "=== 恢复 Mission Control ==="

# 解压备份
tar -xzf $BACKUP_FILE

# 恢复数据库
if [ -f "mission-control_*.db" ]; then
  echo "恢复数据库..."
  cp mission-control_*.db mission-control.db
fi

echo "✅ 恢复完成"
```

## 7. 自动化部署 (GitHub Actions)

### 7.1 GitHub Actions 工作流
```yaml
# .github/workflows/deploy.yml
name: Deploy Mission Control

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 8. 性能优化

### 8.1 缓存配置
```typescript
// src/app/api/route.ts
export const revalidate = 3600; // 1小时缓存

// 或使用动态配置
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cacheKey = searchParams.toString();
  
  // 实现缓存逻辑
}
```

### 8.2 图片优化
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  }
};
```

## 9. 故障排除

### 常见问题解决

#### 9.1 服务器无法启动
```bash
# 检查错误日志
npm run dev 2>&1 | grep -A5 -B5 "error"

# 检查端口占用
lsof -i :3000

# 清理缓存
rm -rf .next node_modules
npm install
```

#### 9.2 数据库连接失败
```bash
# 测试数据库连接
node -e "const { Client } = require('pg'); const client = new Client({ connectionString: process.env.DATABASE_URL }); client.connect().then(() => console.log('✅ 连接成功')).catch(e => console.log('❌ 连接失败:', e.message))"
```

#### 9.3 内存泄漏
```bash
# 监控内存使用
node --inspect server.js

# 或使用工具
npm install -g clinic
clinic doctor -- node server.js
```

## 10. 维护计划

### 每日任务
- [ ] 检查服务器状态
- [ ] 备份数据库
- [ ] 查看错误日志
- [ ] 监控性能指标

### 每周任务
- [ ] 更新依赖
- [ ] 清理旧日志
- [ ] 优化数据库
- [ ] 安全扫描

### 每月任务
- [ ] 全面备份
- [ ] 性能测试
- [ ] 安全审计
- [ ] 用户反馈分析

---

**最后更新**: 2026-02-22  
**状态**: 就绪  
**下一步**: 修复TypeScript错误后即可部署