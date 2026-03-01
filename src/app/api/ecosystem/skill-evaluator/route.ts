import { skillEvaluatorService } from '@/lib/skill-evaluator-service';
import { isWorkflowAdminAuthorized } from '@/lib/auth/workflow-auth';
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
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
      const grade = url.searchParams.get('grade') || undefined;
      const minScore = url.searchParams.get('minScore');
      const hours = url.searchParams.get('hours');
      const reports = await skillEvaluatorService.getEvaluationReports(limit, {
        grade,
        minScore: minScore ? Number(minScore) : undefined,
        hours: hours ? Number(hours) : undefined,
      });
      return NextResponse.json({ success: true, data: { reports, total: reports.length } });
    }

    if (action === 'skill-trend') {
      const skillName = url.searchParams.get('skillName');
      if (!skillName) return NextResponse.json({ success: false, error: '缺少 skillName' }, { status: 400 });
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
      const points = await skillEvaluatorService.getSkillTrend(skillName, limit);
      return NextResponse.json({ success: true, data: { skillName, points, total: points.length } });
    }

    if (action === 'issue-top') {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
      const items = await skillEvaluatorService.getIssueTopN(limit);
      return NextResponse.json({ success: true, data: { items, total: items.length } });
    }

    if (action === 'export') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限导出报告' }, { status: 403 });
      }
      const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 100)));
      const reports = await skillEvaluatorService.getEvaluationReports(limit);
      return NextResponse.json({ success: true, data: { exportedAt: new Date().toISOString(), reports } });
    }

    if (action === 'run-status') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限访问运行状态' }, { status: 403 });
      }
      const runId = url.searchParams.get('runId');
      if (!runId) return NextResponse.json({ success: false, error: '缺少 runId' }, { status: 400 });
      const run = await skillEvaluatorService.getRunStatus(runId);
      if (!run) return NextResponse.json({ success: false, error: '运行记录不存在' }, { status: 404 });
      return NextResponse.json({ success: true, data: run });
    }
    
    if (action === 'status') {
      const status = skillEvaluatorService.getSystemStatus();
      return NextResponse.json({ success: true, data: status });
    }

    if (action === 'skills') {
      const type = url.searchParams.get('type') || undefined;
      const status = (url.searchParams.get('status') as 'active' | 'archived' | 'all' | null) || 'all';
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 30);
      const data = await skillEvaluatorService.listSkills({ type, status, page, pageSize });
      return NextResponse.json({ success: true, data });
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
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限发起评估' }, { status: 403 });
      }
      const { skillPath, skillName } = body;
      
      if (!skillPath) {
        return NextResponse.json({ success: false, error: '缺少技能路径参数' }, { status: 400 });
      }
      
      const run = await skillEvaluatorService.createEvaluationRun(skillPath, skillName);
      return NextResponse.json({ success: true, data: run });
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
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限删除报告' }, { status: 403 });
      }
      const { reportId } = body;
      
      if (!reportId) {
        return NextResponse.json({ success: false, error: '缺少报告ID参数' }, { status: 400 });
      }
      
      const deleted = await skillEvaluatorService.deleteReport(reportId);
      return NextResponse.json({ success: true, data: { deleted } });
    }

    if (action === 'create-skill') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限新增技能' }, { status: 403 });
      }
      const { skillName, relativePath, template, evaluateNow } = body;
      if (!skillName) {
        return NextResponse.json({ success: false, error: '缺少 skillName' }, { status: 400 });
      }
      const out = await skillEvaluatorService.createSkill({ skillName, relativePath, template, evaluateNow });
      return NextResponse.json({ success: true, data: out });
    }

    if (action === 'delete-skill') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限删除技能' }, { status: 403 });
      }
      const { skillPath, hardDelete } = body;
      if (!skillPath) {
        return NextResponse.json({ success: false, error: '缺少 skillPath' }, { status: 400 });
      }
      const out = await skillEvaluatorService.deleteSkill({ skillPath, hardDelete });
      return NextResponse.json({ success: true, data: out });
    }

    if (action === 'merge-skills') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: '无权限合并技能' }, { status: 403 });
      }
      const { sourceSkillPaths, targetSkillPath } = body;
      if (!Array.isArray(sourceSkillPaths) || sourceSkillPaths.length === 0) {
        return NextResponse.json({ success: false, error: '缺少 sourceSkillPaths' }, { status: 400 });
      }
      if (!targetSkillPath || typeof targetSkillPath !== 'string') {
        return NextResponse.json({ success: false, error: '缺少 targetSkillPath' }, { status: 400 });
      }
      const out = await skillEvaluatorService.mergeSkills({ sourceSkillPaths, targetSkillPath });
      return NextResponse.json({ success: true, data: out });
    }
    
    return NextResponse.json({ success: false, error: '不支持的操作' }, { status: 400 });
  } catch (error) {
    console.error('技能评估API POST错误:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}
