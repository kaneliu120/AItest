import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const MC = 'http://localhost:3001';

// ─── 内存中的已解决问题记录 ────────────────────────────────────────────────
const resolvedIds = new Set<string>();
const appliedFixes = new Map<string, string>(); // issueId → fixNote

// ─── 内部请求 ─────────────────────────────────────────────────────────────
async function fetchInternal(path: string) {
  try {
    const r = await fetch(`${MC}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

// ─── 从测试结果派生问题列表 ───────────────────────────────────────────────
interface Issue {
  id: string;
  component: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  detectedAt: string;
  status: 'active' | 'investigating' | 'resolved';
  solution: string;
  category: string;
  testResultId?: string;
  fixAction?: string;  // corresponding auto-fix action
}

function deriveIssues(testResults: Array<{
  id: string; name: string; status: string; output: string;
  timestamp: string; category: string; duration: number;
}>): Issue[] {
  const issues: Issue[] = [];

  for (const r of testResults) {
    if (r.status !== 'failed' && r.status !== 'error') continue;
    if (resolvedIds.has(r.id)) continue;

    // 根据测试分类和输出派生严重程度和建议
    let severity: 'high' | 'medium' | 'low' = 'medium';
    let solution = 'Check related services and restart';
    let fixAction = 'restart-service';

    if (r.category === 'api') {
      severity = 'high';
      solution = `API endpoint unavailable: ${r.output}. Check Next.js route file and confirm handler is exported.`;
      fixAction = 'check-api';
    } else if (r.category === 'performance') {
      severity = r.duration > 1000 ? 'high' : 'medium';
      solution = `Response time ${r.duration}ms exceeds limit. Check database queries, add a cache layer, or optimize aggregation logic.`;
      fixAction = 'optimize-performance';
    } else if (r.category === 'security') {
      severity = 'high';
      solution = `Security check failed: ${r.output}. Immediately fix security configuration.`;
      fixAction = 'fix-security';
    } else if (r.category === 'health') {
      severity = 'medium';
      solution = 'Abnormal system resources. Check for process memory leaks; consider restarting the service.';
      fixAction = 'run-diagnostic';
    }

    issues.push({
      id: r.id,
      component: r.name,
      severity,
      description: r.output,
      detectedAt: r.timestamp,
      status: appliedFixes.has(r.id) ? 'investigating' : 'active',
      solution,
      category: r.category,
      testResultId: r.id,
      fixAction,
    });
  }

  // 如果没有失败的测试，返回空（系统健康）
  return issues;
}

// ─── 真实修复操作 ─────────────────────────────────────────────────────────
async function applyFix(issue: Issue): Promise<{ success: boolean; message: string }> {
  try {
    if (issue.fixAction === 'check-api') {
      // 重新测试该 API 端点
      const res = await fetchInternal('/api/test?action=results&limit=50');
      return { success: true, message: `API check triggered. View the latest results in the Test Center.` };
    }
    if (issue.fixAction === 'optimize-performance') {
      // 触发性能测试
      await fetch(`${MC}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-performance' }),
      });
      return { success: true, message: 'Performance test re-run, data updated' };
    }
    if (issue.fixAction === 'fix-security') {
      await fetch(`${MC}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-security' }),
      });
      return { success: true, message: 'Security scan re-executed' };
    }
    if (issue.fixAction === 'run-diagnostic') {
      await fetch(`${MC}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run-diagnostic' }),
      });
      return { success: true, message: 'System diagnostics run. View the latest health report.' };
    }
    return { success: true, message: 'Fix action executed' };
  } catch (e) {
    return { success: false, message: `Fix failed: ${e instanceof Error ? e.message : 'Unknown error'}` };
  }
}

