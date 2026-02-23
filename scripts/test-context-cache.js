#!/usr/bin/env node

const http = require('http');

// 测试查询对 (语义相似但不同)
const testQueryPairs = [
  {
    similar: [
      '如何优化React应用性能',
      'React性能优化最佳实践',
      '提升React应用加载速度的方法'
    ],
    different: '配置Docker容器网络'
  },
  {
    similar: [
      '设计微服务架构',
      '微服务架构设计模式',
      '构建微服务系统的最佳实践'
    ],
    different: '实现JWT认证的Node.js API'
  },
  {
    similar: [
      'PostgreSQL数据库索引优化',
      '优化PostgreSQL查询性能',
      '数据库索引设计指南'
    ],
    different: '使用Redis缓存会话数据'
  }
];

// 测试统计
const stats = {
  totalQueries: 0,
  cacheHits: 0,
  semanticHits: 0,
  partialHits: 0,
  exactHits: 0,
  misses: 0,
  responseTimes: [],
  matchTypes: {},
  similarities: []
};

console.log('🧠 测试上下文智能缓存系统...\n');

// 测试单个查询
function testQuery(query, description) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const postData = JSON.stringify({
      action: 'query',
      query,
      strategy: 'default'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v3/cache',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        stats.responseTimes.push(responseTime);
        stats.totalQueries++;
        
        try {
          const json = JSON.parse(data);
          if (json.success) {
            const cacheInfo = json.cacheInfo;
            
            if (cacheInfo.hit) {
              stats.cacheHits++;
              stats.matchTypes[cacheInfo.matchType] = (stats.matchTypes[cacheInfo.matchType] || 0) + 1;
              
              if (cacheInfo.matchType === 'semantic') stats.semanticHits++;
              else if (cacheInfo.matchType === 'partial') stats.partialHits++;
              else if (cacheInfo.matchType === 'exact') stats.exactHits++;
              
              if (cacheInfo.similarity) {
                stats.similarities.push(cacheInfo.similarity);
              }
              
              console.log(`✅ ${description}: "${query.substring(0, 30)}..."`);
              console.log(`   缓存命中: ${cacheInfo.matchType}, 相似度: ${cacheInfo.similarity ? (cacheInfo.similarity * 100).toFixed(1) + '%' : 'N/A'}`);
              console.log(`   响应时间: ${responseTime}ms`);
            } else {
              stats.misses++;
              console.log(`🔄 ${description}: "${query.substring(0, 30)}..."`);
              console.log(`   缓存未命中, 响应时间: ${responseTime}ms`);
            }
          } else {
            stats.misses++;
            console.log(`❌ ${description} 失败: ${json.error}`);
          }
        } catch (e) {
          stats.misses++;
          console.log(`❌ ${description} 解析失败: ${e.message}`);
        }
        
        resolve();
      });
    });

    req.on('error', (e) => {
      stats.misses++;
      stats.totalQueries++;
      console.log(`❌ ${description} 请求失败: ${e.message}`);
      resolve();
    });

    req.on('timeout', () => {
      stats.misses++;
      stats.totalQueries++;
      console.log(`❌ ${description} 请求超时`);
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

// 测试相似查询的缓存效果
async function testSimilarQueries() {
  console.log('🔍 测试语义相似查询的缓存效果...\n');
  
  for (let i = 0; i < testQueryPairs.length; i++) {
    const pair = testQueryPairs[i];
    const similarQueries = pair.similar;
    const differentQuery = pair.different;
    
    console.log(`📊 测试组 ${i + 1}:`);
    console.log('='.repeat(50));
    
    // 测试第一个相似查询 (应该未命中)
    await testQuery(similarQueries[0], `组${i+1}-首次查询`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试第二个相似查询 (应该语义命中)
    await testQuery(similarQueries[1], `组${i+1}-相似查询`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试第三个相似查询 (应该语义命中)
    await testQuery(similarQueries[2], `组${i+1}-相关查询`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试不同查询 (应该未命中)
    await testQuery(differentQuery, `组${i+1}-不同查询`);
    
    console.log('='.repeat(50) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// 获取缓存统计
async function getCacheStats() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v3/cache?action=stats',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.success ? json.data : null);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

// 运行测试
async function runTest() {
  console.log('🚀 开始上下文智能缓存系统测试...\n');
  
  // 运行相似查询测试
  await testSimilarQueries();
  
  // 获取缓存统计
  const cacheStats = await getCacheStats();
  
  // 计算统计
  const totalTime = stats.responseTimes.reduce((sum, time) => sum + time, 0);
  const avgResponseTime = stats.responseTimes.length > 0 ? totalTime / stats.responseTimes.length : 0;
  
  const hitRate = stats.totalQueries > 0 ? (stats.cacheHits / stats.totalQueries) * 100 : 0;
  const semanticHitRate = stats.cacheHits > 0 ? (stats.semanticHits / stats.cacheHits) * 100 : 0;
  const partialHitRate = stats.cacheHits > 0 ? (stats.partialHits / stats.cacheHits) * 100 : 0;
  const exactHitRate = stats.cacheHits > 0 ? (stats.exactHits / stats.cacheHits) * 100 : 0;
  
  const avgSimilarity = stats.similarities.length > 0 ? 
    stats.similarities.reduce((sum, s) => sum + s, 0) / stats.similarities.length : 0;
  
  // 输出结果
  console.log('📊 上下文缓存测试结果:');
  console.log('='.repeat(60));
  console.log(`总查询数: ${stats.totalQueries}`);
  console.log(`缓存命中数: ${stats.cacheHits} (${hitRate.toFixed(1)}%)`);
  console.log(`语义命中数: ${stats.semanticHits} (${semanticHitRate.toFixed(1)}%)`);
  console.log(`部分命中数: ${stats.partialHits} (${partialHitRate.toFixed(1)}%)`);
  console.log(`精确命中数: ${stats.exactHits} (${exactHitRate.toFixed(1)}%)`);
  console.log(`未命中数: ${stats.misses}`);
  console.log(`平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`平均相似度: ${(avgSimilarity * 100).toFixed(1)}%`);
  
  console.log('\n🎯 匹配类型分布:');
  Object.entries(stats.matchTypes).forEach(([type, count]) => {
    const percentage = (count / stats.cacheHits * 100).toFixed(1);
    console.log(`  ${type}: ${count}次 (${percentage}%)`);
  });
  
  if (cacheStats) {
    console.log('\n📈 系统统计对比:');
    console.log(`  系统命中率: ${cacheStats.hitRate}%`);
    console.log(`  语义命中率: ${cacheStats.semanticHitRate}%`);
    console.log(`  部分命中率: ${cacheStats.partialHitRate}%`);
    console.log(`  缓存大小: ${cacheStats.cacheSize} 项`);
    console.log(`  总请求数: ${cacheStats.totalRequests}`);
  }
  
  console.log('='.repeat(60));
  
  // 评估
  console.log('\n🎯 上下文缓存能力评估:');
  
  // 语义命中率评估
  if (semanticHitRate >= 30) {
    console.log('✅ 语义理解: 优秀 (≥ 30%) - 能有效识别相似查询');
  } else if (semanticHitRate >= 15) {
    console.log('⚠️  语义理解: 良好 (≥ 15%) - 有一定识别能力');
  } else {
    console.log('❌ 语义理解: 需要优化 (< 15%)');
  }
  
  // 总命中率评估
  if (hitRate >= 50) {
    console.log('✅ 缓存效果: 优秀 (≥ 50%) - 显著减少重复计算');
  } else if (hitRate >= 30) {
    console.log('⚠️  缓存效果: 良好 (≥ 30%)');
  } else {
    console.log('❌ 缓存效果: 需要优化 (< 30%)');
  }
  
  // 响应时间评估
  if (avgResponseTime < 100) {
    console.log('✅ 响应速度: 优秀 (< 100ms) - 适合实时应用');
  } else if (avgResponseTime < 300) {
    console.log('⚠️  响应速度: 可接受 (< 300ms)');
  } else {
    console.log('❌ 响应速度: 较慢 (> 300ms)');
  }
  
  // 匹配质量评估
  if (avgSimilarity >= 0.7) {
    console.log('✅ 匹配质量: 优秀 (≥ 70%) - 高相关性匹配');
  } else if (avgSimilarity >= 0.5) {
    console.log('⚠️  匹配质量: 良好 (≥ 50%)');
  } else {
    console.log('❌ 匹配质量: 需要优化 (< 50%)');
  }
  
  console.log('\n🚀 建议:');
  if (semanticHitRate < 30) {
    console.log('  • 优化语义特征提取算法');
    console.log('  • 增加更多上下文特征');
    console.log('  • 调整相似度权重配置');
  }
  if (hitRate < 50) {
    console.log('  • 增加缓存TTL时间');
    console.log('  • 优化缓存清理策略');
    console.log('  • 增加缓存容量');
  }
  if (avgResponseTime > 300) {
    console.log('  • 优化特征计算性能');
    console.log('  • 增加缓存预加载');
    console.log('  • 使用更高效的相似度算法');
  }
  
  console.log('\n✅ 上下文智能缓存系统测试完成！');
}

// 运行测试
runTest().catch(console.error);