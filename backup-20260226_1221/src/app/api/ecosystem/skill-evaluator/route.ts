import { skillEvaluatorService } from '@/lib/skill-evaluator-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await skillEvaluatorService.getEvaluationStats();
      return NextResponse.json({ success: true, data: stats });
    }
    
    if (action === 'reports') {
      const reports = await skillEvaluatorService.getEvaluationReports();
      return NextResponse.json({ success: true, data: { reports } });
    }
    
    if (action === 'status') {
      const status = skillEvaluatorService.getSystemStatus();
      return NextResponse.json({ success: true, data: status });
    }
    
    // 默认返回统计
    const stats = await skillEvaluatorService.getEvaluationStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('技能评估API错误:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'evaluate';
    
    if (action === 'evaluate') {
      const { skillPath, skillName } = body;
      
      if (!skillPath) {
        return NextResponse.json({ success: false, error: '缺少技能路径参数' }, { status: 400 });
      }
      
      const report = await skillEvaluatorService.evaluateSkill(skillPath, skillName);
      return NextResponse.json({ success: true, data: report });
    }
    
    if (action === 'get-report') {
      const { reportId } = body;
      
      if (!reportId) {
        return NextResponse.json({ success: false, error: '缺少报告ID参数' }, { status: 400 });
      }
      
      const report = await skillEvaluatorService.getReportDetails(reportId);
      
      if (!report) {
        return NextResponse.json({ success: false, error: '报告不存在' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, data: report });
    }
    
    if (action === 'delete-report') {
      const { reportId } = body;
      
      if (!reportId) {
        return NextResponse.json({ success: false, error: '缺少报告ID参数' }, { status: 400 });
      }
      
      const deleted = await skillEvaluatorService.deleteReport(reportId);
      return NextResponse.json({ success: true, data: { deleted } });
    }
    
    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    console.error('技能评估API POST错误:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
