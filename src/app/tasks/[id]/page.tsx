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

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (!draft) return <p className="text-sm text-gray-500">No financial draft yet (stage must reach invoiced).</p>;

  return (
    <div className="text-sm space-y-1">
      <p>Status: <span className="font-medium">{draft.status}</span></p>
      <p>Amount: ₱{Number(draft.amount || 0).toLocaleString()} {draft.currency || 'PHP'}</p>
      <p>Description: {draft.description}</p>
      <p>Date: {draft.tx_date}</p>
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

  if (loading) return <div className="p-6">Loading...</div>;
  if (!data?.task) return <div className="p-6 text-red-600">Task not found</div>;

  const task = data.task;
  const subtasks = data.subtasks || [];

  const stageOrder = [...WORKFLOW_STAGES];
  const stage = ((task.workflowStage || 'draft') as WorkflowStage);
  const stageIndex = stageOrder.indexOf(stage);
  const isDeployAllowed = ['deploy_ready','deployed','invoiced','closed'].includes(stage);
  const isInvoiceAllowed = ['deployed','invoiced','closed'].includes(stage);
  const blockers: string[] = [];
  if (!task.analysisDocUrl) blockers.push('Missing analysis document');
  if (!['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage)) blockers.push('Tests not passed');
  if (!isDeployAllowed) blockers.push('Deploy stage not reached');

  const workflowActions: Partial<Record<WorkflowStage, { label: string; endpoint: string; body?: any }[]>> = {
    draft: [{ label: 'Accept Task', endpoint: 'accept' }],
    accepted: [{ label: 'Outsource Confirm', endpoint: 'outsource-confirm' }],
    outsource_confirmed: [{ label: 'Analysis Complete', endpoint: 'analysis-complete', body: { analysis_doc_url: task.analysisDocUrl || 'https://example.com/analysis-doc.md' } }],
    analysis_done: [{ label: 'Automation Complete', endpoint: 'automation-complete' }],
    automation_done: [{ label: 'Test Passed', endpoint: 'test-result', body: { pass: true } }, { label: 'Test Failed', endpoint: 'test-result', body: { pass: false } }],
    test_failed: [{ label: 'Start Troubleshooting', endpoint: 'set-troubleshooting' }],
    troubleshooting: [{ label: 'Retest Passed', endpoint: 'test-result', body: { pass: true } }],
    test_passed: [{ label: 'Deploy Ready', endpoint: 'deploy', body: { readyOnly: true } }],
    deploy_ready: [{ label: 'Execute Deploy', endpoint: 'deploy' }],
    deployed: [{ label: 'Invoice', endpoint: 'invoice' }],
    invoiced: [],
    closed: [],
  };

  const advance = async (endpoint: string, body?: any, label?: string) => {
    const ok = confirm(`Confirm stage action: ${label || endpoint} ?`);
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
        setStageError(json?.error || `Action failed: ${endpoint}`);
      }
    } catch (e) {
      setStageError(e instanceof Error ? e.message : 'Stage advance failed');
    } finally {
      setStageBusy(false);
      load();
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <p className="text-sm text-gray-500 mt-1">Level L{task.level} · Status {task.status} · Progress {task.progress}% · Stage {task.workflowStage || 'draft'}</p>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Deploy Gate Dashboard</h2>
        <div className="text-sm space-y-1">
          <p>Current Stage: <span className="font-medium">{task.workflowStage || 'draft'}</span></p>
          <p>Deployable: <span className={isDeployAllowed ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{isDeployAllowed ? 'Yes' : 'No'}</span></p>
          <p>Workflow Progress: {Math.max(0, stageIndex) + 1}/{stageOrder.length}</p>
        </div>
        {blockers.length > 0 && (
          <div className="mt-2 text-xs text-red-600">
            Blockers: {blockers.join(' / ')}
          </div>
        )}
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Task Info</h2>
        <div className="text-sm space-y-1">
          <p>Description: {task.description || '-'}</p>
          <p>Workflow Stage: {task.workflowStage || 'draft'}</p>
          <p>Analysis Doc: {task.analysisDocUrl ? <a className="text-blue-600 underline" href={task.analysisDocUrl} target="_blank">View</a> : '-'}</p>
          <p>Target Price: {task.targetPrice ?? '-'} {task.currency || 'PHP'}</p>
          <p>Owner: {task.owner || '-'}</p>
          <p>Category: {task.category || '-'}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(workflowActions[stage] || []).map((a) => {
            const disabledByGate = (a.endpoint === 'deploy' && !isDeployAllowed) || (a.endpoint === 'invoice' && !isInvoiceAllowed);
            const reason = a.endpoint === 'deploy' && !isDeployAllowed ? 'Deploy gate not passed' : a.endpoint === 'invoice' && !isInvoiceAllowed ? 'Not deployed, cannot invoice' : '';
            return (
              <button
                key={a.label}
                className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                disabled={stageBusy || disabledByGate}
                onClick={() => advance(a.endpoint, a.body, a.label)}
                title={reason || `Current stage ${stage} can execute: ${a.label}`}
              >
                {stageBusy ? 'Processing...' : a.label}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Available actions for current stage: {(workflowActions[stage] || []).map(a => a.label).join(' / ') || 'None'}
        </div>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className={`border rounded px-2 py-1 ${task.analysisDocUrl ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            Analysis Doc: {task.analysisDocUrl ? 'Generated' : 'Not generated'}
          </div>
          <div className={`border rounded px-2 py-1 ${['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage) ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            Test Gate: {['test_passed','deploy_ready','deployed','invoiced','closed'].includes(stage) ? 'Passed' : 'Not passed'}
          </div>
          <div className={`border rounded px-2 py-1 ${isDeployAllowed ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            Deploy Gate: {isDeployAllowed ? 'Deployable' : 'Not deployable'}
          </div>
          <div className={`border rounded px-2 py-1 ${isInvoiceAllowed ? 'text-green-700 border-green-200 bg-green-50' : 'text-red-700 border-red-200 bg-red-50'}`}>
            Finance Gate: {isInvoiceAllowed ? 'Invoiceable' : 'Not invoiceable'}
          </div>
        </div>
        {stageError && <div className="mt-2 text-xs text-red-600">{stageError}</div>}
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Subtasks ({subtasks.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <input className="border rounded px-2 py-1" placeholder="Subtask title" value={subForm.title} onChange={e => setSubForm({ ...subForm, title: e.target.value })} />
          <select className="border rounded px-2 py-1" value={subForm.level} onChange={e => setSubForm({ ...subForm, level: Number(e.target.value) })}>
            <option value={2}>Level 2</option>
            <option value={3}>Level 3</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="Target price" value={subForm.targetPrice} onChange={e => setSubForm({ ...subForm, targetPrice: e.target.value })} />
          <button className="border rounded px-2 py-1" onClick={addSubtask}>Add Subtask</button>
        </div>
        <div className="space-y-2">
          {subtasks.length === 0 && <p className="text-sm text-gray-500">No subtasks yet</p>}
          {subtasks.map((s: any) => (
            <div key={s.id} className="border rounded p-2 hover:bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <a href={`/tasks/${s.id}`} className="font-medium text-sm">{s.title}</a>
                <div className="flex gap-2">
                  <button className="text-xs border rounded px-2 py-1" onClick={() => setEditingSub({ id: s.id, title: s.title, status: s.status, progress: s.progress })}>Edit</button>
                  <button className="text-xs border rounded px-2 py-1 text-red-600" onClick={() => deleteSubtask(s.id)}>Delete</button>
                </div>
              </div>
              <div className="text-xs text-gray-500">{s.status} · {s.progress}%</div>
            </div>
          ))}
        </div>
      </div>

      {editingSub && (
        <div className="bg-white border rounded p-4">
          <h2 className="font-semibold mb-2">Edit Subtask</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input className="border rounded px-2 py-1" value={editingSub.title} onChange={e => setEditingSub({ ...editingSub, title: e.target.value })} />
            <select className="border rounded px-2 py-1" value={editingSub.status} onChange={e => setEditingSub({ ...editingSub, status: e.target.value })}>
              <option value="pending">pending</option><option value="in-progress">in-progress</option><option value="completed">completed</option><option value="cancelled">cancelled</option>
            </select>
            <input className="border rounded px-2 py-1" type="number" min={0} max={100} value={editingSub.progress} onChange={e => setEditingSub({ ...editingSub, progress: Number(e.target.value) })} />
            <div className="flex gap-2">
              <button className="border rounded px-2 py-1" onClick={updateSubtask}>Save</button>
              <button className="border rounded px-2 py-1" onClick={() => setEditingSub(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Financial Draft Status</h2>
        <FinancialDraftStatus taskId={task.id} stage={stage} />
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Workflow Timeline ({events.length})</h2>
        <div className="space-y-2 mb-4">
          {events.length === 0 && <p className="text-sm text-gray-500">No workflow events yet</p>}
          {events.map((e: any) => (
            <div key={e.id} className="border rounded p-2 text-sm">
              <div className="font-medium">{e.event_type}: {e.from_stage || '-'} → {e.to_stage}</div>
              <div className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString('zh-CN')} · actor: {e.actor || 'system'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Task Resources ({resources.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-3">
          <input className="border rounded px-2 py-1" placeholder="Resource name" value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} />
          <select className="border rounded px-2 py-1" value={resForm.resourceType} onChange={e => setResForm({ ...resForm, resourceType: e.target.value })}>
            <option value="file">file</option><option value="media">media</option><option value="link">link</option>
          </select>
          <input className="border rounded px-2 py-1" placeholder="URL/path" value={resForm.url} onChange={e => setResForm({ ...resForm, url: e.target.value })} />
          <button className="border rounded px-2 py-1" onClick={addResource}>Add Resource</button>
          <label className="border rounded px-2 py-1 text-center cursor-pointer">
            {uploading ? 'Uploading...' : 'Upload File'}
            <input type="file" className="hidden" onChange={e => { const f=e.target.files?.[0]; if (f) uploadFile(f); }} />
          </label>
        </div>
        <div className="space-y-2">
          {resources.length === 0 && <p className="text-sm text-gray-500">No resources yet</p>}
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
