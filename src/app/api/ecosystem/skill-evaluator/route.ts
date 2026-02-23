import { skillEvaluatorService } from '@/lib/skill-evaluator-service';
import { NextRequest } from 'next/server';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await skillEvaluatorService.getEvaluationStats();
      return successResponse(stats, {
        message: '技能评估统计获取成功',
        requestId,
      });
    }
    
    if (action === 'reports') {
      const reports = await skillEvaluatorService.getEvaluationReports();
      return successResponse({ reports }, {
        message: '评估报告列表获取成功',
        requestId,
      });
    }
    
    if (action === 'status') {
      const status = skillEvaluatorService.getSystemStatus();
      return successResponse(status, {
        message: '系统状态获取成功',
        requestId,
      });
    }
    
    // 默认返回统计
    const stats = await skillEvaluatorService.getEvaluationStats();
    return successResponse(stats, {
      message: '技能评估统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('技能评估API错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

export const POST = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    const action = body.action || 'evaluate';
    
    if (action === 'evaluate') {
      const { skillPath, skillName } = body;
      
      if (!skillPath) {
        return errorResponse('缺少技能路径参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const report = await skillEvaluatorService.evaluateSkill(skillPath, skillName);
      return successResponse(report, {
        message: '技能评估完成',
        requestId,
      });
    }
    
    if (action === 'get-report') {
      const { reportId } = body;
      
      if (!reportId) {
        return errorResponse('缺少报告ID参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const report = await skillEvaluatorService.getReportDetails(reportId);
      
      if (!report) {
        return notFoundResponse('报告不存在');
      }
      
      return successResponse(report, {
        message: '报告详情获取成功',
        requestId,
      });
    }
    
    if (action === 'delete-report') {
      const { reportId } = body;
      
      if (!reportId) {
        return errorResponse('缺少报告ID参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const deleted = await skillEvaluatorService.deleteReport(reportId);
      return successResponse({ deleted }, {
        message: deleted ? '报告删除成功' : '报告删除失败',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('技能评估API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

