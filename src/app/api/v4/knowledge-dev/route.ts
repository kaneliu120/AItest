import { NextRequest, NextResponse } from 'next/server';
import { knowledgeEnhancedDevService, KnowledgeEnhancementLevel } from '@/lib/knowledge-enhanced-dev-service';
import { unifiedGatewayService, UnifiedRequest } from '@/lib/unified-gateway-service';

// 生成请求ID
function generateRequestId(): string {
  return `kdev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// GET: 获取服务信息和状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'status';
    
    switch (action) {
      case 'status':
        // 获取服务状态
        const status = knowledgeEnhancedDevService.getServiceStatus();
        return NextResponse.json({
          success: true,
          data: status,
          timestamp: new Date().toISOString()
        });
        
      case 'analyze':
        // 分析开发任务
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少查询参数 q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const analysis = await knowledgeEnhancedDevService.analyzeDevTask(query);
        return NextResponse.json({
          success: true,
          data: analysis,
          timestamp: new Date().toISOString()
        });
        
      case 'knowledge':
        // 查询知识库
        const knowledgeQuery = searchParams.get('q');
        if (!knowledgeQuery) {
          return NextResponse.json({
            success: false,
            error: '缺少查询参数 q',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const maxResults = parseInt(searchParams.get('maxResults') || '5');
        const minRelevance = parseFloat(searchParams.get('minRelevance') || '0.7');
        
        const knowledgeResults = await knowledgeEnhancedDevService.queryKnowledgeBase(knowledgeQuery, {
          maxResults,
          minRelevance
        });
        
        return NextResponse.json({
          success: true,
          data: knowledgeResults,
          timestamp: new Date().toISOString()
        });
        
      case 'capabilities':
        // 获取能力列表
        const statusData = knowledgeEnhancedDevService.getServiceStatus();
        return NextResponse.json({
          success: true,
          data: {
            capabilities: statusData.capabilities,
            features: statusData.features,
            endpoints: statusData.endpoints
          },
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('知识增强开发API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST: 知识增强开发处理
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
      case 'enhance':
        // 知识增强开发处理
        const { query, priority, context, system, enhancementLevel = 'enhanced' } = body;
        
        if (!query) {
          return NextResponse.json({
            success: false,
            error: '缺少 query 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const enhanceRequest: UnifiedRequest = {
          id: generateRequestId(),
          query,
          system: system as any,
          priority: priority || 'medium',
          context: context || {},
          metadata: {
            source: 'api',
            method: 'POST',
            enhancementLevel: enhancementLevel as KnowledgeEnhancementLevel
          }
        };
        
        // 处理知识增强请求
        const enhancedResult = await knowledgeEnhancedDevService.processKnowledgeEnhancedRequest(
          enhanceRequest,
          enhancementLevel as KnowledgeEnhancementLevel
        );
        
        return NextResponse.json({
          success: true,
          data: {
            enhanced: enhancedResult,
            requestId: enhanceRequest.id,
            enhancementLevel,
            processingTime: Date.now() - new Date(enhancedResult.enhancedResponse.timestamp || new Date()).getTime()
          },
          timestamp: new Date().toISOString()
        });
        
      case 'batch-enhance':
        // 批量知识增强
        const { queries } = body;
        
        if (!Array.isArray(queries) || queries.length === 0) {
          return NextResponse.json({
            success: false,
            error: '缺少有效的 queries 数组',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        // 限制批量大小
        const limitedQueries = queries.slice(0, 5);
        
        const batchResults = await Promise.all(
          limitedQueries.map(async (q: string, index: number) => {
            const req: UnifiedRequest = {
              id: `${generateRequestId()}_${index}`,
              query: q,
              priority: 'medium',
              context: {},
              metadata: { batchIndex: index }
            };
            
            try {
              const result = await knowledgeEnhancedDevService.processKnowledgeEnhancedRequest(req);
              
              return {
                success: true,
                data: {
                  query: q,
                  taskAnalysis: result.enhancedResponse.data?.taskAnalysis,
                  enhancements: result.enhancements.length,
                  qualityMetrics: result.qualityMetrics
                },
                index
              };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : '未知错误',
                query: q,
                index
              };
            }
          })
        );
        
        // 计算统计
        const successful = batchResults.filter(r => r.success).length;
        const totalEnhancements = batchResults.reduce((sum, r) => 
          sum + (r.success ? (r.data?.enhancements || 0) : 0), 0);
        
        const avgQuality = batchResults
          .filter(r => r.success && r.data?.qualityMetrics)
          .reduce((sum, r) => {
            const metrics = r.data.qualityMetrics;
            return sum + (metrics.completeness + metrics.accuracy + metrics.relevance + metrics.practicality) / 4;
          }, 0) / Math.max(1, successful);
        
        return NextResponse.json({
          success: true,
          data: {
            total: batchResults.length,
            successful,
            successRate: `${((successful / batchResults.length) * 100).toFixed(1)}%`,
            totalEnhancements,
            averageEnhancements: successful > 0 ? (totalEnhancements / successful).toFixed(1) : '0',
            averageQuality: avgQuality.toFixed(3),
            results: batchResults
          },
          timestamp: new Date().toISOString()
        });
        
      case 'compare':
        // 比较增强前后的效果
        const { compareQuery, compareContext } = body;
        
        if (!compareQuery) {
          return NextResponse.json({
            success: false,
            error: '缺少 compareQuery 参数',
            timestamp: new Date().toISOString()
          }, { status: 400 });
        }
        
        const compareRequest: UnifiedRequest = {
          id: generateRequestId(),
          query: compareQuery,
          priority: 'medium',
          context: compareContext || {},
          metadata: { comparison: true }
        };
        
        // 1. 获取原始响应
        const originalResponse = await unifiedGatewayService.processRequest(compareRequest);
        
        // 2. 获取知识增强响应
        const enhancedResult2 = await knowledgeEnhancedDevService.processKnowledgeEnhancedRequest(compareRequest);
        
        // 比较分析
        const comparison = {
          original: {
            responseTime: originalResponse.data?.responseTime || 0,
            success: originalResponse.success,
            dataSize: JSON.stringify(originalResponse.data).length,
            features: ['基础响应']
          },
          enhanced: {
            responseTime: enhancedResult2.enhancedResponse.data?.responseTime || 0,
            success: enhancedResult2.enhancedResponse.success,
            dataSize: JSON.stringify(enhancedResult2.enhancedResponse.data).length,
            features: [
              '知识增强',
              '任务分析',
              '质量指标',
              '改进建议',
              ...enhancedResult2.enhancements.map((e: any) => e.type)
            ],
            enhancements: enhancedResult2.enhancements.length,
            qualityMetrics: enhancedResult2.qualityMetrics
          },
          improvement: {
            responseTimeChange: enhancedResult2.enhancedResponse.data?.responseTime - (originalResponse.data?.responseTime || 0),
            dataSizeIncrease: JSON.stringify(enhancedResult2.enhancedResponse.data).length - JSON.stringify(originalResponse.data).length,
            featureIncrease: enhancedResult2.enhancements.length + 4, // 基础4个增强特性
            valueAdded: enhancedResult2.enhancements.length > 0 ? '高' : '低'
          }
        };
        
        return NextResponse.json({
          success: true,
          data: comparison,
          requestId: compareRequest.id,
          timestamp: new Date().toISOString()
        });
        
      case 'test-scenarios':
        // 测试不同开发场景
        const testScenarios = [
          {
            name: 'React组件开发',
            query: '创建一个用户登录表单组件，包含邮箱、密码输入框和提交按钮',
            type: 'code-generation',
            priority: 'medium'
          },
          {
            name: 'API设计',
            query: '设计一个用户管理REST API，包含注册、登录、信息更新功能',
            type: 'api-design',
            priority: 'high'
          },
          {
            name: '数据库优化',
            query: '优化PostgreSQL查询性能，针对百万级用户表',
            type: 'database-design',
            priority: 'high'
          },
          {
            name: '测试策略',
            query: '为React应用设计完整的测试策略',
            type: 'testing-strategy',
            priority: 'medium'
          }
        ];
        
        const scenarioResults = await Promise.all(
          testScenarios.map(async (scenario, index) => {
            const req: UnifiedRequest = {
              id: `${generateRequestId()}_scenario_${index}`,
              query: scenario.query,
              priority: scenario.priority as any,
              context: { scenario: scenario.name, type: scenario.type },
              metadata: { testScenario: true }
            };
            
            try {
              const result = await knowledgeEnhancedDevService.processKnowledgeEnhancedRequest(req);
              
              return {
                scenario: scenario.name,
                success: true,
                taskType: result.enhancedResponse.data?.taskAnalysis?.type,
                enhancements: result.enhancements.length,
                qualityScore: (
                  result.qualityMetrics.completeness + 
                  result.qualityMetrics.accuracy + 
                  result.qualityMetrics.relevance + 
                  result.qualityMetrics.practicality
                ) / 4,
                responseTime: result.enhancedResponse.data?.responseTime || 0
              };
            } catch (error) {
              return {
                scenario: scenario.name,
                success: false,
                error: error instanceof Error ? error.message : '未知错误'
              };
            }
          })
        );
        
        const successfulScenarios = scenarioResults.filter(r => r.success).length;
        const avgQualityScore = scenarioResults
          .filter(r => r.success && r.qualityScore)
          .reduce((sum, r) => sum + (r.qualityScore || 0), 0) / Math.max(1, successfulScenarios);
        
        const avgResponseTime = scenarioResults
          .filter(r => r.success && r.responseTime)
          .reduce((sum, r) => sum + (r.responseTime || 0), 0) / Math.max(1, successfulScenarios);
        
        return NextResponse.json({
          success: true,
          data: {
            totalScenarios: scenarioResults.length,
            successfulScenarios,
            successRate: `${((successfulScenarios / scenarioResults.length) * 100).toFixed(1)}%`,
            averageQualityScore: avgQualityScore.toFixed(3),
            averageResponseTime: avgResponseTime.toFixed(1),
            results: scenarioResults
          },
          timestamp: new Date().toISOString()
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: `未知操作: ${action}`,
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }
  } catch (error) {
    console.error('知识增强开发API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}