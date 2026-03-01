'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  Edit3,
  FolderPlus,
  Search,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';

type NodeTask = {
  id: string;
  parentId?: string | null;
  level: number;
  title: string;
  status: string;
  progress: number;
  targetPrice?: number | null;
  currency?: string;
  children?: NodeTask[];
};

const GOAL_TITLES = [
  'AI Agent Philippines market individual and enterprise deployment business',
  'MySkillStore trading platform development and operations',
  'Seeking business and institutional investment',
  'Job Seeking',
  'AI system and feature evolution',
  'Freelance platform task orders',
];

export default function TasksPage() {
  const [tree, setTree] = useState<NodeTask[]>([]);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ goalId: '', taskId: '', subtaskId: '' });
  const [docText, setDocText] = useState('');
  const [draft, setDraft] = useState<any[]>([]);

  const load = async () => {
    const j = await fetch('/api/task-hierarchy', { cache: 'no-store' }).then((r) => r.json());
    setTree(j?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const flat = useMemo(() => {
    const out: NodeTask[] = [];
    const walk = (nodes: NodeTask[]) =>
      nodes.forEach((n) => {
        out.push(n);
        if (n.children?.length) walk(n.children);
      });
    walk(tree);
    return out;
  }, [tree]);

  const filteredFlat = useMemo(() => {
    if (!q.trim()) return flat;
    const keyword = q.toLowerCase();
    return flat.filter((n) => n.title.toLowerCase().includes(keyword));
  }, [flat, q]);

  const fixedLevel1 = GOAL_TITLES.map((title) => tree.find((t) => t.title === title && t.level === 1))
    .filter(Boolean)
    .map((t: any) => ({ id: t.id, title: t.title }));

  const dynamicLevel1 = tree
    .filter((t) => t.level === 1 && !GOAL_TITLES.includes(t.title))
    .map((t) => ({ id: t.id, title: t.title }));

  const level1Options = [...fixedLevel1, ...dynamicLevel1];
  const level2Options = (tree.find((t) => t.id === form.goalId)?.children || []).map((t) => ({ id: t.id, title: t.title }));
  const level3Options = ((tree.find((t) => t.id === form.goalId)?.children || []).find((t) => t.id === form.taskId)?.children || []).map((t) => ({ id: t.id, title: t.title }));

  const addLevel1 = async () => {
    const title = (prompt('Enter new top-level goal name') || '').trim();
    if (!title) return;
    await fetch('/api/task-hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: null, level: 1, title, currency: 'PHP', status: 'pending', progress: 0 }),
    });
    setForm({ goalId: '', taskId: '', subtaskId: '' });
    load();
  };

  const addLevel2 = async () => {
    if (!form.goalId) {
      alert('Please select a top-level goal first');
      return;
    }
    const title = (prompt('Enter new level 2 task name') || '').trim();
    if (!title) return;
    await fetch('/api/task-hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: form.goalId, level: 2, title, currency: 'PHP', status: 'pending', progress: 0 }),
    });
    setForm({ ...form, taskId: '', subtaskId: '' });
    load();
  };

  const addLevel3 = async () => {
    if (!form.taskId) {
      alert('Please select a level 2 task first');
      return;
    }
    const title = (prompt('Enter new level 3 subtask name') || '').trim();
    if (!title) return;
    await fetch('/api/task-hierarchy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId: form.taskId, level: 3, title, currency: 'PHP', status: 'pending', progress: 0 }),
    });
    setExpanded((prev) => ({ ...prev, [form.goalId]: true, [form.taskId]: true }));
    load();
  };

  const updateTask = async (id: string, updates: any) => {
    await fetch(`/api/task-hierarchy/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    load();
  };

  const removeTask = async (id: string) => {
    await fetch(`/api/task-hierarchy/${id}`, { method: 'DELETE' });
    load();
  };

  const generateDraft = async () => {
    const j = await fetch('/api/task-hierarchy/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: docText }),
    }).then((r) => r.json());
    setDraft(j?.data?.draft || []);
  };

  const commitDraft = async () => {
    if (!draft.length) return;
    await fetch('/api/task-hierarchy/generate/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft }),
    });
    setDraft([]);
    setDocText('');
    load();
  };

  const statusChip = (status: string) => {
    const mapping: Record<string, string> = {
      completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
      pending: 'bg-slate-100 text-slate-600 border-slate-200',
    };
    return mapping[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const renderNode = (n: NodeTask) => {
    if (q) {
      const keyword = q.toLowerCase();
      const selfHit = n.title.toLowerCase().includes(keyword);
      const childHit = (n.children || []).some((c) => c.title.toLowerCase().includes(keyword));
      if (!selfHit && !childHit) return null;
    }

    const isOpen = expanded[n.id] ?? (n.level === 1 ? false : true);

    return (
      <div key={n.id}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                {(n.children?.length || 0) > 0 ? (
                  <button
                    className="mt-1 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => setExpanded((prev) => ({ ...prev, [n.id]: !isOpen }))}
                  >
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ) : (
                  <span className="mt-1 p-1 text-slate-300">
                    <Circle className="h-4 w-4" />
                  </span>
                )}

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="truncate text-left text-base font-semibold text-slate-900 transition-colors hover:text-blue-600"
                      onClick={() => (n.children?.length ? setExpanded((prev) => ({ ...prev, [n.id]: !isOpen })) : undefined)}
                    >
                      {n.title}
                    </button>
                    <span className={`rounded-md border px-2 py-0.5 text-xs ${statusChip(n.status)}`}>{n.status}</span>
                    <a href={`/tasks/${n.id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      Details
                    </a>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Progress {n.progress}% · Target Price {n.targetPrice ?? '—'} {n.currency || 'PHP'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => updateTask(n.id, { status: 'in-progress' })}
              >
                In Progress
              </button>
              <button
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-95"
                onClick={() => updateTask(n.id, { status: 'completed', progress: 100 })}
              >
                Complete
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => {
                  const title = prompt('New title', n.title) || n.title;
                  const description = prompt('Description', '') || '';
                  const targetPrice = prompt('Target Price', String(n.targetPrice ?? ''));
                  const owner = prompt('Owner', '') || '';
                  updateTask(n.id, { title, description, targetPrice: targetPrice ? Number(targetPrice) : null, owner });
                }}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                onClick={() => removeTask(n.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {isOpen && n.children?.length ? <div className="ml-6 mt-3 space-y-3 border-l border-slate-200 pl-4">{n.children.map(renderNode)}</div> : null}
      </div>
    );
  };

  const completedCount = flat.filter((t) => t.status === 'completed').length;
  const inProgressCount = flat.filter((t) => t.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div>
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Tasks Workspace
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Task Management</h1>
              <p className="mt-1 text-slate-600">Unified management of goals, task hierarchy, document breakdown, and execution status.</p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total Tasks" value={String(flat.length)} />
              <StatCard label="Search Results" value={String(filteredFlat.length)} />
              <StatCard label="In Progress" value={String(inProgressCount)} />
              <StatCard label="Completed" value={String(completedCount)} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">Add Task Node</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value, taskId: '', subtaskId: '' })}
              >
                <option value="">Select top-level goal</option>
                {level1Options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.taskId}
                onChange={(e) => setForm({ ...form, taskId: e.target.value, subtaskId: '' })}
              >
                <option value="">Level 2 Task (Optional)</option>
                {level2Options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={form.subtaskId}
                onChange={(e) => setForm({ ...form, subtaskId: e.target.value })}
              >
                <option value="">Level 3 Subtask (Optional)</option>
                {level3Options.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95" onClick={addLevel1}>
                  Add Level 1
                </button>
              </div>
              <div>
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={addLevel2}>
                  Add Level 2
                </button>
              </div>
              <div>
                <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={addLevel3}>
                  Add Level 3
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Generate Tasks from Document</h2>
                </div>

                <textarea
                  className="min-h-28 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  placeholder="Paste task document content"
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                />

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={generateDraft}>
                    Generate Draft
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={async () => {
                      const j = await fetch('/api/task-hierarchy/template').then((r) => r.json());
                      setDocText(j?.data?.template || '');
                    }}
                  >
                    Insert Template
                  </button>
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95" onClick={commitDraft}>
                    Confirm & Save
                  </button>
                  <span className="ml-auto rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Drafts: {draft.length}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Task List</h2>
                  </div>

                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      placeholder="Search task title"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {tree.length ? (
                    tree.map(renderNode)
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-slate-400" />
                      <p className="mt-3 text-sm text-slate-500">No task data. Create a top-level goal first.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
