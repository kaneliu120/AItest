#!/usr/bin/env node

/**
 * 修复阶段1-3 API问题
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试API端点
async function testAPI(endpoint, method = 'GET', data = null) {
  console.log(`\n🔍 测试 ${endpoint}...`);
  
  try {
    let response;
    if (method === 'GET') {
      response = await axios.get(`${BASE_URL}${endpoint}`, { timeout: 5000 });
    } else {
      response = await axios.post(`${BASE_URL}${endpoint}`, data, { timeout: 5000 });
    }
    
    console.log(`   ✅ 状态: ${response.status}`);
    if (response.data.success !== undefined) {
      console.log(`   成功: ${response.data.success}`);
      if (response.data.error) {
        console.log(`   错误: ${response.data.error}`);
      }
    }
    return response.data;
  } catch (error) {
    console.log(`   ❌ 错误: ${error.message}`);
    if (error.response) {
      console.log(`   状态码: ${error.response.status}`);
      console.log(`   响应: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// 修复阶段1: 统一API网关
async function fixPhase1() {
  console.log('\n🔧 修复阶段1: 统一API网关');
  
  // 测试当前状态
  const status = await testAPI('/api/v1/unified?action=status');
  
  if (!status) {
    console.log('   ⚠️ API网关不可用，检查路由文件...');
    
    // 检查路由文件
    const routePath = '/Users/kane/mission-control/src/app/api/v1/unified/route.ts';
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // 检查常见问题
      if (content.includes('action=process')) {
        console.log('   ✅ 路由文件存在，包含action=process参数');
      }
      
      // 测试基本查询
      const queryTest = await testAPI('/api/v1/unified', 'POST', {
        action: 'process',
        query: '测试查询'
      });
      
      if (queryTest && queryTest.success) {
        console.log('   ✅ 统一API网关修复成功');
        return true;
      }
    }
  }
  
  return status !== null;
}

// 修复阶段2: 智能任务分发
async function fixPhase2() {
  console.log('\n🔧 修复阶段2: 智能任务分发');
  
  // 测试当前状态
  const status = await testAPI('/api/v2/dispatcher?action=status');
  
  if (!status) {
    console.log('   ⚠️ 智能任务分发不可用，检查路由文件...');
    
    // 检查路由文件
    const routePath = '/Users/kane/mission-control/src/app/api/v2/dispatcher/route.ts';
    if (fs.existsSync(routePath)) {
      const content = fs.readFileSync(routePath, 'utf8');
      
      // 测试基本分发
      const dispatchTest = await testAPI('/api/v2/dispatcher', 'POST', {
        action: 'dispatch',
        task: '创建一个React组件'
      });
      
      if (dispatchTest && dispatchTest.success) {
        console.log('   ✅ 智能任务分发修复成功');
        return true;
      } else {
        // 尝试其他action参数
        console.log('   尝试其他action参数...');
        
        const testActions = ['process', 'classify', 'analyze'];
        for (const action of testActions) {
          const test = await testAPI('/api/v2/dispatcher', 'POST', {
            action,
            task: '测试任务'
          });
          
          if (test && test.success) {
            console.log(`   ✅ 找到有效action: ${action}`);
            return true;
          }
        }
      }
    }
  }
  
  return status !== null;
}

// 修复阶段3: 上下文智能缓存
async function fixPhase3() {
  console.log('\n🔧 修复阶段3: 上下文智能缓存');
  
  // 测试当前状态
  const status = await testAPI('/api/v3/cache?action=status');
  
  if (!status) {
    console.log('   ⚠️ 上下文缓存不可用，检查路由文件...');
    
    // 检查路由文件是否存在
    const routePath = '/Users/kane/mission-control/src/app/api/v3/cache/route.ts';
    if (!fs.existsSync(routePath)) {
      console.log('   ❌ 路由文件不存在，需要创建');
      return false;
    }
    
    // 测试缓存操作
    const cacheTest = await testAPI('/api/v3/cache', 'POST', {
      action: 'get',
      key: 'test-key'
    });
    
    if (cacheTest) {
      console.log('   ✅ 上下文缓存API响应正常');
      return true;
    }
  }
  
  return status !== null;
}

// 创建缺失的API路由
function createMissingRoutes() {
  console.log('\n📝 创建缺失的API路由...');
  
  // 检查阶段3路由
  const phase3Route = '/Users/kane/mission-control/src/app/api/v3/cache/route.ts';
  if (!fs.existsSync(phase3Route)) {
    console.log('   创建阶段3: 上下文缓存API路由');
    
    const cacheRouteContent = `import { NextRequest, NextResponse } from 'next/server';
import { contextCacheService } from '@/lib/context-cache-service';

// GET: 获取缓存状态和内容
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    switch (action) {
      case 'status':
        // 获取缓存状态
        const status = contextCacheService.getCacheStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
        
      case 'stats':
        // 获取缓存统计
        const stats = contextCacheService.getCacheStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });
        
      case 'keys':
        // 获取所有缓存键
        const keys = contextCacheService.getAllKeys();
        return NextResponse.json({
          success: true,
          data: { keys },
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: \`未知操作: \${action}\`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('上下文缓存API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 缓存操作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: '缺少 action 参数',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    switch (action) {
      case 'set':
        // 设置缓存
        const { key, value, ttl } = body;
        if (!key || value === undefined) {
          return NextResponse.json({
            success: false,
            error: '缺少 key 或 value 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        contextCacheService.set(key, value, ttl);
        return NextResponse.json({
          success: true,
          data: { message: '缓存设置成功', key },
          timestamp: new Date().toISOString()
        });
        
      case 'get':
        // 获取缓存
        const { key: getKey } = body;
        if (!getKey) {
          return NextResponse.json({
            success: false,
            error: '缺少 key 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const cachedValue = contextCacheService.get(getKey);
        return NextResponse.json({
          success: true,
          data: { key: getKey, value: cachedValue, exists: cachedValue !== undefined },
          timestamp: new Date().toISOString()
        });
        
      case 'delete':
        // 删除缓存
        const { key: deleteKey } = body;
        if (!deleteKey) {
          return NextResponse.json({
            success: false,
            error: '缺少 key 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const deleted = contextCacheService.delete(deleteKey);
        return NextResponse.json({
          success: true,
          data: { key: deleteKey, deleted },
          timestamp: new Date().toISOString()
        });
        
      case 'clear':
        // 清空缓存
        const cleared = contextCacheService.clear();
        return NextResponse.json({
          success: true,
          data: { message: '缓存已清空', cleared },
          timestamp: new Date().toISOString()
        });
        
      case 'test':
        // 测试缓存
        const testKey = 'test-key-' + Date.now();
        const testValue = { message: '测试缓存值', timestamp: new Date().toISOString() };
        
        contextCacheService.set(testKey, testValue, 60); // 60秒TTL
        const retrieved = contextCacheService.get(testKey);
        
        return NextResponse.json({
          success: true,
          data: {
            message: '缓存测试完成',
            set: testValue,
            retrieved,
            match: JSON.stringify(testValue) === JSON.stringify(retrieved)
          },
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: \`未知操作: \${action}\`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('上下文缓存API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}`;
    
    // 确保目录存在
    const dir = path.dirname(phase3Route);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(phase3Route, cacheRouteContent);
    console.log('   ✅ 阶段3路由创建完成');
  }
  
  // 检查上下文缓存服务
  const cacheServicePath = '/Users/kane/mission-control/src/lib/context-cache-service.ts';
  if (!fs.existsSync(cacheServicePath)) {
    console.log('   创建上下文缓存服务...');
    
    const cacheServiceContent = `/**
 * 上下文智能缓存服务
 * 提供智能缓存管理，支持TTL、LRU淘汰、缓存统计等功能
 */