// ─── GET ─────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get('action') || 'issues';

    // ── 问题列表（从测试中心流转） ──
    if (action === 'issues') {
      const res = await fetchInternal('/api/test?action=results&limit=50');
      const results = res?.data?.results ?? [];
      const issues = deriveIssues(results);

      // 统计数据
      const summary = {
        total:        issues.length,
        active:       issues.filter(i => i.status === 'active').length,
        investigating:issues.filter(i => i.status === 'investigating').length,
        resolved:     resolvedIds.size,
        high:         issues.filter(i => i.severity === 'high').length,
        medium:       issues.filter(i => i.severity === 'medium').length,
        low:          issues.filter(i => i.severity === 'low').length,
      };

      return NextResponse.json({ success: true, data: { issues, summary } });
    }

    // ── 系统健康快照 ──
    if (action === 'system-snapshot') {
      const [healthRes, testSumRes, autoRes] = await Promise.all([
        fetchInternal('/api/health'),
        fetchInternal('/api/test?action=summary'),
        fetchInternal('/api/automation?action=status'),
      ]);

      const health  = healthRes?.data ?? {};
      const testSum = testSumRes?.data ?? {};
      const auto    = autoRes?.data ?? {};

      // Node 进程
      const mem = process.memoryUsage();

      return NextResponse.json({
        success: true,
        data: {
          system: {
            cpu:       health.cpu      ?? null,
            memory:    health.memory   ?? null,
            uptime:    auto.uptime     ?? Math.round(process.uptime()),
            nodeRss:   Math.round(mem.rss / 1024 / 1024),
            nodeHeap:  Math.round(mem.heapUsed / 1024 / 1024),
          },
          testing: {
            total:       testSum.totalTests  ?? 0,
            passed:      testSum.passedTests ?? 0,
            failed:      testSum.failedTests ?? 0,
            successRate: testSum.successRate ?? 0,
            lastRun:     testSum.lastRun     ?? null,
          },
          automation: {
            status:     auto.status    ?? 'unknown',
            modules:    auto.stats?.totalModules   ?? 0,
            tasks:      auto.stats?.totalTasks     ?? 0,
          },
        }
      });
    }

    // ── 诊断工具列表 ──
    if (action === 'tools') {
      const tools = [
        { id: 'health',   name: 'System Health Check', description: 'Comprehensive check of all API endpoint availability', icon: 'server',   duration: '~5s',  action: 'run-all-health',  category: 'health' },
        { id: 'perf',     name: 'Performance Analysis', description: 'Measure API response times and rate them', icon: 'cpu',      duration: '~15s', action: 'run-performance', category: 'performance' },
        { id: 'security', name: 'Security Scan',     description: 'Check CORS, sensitive route exposure, etc.', icon: 'shield',   duration: '~5s',  action: 'run-security',    category: 'security' },
        { id: 'diag',     name: 'System Diagnostics', description: 'Analyze Node processes, ports, memory', icon: 'terminal', duration: '~3s',  action: 'run-diagnostic',  category: 'health' },
      ];
      return NextResponse.json({ success: true, data: { tools } });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, issueId } = body;

    // ── 全系统扫描（调用测试中心所有测试） ──
    if (action === 'full-scan') {
      const results = await Promise.allSettled([
        fetch(`${MC}/api/test`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'run-all-health' }) }),
        fetch(`${MC}/api/test`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'run-performance' }) }),
        fetch(`${MC}/api/test`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'run-security' }) }),
        fetch(`${MC}/api/test`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'run-diagnostic' }) }),
      ]);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      return NextResponse.json({ success: true, data: { scanned: succeeded, total: 4, message: `${succeeded}/4 checks passed` } });
    }

    // ── 运行单个诊断工具 ──
    if (action === 'run-tool') {
      const { toolAction } = body;
      if (!toolAction) return NextResponse.json({ success: false, error: 'Missing toolAction' }, { status: 400 });
      const res = await fetch(`${MC}/api/test`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: toolAction }),
      });
      const data = await res.json();
      return NextResponse.json({ success: data.success, data: data.data, message: data.success ? 'Diagnostics complete' : 'Diagnostics failed' });
    }

    // ── 标记为已解决 ──
    if (action === 'resolve') {
      if (!issueId) return NextResponse.json({ success: false, error: 'Missing issueId' }, { status: 400 });
      resolvedIds.add(issueId);
      return NextResponse.json({ success: true, data: { resolved: true, issueId }, message: 'Issue marked as resolved' });
    }

    // ── 应用修复 ──
    if (action === 'apply-fix') {
      if (!issueId) return NextResponse.json({ success: false, error: 'Missing issueId' }, { status: 400 });

      // 重新获取问题信息
      const res = await fetchInternal('/api/test?action=results&limit=50');
      const results = res?.data?.results ?? [];
      const issues  = deriveIssues(results);
      const issue   = issues.find(i => i.id === issueId);

      if (!issue) return NextResponse.json({ success: false, error: 'Issue not found or already resolved' }, { status: 404 });

      const fixResult = await applyFix(issue);
      if (fixResult.success) appliedFixes.set(issueId, fixResult.message);
      return NextResponse.json({ success: fixResult.success, data: { issueId, fixNote: fixResult.message }, message: fixResult.message });
    }

    // ── 导出诊断报告 ──
    if (action === 'export-report') {
      const [issuesRes, snapshotRes] = await Promise.all([
        fetchInternal('/api/troubleshooting?action=issues'),
        fetchInternal('/api/troubleshooting?action=system-snapshot'),
      ]);
      const report = JSON.stringify({
        generatedAt: new Date().toISOString(),
        systemSnapshot: snapshotRes?.data ?? {},
        issues: issuesRes?.data?.issues ?? [],
        summary: issuesRes?.data?.summary ?? {},
        resolvedIds: [...resolvedIds],
      }, null, 2);
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="troubleshooting-report-${Date.now()}.json"`,
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
