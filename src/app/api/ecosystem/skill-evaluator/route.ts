import { skillEvaluatorservervice } from '@/lib/skill-evaluator-service';
import { isWorkflowAdminAuthorized } from '@/lib/auth/workflow-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await skillEvaluatorservervice.getEvaluationStats();
      return NextResponse.json({ success: true, data: stats });
    }
    
    if (action === 'reports') {
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
      const grade = url.searchParams.get('grade') || undefined;
      const minScore = url.searchParams.get('minScore');
      const hours = url.searchParams.get('hours');
      const reports = await skillEvaluatorservervice.getEvaluationReports(limit, {
        grade,
        minScore: minScore ? Number(minScore) : undefined,
        hours: hours ? Number(hours) : undefined,
      });
      return NextResponse.json({ success: true, data: { reports, total: reports.length } });
    }

    if (action === 'skill-trend') {
      const skillName = url.searchParams.get('skillName');
      if (!skillName) return NextResponse.json({ success: false, error: 'Missing skillName' }, { status: 400 });
      const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || 50)));
      const points = await skillEvaluatorservervice.getSkillTrend(skillName, limit);
      return NextResponse.json({ success: true, data: { skillName, points, total: points.length } });
    }

    if (action === 'issue-top') {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
      const items = await skillEvaluatorservervice.getIssueTopN(limit);
      return NextResponse.json({ success: true, data: { items, total: items.length } });
    }

    if (action === 'export') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to export report' }, { status: 403 });
      }
      const limit = Math.min(500, Math.max(1, Number(url.searchParams.get('limit') || 100)));
      const reports = await skillEvaluatorservervice.getEvaluationReports(limit);
      return NextResponse.json({ success: true, data: { exportedAt: new Date().toISOString(), reports } });
    }

    if (action === 'run-status') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to access run status' }, { status: 403 });
      }
      const runId = url.searchParams.get('runId');
      if (!runId) return NextResponse.json({ success: false, error: 'Missing runId' }, { status: 400 });
      const run = await skillEvaluatorservervice.getRunStatus(runId);
      if (!run) return NextResponse.json({ success: false, error: 'Run record does not exist' }, { status: 404 });
      return NextResponse.json({ success: true, data: run });
    }
    
    if (action === 'status') {
      const status = skillEvaluatorservervice.getSystemStatus();
      return NextResponse.json({ success: true, data: status });
    }

    if (action === 'skills') {
      const type = url.searchParams.get('type') || undefined;
      const status = (url.searchParams.get('status') as 'active' | 'archived' | 'all' | null) || 'all';
      const page = Number(url.searchParams.get('page') || 1);
      const pageSize = Number(url.searchParams.get('pageSize') || 30);
      const data = await skillEvaluatorservervice.listSkills({ type, status, page, pageSize });
      return NextResponse.json({ success: true, data });
    }
    
    // Default返回Statistics
    const stats = await skillEvaluatorservervice.getEvaluationStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Skill evaluation API error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'evaluate';
    
    if (action === 'evaluate') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to initiate assessment' }, { status: 403 });
      }
      const { skillPath, skillName } = body;
      
      if (!skillPath) {
        return NextResponse.json({ success: false, error: 'Missing skill path parameter' }, { status: 400 });
      }
      
      const run = await skillEvaluatorservervice.createEvaluationRun(skillPath, skillName);
      return NextResponse.json({ success: true, data: run });
    }
    
    if (action === 'get-report') {
      const { reportId } = body;
      
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'Missing report ID parameter' }, { status: 400 });
      }
      
      const report = await skillEvaluatorservervice.getReportDetails(reportId);
      
      if (!report) {
        return NextResponse.json({ success: false, error: 'Reportdoes not exist' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, data: report });
    }
    
    if (action === 'delete-report') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to delete report' }, { status: 403 });
      }
      const { reportId } = body;
      
      if (!reportId) {
        return NextResponse.json({ success: false, error: 'Missing report ID parameter' }, { status: 400 });
      }
      
      const deleted = await skillEvaluatorservervice.deleteReport(reportId);
      return NextResponse.json({ success: true, data: { deleted } });
    }

    if (action === 'create-skill') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to add skill' }, { status: 403 });
      }
      const { skillName, relativePath, template, evaluateNow } = body;
      if (!skillName) {
        return NextResponse.json({ success: false, error: 'Missing skillName' }, { status: 400 });
      }
      const out = await skillEvaluatorservervice.createSkill({ skillName, relativePath, template, evaluateNow });
      return NextResponse.json({ success: true, data: out });
    }

    if (action === 'delete-skill') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to delete skill' }, { status: 403 });
      }
      const { skillPath, hardDelete } = body;
      if (!skillPath) {
        return NextResponse.json({ success: false, error: 'Missing skillPath' }, { status: 400 });
      }
      const out = await skillEvaluatorservervice.deleteSkill({ skillPath, hardDelete });
      return NextResponse.json({ success: true, data: out });
    }

    if (action === 'merge-skills') {
      if (!isWorkflowAdminAuthorized(request)) {
        return NextResponse.json({ success: false, error: 'No permission to merge skills' }, { status: 403 });
      }
      const { sourceSkillPaths, targetSkillPath } = body;
      if (!Array.isArray(sourceSkillPaths) || sourceSkillPaths.length === 0) {
        return NextResponse.json({ success: false, error: 'Missing sourceSkillPaths' }, { status: 400 });
      }
      if (!targetSkillPath || typeof targetSkillPath !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing targetSkillPath' }, { status: 400 });
      }
      const out = await skillEvaluatorservervice.mergeSkills({ sourceSkillPaths, targetSkillPath });
      return NextResponse.json({ success: true, data: out });
    }
    
    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('Skill evaluation API POST error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
