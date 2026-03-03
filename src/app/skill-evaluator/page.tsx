'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, RefreshCw, Clock, Shield, TrendingUp } from 'lucide-react';

type EvalStats = {
  status: string;
  version: string;
  uptime: string;
  lastEvaluation: string;
  totalEvaluations: number;
  averageScore: number;
  grade: string;
  recentReports: Array<{ id: string; name: string; score: number; grade: string; timestamp: string }>;
};

type ManagedSkill = {
  skillName: string;
  skillPath: string;
  type: string;
  status: 'active' | 'archived';
  hasSkillMd: boolean;
  lastScore?: number;
  lastGrade?: string;
  lastEvaluationAt?: string;
  mergedInto?: string;
  mergedAt?: string;
};

type EvalReport = {
  id: string;
  skillName: string;
  skillPath: string;
  overallScore: number;
  grade: string;
  evaluationDate: string;
  recommendations: string[];
  issues: string[];
};

type TrendPoint = {
  id: string;
  score: number;
  grade: string;
  timestamp: string;
};

export default function SkillEvaluatorPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EvalStats | null>(null);
  const [reports, setReports] = useState<EvalReport[]>([]);
  const [skills, setSkills] = useState<ManagedSkill[]>([]);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [selectedType, setSelectedType] = useState<string>('all');
  const [skillsPage, setSkillsPage] = useState(1);
  const [skillsTotal, setSkillsTotal] = useState(0);
  const [skillsTotalPages, setSkillsTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [batchArchiveMode, setBatchArchiveMode] = useState(false);
  const [batchArchiveSelected, setBatchArchiveSelected] = useState<Record<string, boolean>>({});
  const [showEvaluateModal, setShowEvaluateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeType, setMergeType] = useState('all');
  const [mergeSourceInput, setMergeSourceInput] = useState('');
  const [mergeTargetInput, setMergeTargetInput] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [skillPath, setSkillPath] = useState('');
  const [skillName, setSkillName] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillRelPath, setNewSkillRelPath] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [mergeSubmitting, setMergeSubmitting] = useState(false);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [batchEvalProgress, setBatchEvalProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [batchEvalFailedItems, setBatchEvalFailedItems] = useState<Array<{ skillName: string; skillPath: string; reason: string }>>([]);
  const [showBatchEvalSummary, setShowBatchEvalSummary] = useState(false);
  const [copyingFailed, setCopyingFailed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async (opts?: { page?: number; type?: string; status?: 'all' | 'active' | 'archived' }) => {
    setLoading(true);
    setError('');
    const page = opts?.page || skillsPage;
    const type = opts?.type ?? selectedType;
    const status = opts?.status ?? statusFilter;

    try {
      const [s, r, m] = await Promise.all([
        fetch('/api/ecosystem/skill-evaluator?action=stats').then((x) => x.json()),
        fetch('/api/ecosystem/skill-evaluator?action=reports&limit=30').then((x) => x.json()),
        fetch(`/api/ecosystem/skill-evaluator?action=skills&page=${page}&pageSize=30&type=${encodeURIComponent(type)}&status=${status}`).then((x) => x.json()),
      ]);
      if (s.success) setStats(s.data);
      if (r.success) {
        const list = r.data.reports || [];
        setReports(list);
        if (!selectedSkill && list.length > 0) {
          setSelectedSkill(list[0].skillName);
        }
      }
      if (m.success) {
        setSkills(m.data.skills || []);
        setTypeCounts(m.data.typeCounts || {});
        setSkillsTotal(Number(m.data.total || 0));
        setSkillsPage(Number(m.data.page || 1));
        setSkillsTotalPages(Number(m.data.totalPages || 1));
      }
      if (!s.success || !r.success || !m.success) setError(s.error || r.error || m.error || 'Load failed');
    } catch (e: any) {
      setError(e?.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  const loadTrend = async (skillName: string) => {
    if (!skillName) {
      setTrend([]);
      return;
    }
    try {
      const resp = await fetch(`/api/ecosystem/skill-evaluator?action=skill-trend&skillName=${encodeURIComponent(skillName)}&limit=20`).then((x) => x.json());
      if (resp.success) setTrend(resp.data.points || []);
    } catch {
      setTrend([]);
    }
  };

  const createSkill = async () => {
    if (!newSkillName.trim()) {
      setError('Please fill in new Skill Name');
      return false;
    }
    setCreateSubmitting(true);
    try {
      const resp = await fetch('/api/ecosystem/skill-evaluator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-skill',
          skillName: newSkillName.trim(),
          relativePath: newSkillRelPath.trim() || undefined,
          evaluateNow: true,
        }),
      }).then((x) => x.json());
      if (!resp.success) {
        setError(resp.error || 'Add SkillFailed');
        return false;
      }
      setNewSkillName('');
      setNewSkillRelPath('');
      setShowCreateModal(false);
      setSuccess('Add SkillSuccess');
      await loadData();
      return true;
    } catch (e: any) {
      setError(e?.message || 'Add SkillFailed');
      return false;
    } finally {
      setCreateSubmitting(false);
    }
  };

  const deleteSkill = async (skillPathToDelete: string) => {
    try {
      const resp = await fetch('/api/ecosystem/skill-evaluator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-skill', skillPath: skillPathToDelete, hardDelete: false }),
      }).then((x) => x.json());
      if (!resp.success) {
        setError(resp.error || 'DeleteSkillFailed');
        return;
      }
      setSuccess('Delete Skill/Archive successful');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'DeleteSkillFailed');
    }
  };

  const batchArchiveSkills = async () => {
    const selected = Object.keys(batchArchiveSelected).filter((k) => batchArchiveSelected[k]);
    if (selected.length === 0) {
      setError('Please select Skills to archive first');
      return;
    }

    try {
      for (const skillPath of selected) {
        const resp = await fetch('/api/ecosystem/skill-evaluator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete-skill', skillPath, hardDelete: false }),
        }).then((x) => x.json());
        if (!resp.success) throw new Error(resp.error || `Archive failed: ${skillPath}`);
      }
      setBatchArchiveMode(false);
      setBatchArchiveSelected({});
      setSuccess('Batch Archive complete');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Batch archive failed');
    }
  };

  const runBatchEvaluation = async (selected: ManagedSkill[]) => {
    const concurrency = 3;
    setBatchEvaluating(true);
    setBatchEvalProgress({ done: 0, total: selected.length });
    setBatchEvalFailedItems([]);
    setShowBatchEvalSummary(false);
    setError('');

    let done = 0;
    const failed: Array<{ skillName: string; skillPath: string; reason: string }> = [];

    try {
      for (let i = 0; i < selected.length; i += concurrency) {
        const chunk = selected.slice(i, i + concurrency);
        const results = await Promise.all(
          chunk.map(async (s) => {
            try {
              const resp = await fetch('/api/ecosystem/skill-evaluator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'evaluate', skillPath: s.skillPath, skillName: s.skillName }),
              }).then((x) => x.json());

              if (!resp.success) {
                return { ok: false as const, skillName: s.skillName, skillPath: s.skillPath, reason: resp.error || 'Unknown error' };
              }

              return { ok: true as const, skillName: s.skillName, skillPath: s.skillPath };
            } catch (e: any) {
              return { ok: false as const, skillName: s.skillName, skillPath: s.skillPath, reason: e?.message || 'Network error' };
            }
          })
        );

        results.forEach((r) => {
          if (!r.ok) failed.push({ skillName: r.skillName, skillPath: r.skillPath, reason: r.reason });
        });

        done += results.length;
        setBatchEvalProgress({ done, total: selected.length });
      }

      setBatchEvalFailedItems(failed);
      setShowBatchEvalSummary(true);

      const successCount = selected.length - failed.length;
      if (failed.length === 0) {
        setSuccess(`Batch assessment submitted(${successCount}/${selected.length})`);
      } else {
        setError(`Batch assessment partially failed: Success ${successCount}, Failed ${failed.length}`);
      }

      await loadData();
    } finally {
      setBatchEvaluating(false);
    }
  };

  const batchEvaluateSkills = async () => {
    const selected = skills.filter((s) => batchArchiveSelected[s.skillPath] && s.status === 'active');
    if (selected.length === 0) {
      setError('Please select active Skills to assess first');
      return;
    }

    await runBatchEvaluation(selected);
  };

  const retryFailedBatchEvaluations = async () => {
    if (batchEvalFailedItems.length === 0) return;

    const failedPathSet = new Set(batchEvalFailedItems.map((x) => x.skillPath));
    const retryTargets = skills.filter((s) => s.status === 'active' && failedPathSet.has(s.skillPath));
    if (retryTargets.length === 0) {
      setError('No failed skills to retry (may have been deleted or renamed)');
      return;
    }

    await runBatchEvaluation(retryTargets);
  };

  const copyFailedDetails = async () => {
    if (batchEvalFailedItems.length === 0) return;
    const payload = batchEvalFailedItems
      .map((item, idx) => `${idx + 1}. ${item.skillName} | ${item.skillPath} | ${item.reason}`)
      .join('\n');

    try {
      setCopyingFailed(true);
      await navigator.clipboard.writeText(payload);
      setSuccess('Failure details copied to clipboard');
    } catch {
      setError('Copy failed, Please copy details manually');
    } finally {
      setCopyingFailed(false);
    }
  };

  const mergeSkills = async () => {
    const sourceSkillPaths = mergeSourceInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!mergeTargetInput.trim() || sourceSkillPaths.length === 0) {
      setError('Please enter in the dialog source list and target Path');
      return false;
    }
    setMergeSubmitting(true);
    try {
      const resp = await fetch('/api/ecosystem/skill-evaluator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'merge-skills', sourceSkillPaths, targetSkillPath: mergeTargetInput.trim() }),
      }).then((x) => x.json());
      if (!resp.success) {
        setError(resp.error || 'Merge failed');
        return false;
      }
      setShowMergeModal(false);
      setMergeSourceInput('');
      setMergeTargetInput('');
      setSuccess('Skills merged successfully');
      await loadData();
      return true;
    } catch (e: any) {
      setError(e?.message || 'Merge failed');
      return false;
    } finally {
      setMergeSubmitting(false);
    }
  };

  const startEvaluation = async (input?: { skillPath?: string; skillName?: string }) => {
    const pathToEval = (input?.skillPath ?? skillPath).trim();
    const nameToEval = (input?.skillName ?? skillName).trim();

    if (!pathToEval) {
      setError('Please fill in Skill Path');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const resp = await fetch('/api/ecosystem/skill-evaluator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate', skillPath: pathToEval, skillName: nameToEval || undefined }),
      }).then((x) => x.json());

      if (!resp.success) {
        setError(resp.error || 'Failed to start assessment');
        return;
      }
      setSuccess('Assessment task submitted');
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Failed to start assessment');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedSkill) loadTrend(selectedSkill);
  }, [selectedSkill]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 2200);
    return () => clearTimeout(t);
  }, [success]);

  const quality = useMemo(() => {
    const high = reports.filter((r) => r.overallScore >= 80).length;
    const medium = reports.filter((r) => r.overallScore >= 60 && r.overallScore < 80).length;
    const low = reports.filter((r) => r.overallScore < 60).length;
    return { high, medium, low };
  }, [reports]);

  const mergeTargetCandidates = useMemo(() => {
    return skills.filter((s) => s.status === 'active' && (mergeType === 'all' || s.type === mergeType));
  }, [skills, mergeType]);

  const trendSummary = useMemo(() => {
    if (trend.length < 2) return 'Insufficient samples, Unable to determine trend';
    const latest = trend[0];
    const prev = trend[1];
    const diff = latest.score - prev.score;
    if (Math.abs(diff) < 1) return `Last two scores roughly equal(${latest.score} vs ${prev.score})`;
    return diff > 0
      ? `Latest score improved from last ${diff.toFixed(1)} points`
      : `Latest score decreased from last ${Math.abs(diff).toFixed(1)} points`;
  }, [trend]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-3" />
            <p className="text-slate-500">Loading Skill Assessment data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl tracking-tight font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="h-7 w-7 text-blue-600" /> Skill Management
            </h1>
            <p className="text-slate-500 mt-1">Add Skill, Delete, Assessment, Integrated trend analysis</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowCreateModal(true)} className="rounded-lg bg-blue-600 hover:bg-blue-700">Add Skill</Button>
            <Button onClick={() => setShowMergeModal(true)} variant="outline" className="rounded-lg">MergeSkill</Button>
            <Button variant="outline" className="rounded-lg" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">{success}</div>}


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Average Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats?.averageScore ?? 0}</div>
              <Progress value={stats?.averageScore ?? 0} className="mt-3" />
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Total Assessments</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-slate-900">{stats?.totalEvaluations ?? 0}</div></CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">Quality Distribution</CardTitle></CardHeader>
            <CardContent className="text-sm text-slate-700 space-y-1">
              <div>High Quality: <span className="font-semibold text-green-600">{quality.high}</span></div>
              <div>Medium Quality: <span className="font-semibold text-amber-600">{quality.medium}</span></div>
              <div>Low Quality: <span className="font-semibold text-red-600">{quality.low}</span></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">System Status</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700"><Shield className="w-4 h-4" /> {stats?.status || 'unknown'}</div>
              <div className="flex items-center gap-2 text-slate-500"><Clock className="w-4 h-4" /> {stats?.uptime || '-'}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle>Installed Skill Management</CardTitle>
                <CardDescription>Type Filter + Status Filter + Pagination + Merge + Batch Archive</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant={statusFilter === 'all' ? 'default' : 'outline'} className="rounded-lg" onClick={() => { setStatusFilter('all'); setSkillsPage(1); loadData({ page: 1, status: 'all' }); }}>All Status</Button>
                <Button size="sm" variant={statusFilter === 'active' ? 'default' : 'outline'} className="rounded-lg" onClick={() => { setStatusFilter('active'); setSkillsPage(1); loadData({ page: 1, status: 'active' }); }}>Show only active</Button>
                <Button size="sm" variant={statusFilter === 'archived' ? 'default' : 'outline'} className="rounded-lg" onClick={() => { setStatusFilter('archived'); setSkillsPage(1); loadData({ page: 1, status: 'archived' }); }}>Show only archived</Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setBatchArchiveMode(v => !v)}>{batchArchiveMode ? 'Exit Batch Archive' : 'Batch Archive Mode'}</Button>
                {batchArchiveMode && (
                  <>
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={batchEvaluateSkills} disabled={batchEvaluating}>
                      {batchEvaluating
                        ? `Batch assessment in progress... ${batchEvalProgress.done}/${batchEvalProgress.total}`
                        : 'Execute Batch Assessment'}
                    </Button>
                    <Button size="sm" className="rounded-lg" onClick={batchArchiveSkills}>Execute Batch Archive</Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" variant={selectedType === 'all' ? 'default' : 'outline'} className="rounded-lg" onClick={() => { setSelectedType('all'); setSkillsPage(1); loadData({ page: 1, type: 'all' }); }}>All({Object.values(typeCounts).reduce((a, b) => a + b, 0)})</Button>
              {Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => (
                <Button key={t} size="sm" variant={selectedType === t ? 'default' : 'outline'} className="rounded-lg" onClick={() => { setSelectedType(t); setSkillsPage(1); loadData({ page: 1, type: t }); }}>
                  {t} ({c})
                </Button>
              ))}
            </div>
            {batchEvaluating && batchEvalProgress.total > 0 && (
              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                  <span>Batch Assessment Progress</span>
                  <span>{batchEvalProgress.done}/{batchEvalProgress.total}</span>
                </div>
                <Progress value={(batchEvalProgress.done / batchEvalProgress.total) * 100} className="h-2" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {skills.length === 0 ? (
              <div className="text-sm text-slate-500">No skill data available</div>
            ) : (
              <div className="space-y-3">
                {skills.map((s) => (
                  <div key={s.skillPath} className="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">{s.skillName}</div>
                      <div className="text-xs text-slate-500 break-all">{s.skillPath}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">Type {s.type}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.status}
                        </span>
                        {typeof s.lastScore === 'number' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[11px] text-blue-700">
                            Score {s.lastScore} ({s.lastGrade || '-'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">No Score</span>
                        )}
                      </div>
                      {s.lastEvaluationAt && (
                        <div className="text-[11px] text-slate-500 mt-1">Last Assessment: {new Date(s.lastEvaluationAt).toLocaleString()}</div>
                      )}
                      {s.mergedInto && <div className="text-xs text-amber-600 mt-1">Merged into: {s.mergedInto}</div>}
                    </div>
                    <div className="flex gap-2 items-center">
                      {batchArchiveMode && s.status === 'active' && (
                        <input type="checkbox" checked={!!batchArchiveSelected[s.skillPath]} onChange={(e) => setBatchArchiveSelected(prev => ({ ...prev, [s.skillPath]: e.target.checked }))} />
                      )}

                      <Button size="sm" className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => { setSelectedSkill(s.skillName); startEvaluation({ skillPath: s.skillPath, skillName: s.skillName }); }}>Assessment</Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => deleteSkill(s.skillPath)}>Delete</Button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm text-slate-600">
                  <div>Page {skillsPage}/{skillsTotalPages}  · Total {skillsTotal} items(Per page30)</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-lg" disabled={skillsPage <= 1} onClick={() => loadData({ page: skillsPage - 1 })}>Previous</Button>
                    <Button size="sm" variant="outline" className="rounded-lg" disabled={skillsPage >= skillsTotalPages} onClick={() => loadData({ page: skillsPage + 1 })}>Next</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" /> Skill Trend</CardTitle>
                <CardDescription>View single skill score history</CardDescription>
              </div>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {Array.from(new Set(reports.map((r) => r.skillName))).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <div className="text-sm text-slate-500">No trend data</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                  <div className="text-xs text-blue-700">Latest Score</div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-sm font-semibold text-blue-900">
                      {trend[0].score} ({trend[0].grade})
                    </div>
                    <div className="text-[11px] text-blue-700">{new Date(trend[0].timestamp).toLocaleString('zh-CN')}</div>
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1">{trendSummary}</div>
                </div>

                {trend.slice(0, 8).map((p) => (
                  <div key={p.id}>
                    <div className="flex justify-between text-xs mb-1 text-slate-600">
                      <span>{new Date(p.timestamp).toLocaleString('zh-CN')}</span>
                      <span>{p.score} ({p.grade})</span>
                    </div>
                    <Progress value={p.score} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showEvaluateModal && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Start Skill Assessment</h3>
              <input value={skillPath} onChange={(e) => setSkillPath(e.target.value)} placeholder="Skill Path (absolute path)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Skill Name(Optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-lg" onClick={() => setShowEvaluateModal(false)}>Cancel</Button>
                <Button className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={async () => { await startEvaluation(); setShowEvaluateModal(false); }} disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</Button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Add Skill</h3>
              <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} placeholder="New Skill Name (Required)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <input value={newSkillRelPath} onChange={(e) => setNewSkillRelPath(e.target.value)} placeholder="Relative Path (Optional, e.g. development/programming)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    if (createSubmitting) return;
                    setShowCreateModal(false);
                  }}
                  disabled={createSubmitting}
                >Cancel</Button>
                <Button className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={createSkill} disabled={createSubmitting}>
                  {createSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showMergeModal && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Merge Skills (same type)</h3>
              <select value={mergeType} onChange={(e) => setMergeType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="all">Select Type (Optional)</option>
                {Object.keys(typeCounts).sort().map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <textarea value={mergeSourceInput} onChange={(e) => setMergeSourceInput(e.target.value)} placeholder="Source Skill Path (one per line)" className="w-full min-h-[120px] border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              <select value={mergeTargetInput} onChange={(e) => setMergeTargetInput(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Target Skill (target)</option>
                {mergeTargetCandidates.map((s) => (
                  <option key={s.skillPath} value={s.skillPath}>{s.skillName} · {s.type}</option>
                ))}
              </select>
              <div className="text-xs text-slate-500">Tip: source and target must be same type; source: one absolute path per line.</div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => {
                    if (mergeSubmitting) return;
                    setShowMergeModal(false);
                  }}
                  disabled={mergeSubmitting}
                >Cancel</Button>
                <Button className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={mergeSkills} disabled={mergeSubmitting}>
                  {mergeSubmitting ? 'Submitting...' : 'SubmitMerge'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showBatchEvalSummary && (
          <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Batch Assessment Results</h3>
              <div className="text-sm text-slate-700">
                Total <span className="font-semibold">{batchEvalProgress.total}</span>,
                Success <span className="font-semibold text-emerald-700">{batchEvalProgress.total - batchEvalFailedItems.length}</span>, 
                Failed <span className="font-semibold text-red-700">{batchEvalFailedItems.length}</span>
              </div>

              {batchEvalFailedItems.length > 0 && (
                <div className="max-h-64 overflow-auto rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                  {batchEvalFailedItems.map((item, idx) => (
                    <div key={`${item.skillPath}-${idx}`} className="text-xs text-red-700">
                      <span className="font-semibold">{item.skillName}</span>: {item.reason}
                      <div className="text-[11px] text-red-600/80 break-all">{item.skillPath}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {batchEvalFailedItems.length > 0 && (
                  <>
                    <Button variant="outline" className="rounded-lg" onClick={copyFailedDetails} disabled={batchEvaluating || copyingFailed}>
                      {copyingFailed ? 'Copying...' : 'Copy failedDetails'}
                    </Button>
                    <Button variant="outline" className="rounded-lg" onClick={retryFailedBatchEvaluations} disabled={batchEvaluating}>
                      {batchEvaluating ? 'Retrying...' : 'Retry Failed Items'}
                    </Button>
                  </>
                )}
                <Button className="rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => setShowBatchEvalSummary(false)} disabled={batchEvaluating}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
