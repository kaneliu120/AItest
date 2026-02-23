
# Mission Control 服务器启动问题修复指南

## 问题诊断
根据检查，Mission Control项目存在TypeScript编译错误，导致服务器无法启动。

## 发现的问题
1. layout.tsx - 可能的语法问题
2. page.tsx - 类型注解位置问题  
3. database.ts - export语句和类型注解问题
4. workflow-engine.ts - 语法问题

## 修复步骤

### 步骤1: 验证基础环境
1. 进入测试目录:
   ```bash
   cd ~/mission-control/test-simple-app
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 启动测试服务器:
   ```bash
   npm run dev
   ```

4. 访问 http://localhost:3000
   - 如果成功: 基础环境正常
   - 如果失败: Node.js/Next.js环境有问题

### 步骤2: 修复TypeScript错误
1. 运行TypeScript检查:
   ```bash
   cd ~/mission-control
   npx tsc --noEmit 2>&1 | grep "error TS"
   ```

2. 根据错误信息修复:
   - 添加缺失的分号
   - 修复类型注解
   - 确保导入路径正确

### 步骤3: 常见修复
1. **添加分号**:
   ```typescript
   // 错误
   export const x = 1
   // 修复
   export const x = 1;
   ```

2. **修复类型注解**:
   ```typescript
   // 错误
   const x: number = 1
   // 修复  
   const x: number = 1;
   ```

3. **检查导入**:
   ```typescript
   // 确保导入路径存在
   import { x } from '@/lib/x';
   ```

### 步骤4: 测试启动
1. 修复后测试:
   ```bash
   cd ~/mission-control
   npx next dev --port 3001
   ```

2. 检查输出:
   - 如果显示 "Ready"，则成功
   - 如果有错误，根据错误信息继续修复

## 备用方案
如果无法快速修复所有TypeScript错误:

1. **临时方案**: 将TypeScript检查设为宽松
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": false,
       "noEmitOnError": false
     }
   }
   ```

2. **渐进修复**: 先修复关键文件，逐步修复所有

## 获取帮助
如果遇到具体错误，可以:
1. 复制错误信息
2. 搜索解决方案
3. 或请求进一步协助
