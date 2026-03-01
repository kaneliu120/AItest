'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WORKFLOW_STAGES, type WorkflowStage } from '@/lib/workflow-constants';

function FinancialDraftStatus({ taskId, stage }: { taskId: string; stage: string }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const j = await fetch(`/api/task-hierarchy/${taskId}/finance-draft`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({ data: null }));
    setDraft(j?.data || null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [taskId, stage]);

  if (loading) return <p className="text-sm text-gray-500">加载中...</p>;
  if (!draft) return <p className="text-sm text-gray-500">暂无财务草稿（阶段需到 invoiced）。</p>;

  return (
    <div className="text-sm space-y-1">
      <p>状态：<span className="font-medium">{draft.status}</span></p>
      <p>金额：₱{Number(draft.amount || 0).toLocaleString()} {draft.currency || 'PHP'}</p>
      <p>说明：{draft.description}</p>
      <p>日期：{draft.tx_date}</p>
    </div>
  );
}

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [data, setData] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resForm, setResForm] = useState({ name: '', resourceType: 'file', url: '', notes: '' });
  const [subForm, setSubForm] = useState({ title: '', level: 3, targetPrice: '' });
  const [uploading, setUploading] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [stageBusy, setStageBusy] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [taskRes, resRes, evtRes] = await Promise.all([
      fetch(`/api/task-hierarchy/${id}`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/task-hierarchy/${id}/resources`, { cache: 'no-store' }).then(r => r.json()),
      fetch(`/api/task-hierarchy/${id}/events`, { cache: 'no-store' }).then(r => r.json()),
    ]);
    setData(taskRes?.data || null);
    setResources(resRes?.data || []);
    setEvents(evtRes?.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const addResource = async () => {
    if (!id || !resForm.name.trim()) return;
    await fetch(`/api/task-hierarchy/${id}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resForm),
    });
    setResForm({ name: '', resourceType: 'file', url: '', notes: '' });
    load();
  };

  const addSubtask = async () => {
    if (!id || !subForm.title.trim()) return;
    await fetch('/api/task-hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: id,
        level: Number(subForm.level),
        title: subForm.title,
        targetPrice: subForm.targetPrice ? Number(subForm.targetPrice) : null,
        status: 'pending',
        progress: 0,
        currency: 'PHP',
      })
    });
    setSubForm({ title: '', level: 3, targetPrice: '' });
    load();
  };

  const updateSubtask = async () => {
    if (!editingSub?.id) return;
    await fetch(`/api/task-hierarchy/${editingSub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editingSub.title,
        status: editingSub.status,
        progress: Number(editingSub.progress || 0),
      })
    });
    setEditingSub(null);
    load();
  };

  const deleteSubtask = async (sid: string) => {
    await fetch(`/api/task-hierarchy/${sid}`, { method: 'DELETE' });
    load();
  };

  const uploadFile = async (f: File) => {
    if (!id || !f) return;
    const fd = new FormData();
    fd.append('file', f);
    setUploading(true);
    await fetch(`/api/task-hierarchy/${id}/upload`, { method: 'POST', body: fd });
    setUploading(false);
    load();
  };

  if (loading) return <div className="p-6">加载中...</div>;
  if (!data?.task) return <div className="p-6 text-red-600">任务不存在</div>;

  const task = data.task;
  const subtasks = data.subtasks || [];

  const stageOrder = [...WORKFLOW_STAGES];
  const stage = ((task.workflowStage || 'draft') as WorkflowStage);
  const stageIndex = stageOrder.indexOf(stage);
  const isDeployAllowed = ['deploy_ready','deployed','invoiced','closed'].includes(stage);
  const isInvoiceAllowed = ['deployed','invoiced','closed'].includes(stage);
  const blockers: string[] = [];
  if (!task.analysisDocUrl) blockers.push('缺少分析文档');
  if (!['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage)) blockers.push('测试未通过');
  if (!isDeployAllowed) blockers.push('未达到可发布阶段');

  const workflowActions: Partial<Record<WorkflowStage, { label: string; endpoint: string; body?: any }[]>> = {
    draft: [{ label: '接受任务', endpoint: 'accept' }],
    accepted: [{ label: '外包确认', endpoint: 'outsource-confirm' }],
    outsource_confirmed: [{ label: '分析完成', endpoint: 'analysis-complete', body: { analysis_doc_url: task.analysisDocUrl || 'https://example.com/analysis-doc.md' } }],
    analysis_done: [{ label: '自动化完成', endpoint: 'automation-complete' }],
    automation_done: [{ label: '测试通过', endpoint: 'test-result', body: { pass: true } }, { label: '测试失败', endpoint: 'test-result', body: { pass: false } }],
    test_failed: [{ label: '进入排障', endpoint: 'set-troubleshooting' }],
    troubleshooting: [{ label: '复测通过', endpoint: 'test-result', body: { pass: true } }],
    test_passed: [{ label: '发布准备', endpoint: 'deploy', body: { readyOnly: true } }],
    deploy_ready: [{ label: '执行发布', endpoint: 'deploy' }],
    deployed: [{ label: '财务入账', endpoint: 'invoice' }],
    invoiced: [],
    closed: [],
  };

  const advance = async (endpoint: string, body?: any, label?: string) => {
    const ok = confirm(`确认执行阶段动作：${label || endpoint} ?`);
    if (!ok) return;
    setStageBusy(true);
    setStageError(null);
    try {
      const res = await fetch(`/api/task-hierarchy/${id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        setStageError(json?.error || `动作失败: ${endpoint}`);
      }
    } catch (e) {
      setStageError(e instanceof Error ? e.message : '阶段推进失败');
    } finally {
      setStageBusy(false);
      load();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <p className="text-sm text-gray-500 mt-1">层级 L{task.level} · 状态 {task.status} · 进度 {task.progress}% · 阶段 {task.workflowStage || 'draft'}</p>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">发布门禁看板</h2>
        <div className="text-sm space-y-1">
          <p>当前阶段：<span className="font-medium">{task.workflowStage || 'draft'}</span></p>
          <p>可发布：<span className={isDeployAllowed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{isDeployAllowed ? '是' : '否'}</span></p>
          <p>流程进度：{Math.max(0, stageIndex) + 1}/{stageOrder.length}</p>
        </div>
        {blockers.length > 0 && (
          <div className="mt-2 text-xs text-red-600">
            阻塞原因：{blockers.join(' / ')}
          </div>
        )}
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">任务信息</h2>
        <div className="text-sm space-y-1">
          <p>描述：{task.description || '—'}</p>
          <p>流程阶段：{task.workflowStage || 'draft'}</p>
          <p>分析文档：{task.analysisDocUrl ? <a className="text-blue-600 underline" href={task.analysisDocUrl} target="_blank">查看</a> : '—'}</p>
          <p>目标价格：{task.targetPrice ?? '—'} {task.currency || 'PHP'}</p>
          <p>负责人：{task.owner || '—'}</p>
          <p>分类：{task.category || '—'}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(workflowActions[stage] || []).map((a) => {
            const disabledByGate = (a.endpoint === 'deploy' && !isDeployAllowed) || (a.endpoint === 'invoice' && !isInvoiceAllowed);
            const reason = a.endpoint === 'deploy' && !isDeployAllowed ? '发布门禁未通过' : a.endpoint === 'invoice' && !isInvoiceAllowed ? '未发布，不能入账' : '';
            return (
              <button
                key={a.label}
                className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                disabled={stageBusy || disabledByGate}
                onClick={() => advance(a.endpoint, a.body, a.label)}
                title={reason || `当前阶段 ${stage} 可执行：${a.label}`}
              >
                {stageBusy ? '处理中...' : a.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          当前阶段可执行动作：{(workflowActions[stage] || []).map(a => a.label).join(' / ') || '无'}
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className={`border rounded px-2 py-1 ${task.analysisDocUrl ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            分析文档：{task.analysisDocUrl ? '已生成' : '未生成'}
          </div>
          <div className={`border rounded px-2 py-1 ${['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage) ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            测试门禁：{['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage) ? '通过' : '未通过'}
          </div>
          <div className={`border rounded px-2 py-1 ${isDeployAllowed ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            发布门禁：{isDeployAllowed ? '可发布' : '不可发布'}
          </div>
          <div className={`border rounded px-2 py-1 ${isInvoiceAllowed ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            财务门禁：{isInvoiceAllowed ? '可入账' : '不可入账'}
          </div>
        </div>
        {stageError && <div className="mt-2 text-xs text-red-600">{stageError}</div>}
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">子任务（{subtasks.length}）</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <input className="border rounded px-2 py-1" placeholder="子任务标题" value={subForm.title} onChange={e => setSubForm({ ...subForm, title: e.target.value })} />
          <select className="border rounded px-2 py-1" value={subForm.level} onChange={e => setSubForm({ ...subForm, level: Number(e.target.value) })}>
            <option value={2}>Level 2</option>
            <option value={3}>Level 3</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="目标价格" value={subForm.targetPrice} onChange={e => setSubForm({ ...subForm, targetPrice: e.target.value })} />
          <button className="border rounded px-2 py-1" onClick={addSubtask}>新增子任务</button>
        </div>
        <div className="space-y-2">
          {subtasks.length === 0 && <p className="text-sm text-gray-500">暂无子任务</p>}
          {subtasks.map((s: any) => (
            <div key={s.id} className="border rounded p-2 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <a href={`/tasks/${s.id}`} className="font-medium text-sm">{s.title}</a>
                <div className="flex gap-2">
                  <button className="text-xs border rounded px-2 py-1" onClick={() => setEditingSub({ id: s.id, title: s.title, status: s.status, progress: s.progress })}>编辑</button>
                  <button className="text-xs border rounded px-2 py-1 text-red-600" onClick={() => deleteSubtask(s.id)}>删除</button>
                </div>
              </div>
              <div className="text-xs text-gray-500">{s.status} · {s.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      {editingSub && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">编辑子任务</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input className="border rounded px-2 py-1" value={editingSub.title} onChange={e => setEditingSub({ ...editingSub, title: e.target.value })} />
            <select className="border rounded px-2 py-1" value={editingSub.status} onChange={e => setEditingSub({ ...editingSub, status: e.target.value })}>
              <option value="pending">pending</option><option value="in-progress">in-progress</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
            </select>
            <input className="border rounded px-2 py-1" type="number" min={0} max={100} value={editingSub.progress} onChange={e => setEditingSub({ ...editingSub, progress: Number(e.target.value) })} />
            <div className="flex gap-2">
              <button className="border rounded px-2 py-1" onClick={updateSubtask}>保存</button>
              <button className="border rounded px-2 py-1" onClick={() => setEditingSub(null)}>取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">财务草稿状态</h2>
        <FinancialDraftStatus taskId={task.id} stage={stage} />
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">流程时间线（{events.length}）</h2>
        <div className="space-y-2 mb-4">
          {events.length === 0 && <p className="text-sm text-gray-500">暂无流程事件</p>}
          {events.map((e: any) => (
            <div key={e.id} className="border rounded p-2 text-sm">
              <div className="font-medium">{e.event_type}：{e.from_stage || '-'} → {e.to_stage}</div>
              <div className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString('zh-CN')} · actor: {e.actor || 'system'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">任务资源（{resources.length}）</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <input className="border rounded px-2 py-1" placeholder="资源名称" value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} />
          <select className="border rounded px-2 py-1" value={resForm.resourceType} onChange={e => setResForm({ ...resForm, resourceType: e.target.value })}>
            <option value="file">file</option><option value="media">media</option><option value="link">link</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="URL/路径" value={resForm.url} onChange={e => setResForm({ ...resForm, url: e.target.value })} />
          <button className="border rounded px-2 py-1" onClick={addResource}>新增资源</button>
          <label className="border rounded px-2 py-1 text-center cursor-pointer">
            {uploading ? '上传中...' : '上传文件'}
            <input type="file" className="hidden" onChange={e => { const f=e.target.files?.[0]; if (f) uploadFile(f); }} />
          </label>
        </div>
        <div className="space-y-2">
          {resources.length === 0 && <p className="text-sm text-gray-500">暂无资源</p>}
          {resources.map((r: any) => (
            <div key={r.id} className="border rounded p-2">
              <div className="text-sm font-medium">{r.name}</div>
              <div className="text-xs text-gray-500">
                {r.resourceType}
                {r.url ? (
                  <>
                    {' · '}
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                      {r.url}
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