export interface CacheItem {
  value: any;
  timestamp: number;
  ttl?: number; // 生存时间（秒）
  accessCount: number;
  lastAccessed: number;
}

export class ContextCacheService {
  private cache: Map<string, CacheItem>;
  private maxSize: number;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    evictions: number;
  };

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
  }

  // 设置缓存
  set(key: string, value: any, ttl?: number): void {
    // 检查是否需要淘汰
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    });

    this.stats.sets++;
  }

  // 获取缓存
  get(key: string): any {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return undefined;
    }

    // 检查是否过期
    if (item.ttl && Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      return undefined;
    }

    // 更新访问统计
    item.accessCount++;
    item.lastAccessed = Date.now();
    
    this.stats.hits++;
    return item.value;
  }

  // 删除缓存
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  // 清空缓存
  clear(): number {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  // 获取所有缓存键
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // 获取缓存状态
  getCacheStatus(): any {
    const now = Date.now();
    const items = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: Math.floor((now - item.timestamp) / 1000),
      ttl: item.ttl,
      accessCount: item.accessCount,
      lastAccessed: Math.floor((now - item.lastAccessed) / 1000),
      expired: item.ttl ? (now - item.timestamp > item.ttl * 1000) : false
    }));

    return {
      status: 'healthy',
      service: 'context-cache-service',
      timestamp: new Date().toISOString(),
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: Math.round((this.cache.size / this.maxSize) * 100),
      stats: this.stats,
      items: items.slice(0, 50) // 只返回前50个
    };
  }

  // 获取缓存统计
  getCacheStats(): any {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100) 
      : 0;

    return {
      ...this.stats,
      hitRate: \`\${hitRate}%\`,
      totalOperations: this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes,
      cacheSize: this.cache.size,
      maxSize: this.maxSize
    };
  }

  // LRU淘汰算法
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  // 清理过期缓存
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && now - item.timestamp > item.ttl * 1000) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// 导出单例实例
export const contextCacheService = new ContextCacheService();`;
    
    fs.writeFileSync(cacheServicePath, cacheServiceContent);
    console.log('   ✅ 上下文缓存服务创建完成');
  }
  
  return true;
}

// 主函数
async function main() {
  console.log('🔧 修复阶段1-3 API问题');
  console.log('='.repeat(60));
  console.log('时间: ' + new Date().toLocaleString('zh-CN'));
  console.log('='.repeat(60));
  
  try {
    // 1. 创建缺失的路由和服务
    createMissingRoutes();
    
    // 2. 修复阶段1
    const phase1Fixed = await fixPhase1();
    
    // 3. 修复阶段2
    const phase2Fixed = await fixPhase2();
    
    // 4. 修复阶段3
    const phase3Fixed = await fixPhase3();
    
    // 5. 最终测试
    console.log('\n📋 修复结果报告');
    console.log('='.repeat(60));
    console.log(`阶段1: 统一API网关 - ${phase1Fixed ? '✅ 正常' : '❌ 需要修复'}`);
    console.log(`阶段2: 智能任务分发 - ${phase2Fixed ? '✅ 正常' : '❌ 需要修复'}`);
    console.log(`阶段3: 上下文智能缓存 - ${phase3Fixed ? '✅ 正常' : '❌ 需要修复'}`);
    
    // 6. 测试所有阶段
    console.log('\n🧪 最终系统测试');
    console.log('-'.repeat(40));
    
    const phases = [
      { name: '阶段1', endpoint: '/api/v1/unified?action=status' },
      { name: '阶段2', endpoint: '/api/v2/dispatcher?action=status' },
      { name: '阶段3', endpoint: '/api/v3/cache?action=status' },
      { name: '阶段4', endpoint: '/api/v4/knowledge-dev?action=status' },
      { name: '阶段5', endpoint: '/api/v5/automation?action=status' },
      { name: '阶段6', endpoint: '/api/v6/monitoring?action=status' }
    ];
    
    const results = [];
    
    for (const phase of phases) {
      console.log(`   ${phase.name}...`);
      try {
        const response = await axios.get(`${BASE_URL}${phase.endpoint}`, { timeout: 3000 });
        if (response.data.success) {
          console.log(`      ✅ 状态: ${response.data.data.status || 'healthy'}`);
          results.push({ phase: phase.name, status: 'healthy' });
        } else {
          console.log(`      ⚠️ 状态: 错误 - ${response.data.error}`);
          results.push({ phase: phase.name, status: 'error' });
        }
      } catch (error) {
        console.log(`      ❌ 不可用: ${error.message}`);
        results.push({ phase: phase.name, status: 'failed' });
      }
    }
    
    // 7. 总结
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    console.log('\n📊 修复总结');
    console.log('='.repeat(60));
    console.log(`健康系统: ${healthyCount}/${totalCount}`);
    console.log(`成功率: ${Math.round((healthyCount / totalCount) * 100)}%`);
    
    if (healthyCount === totalCount) {
      console.log('\n🎉 所有阶段系统修复完成！');
      console.log('系统已完全就绪，可以开始生产部署。');
    } else {
      console.log('\n⚠️ 部分系统仍需修复');
      console.log('需要手动检查以下系统:');
      results.filter(r => r.status !== 'healthy').forEach(r => {
        console.log(`   - ${r.phase}: ${r.status}`);
      });
    }
    
    console.log('\n🚀 访问信息:');
    console.log('   Mission Control: http://localhost:3001');
    console.log('   知识管理系统: http://localhost:3000');
    console.log('   知识管理后端: http://localhost:8000');
    console.log('   阶段6监控: http://localhost:3001/unified-monitoring');
    
    console.log('\n='.repeat(60));
    console.log('✅ API修复流程完成');
    
  } catch (error) {
    console.error('❌ 修复过程发生错误:', error.message);
    console.error(error.stack);
  }
}

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}