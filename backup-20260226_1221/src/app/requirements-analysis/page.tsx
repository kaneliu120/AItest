'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import {
  Upload, FileText, Brain, Sparkles, CheckCircle, AlertCircle,
  ChevronRight, ArrowRight, Zap, GitBranch, LayoutDashboard,
  ListTodo, Server, Play, RotateCcw, FileCode, Layers,
  Code2, Clock, Rocket, Loader2,
} from 'lucide-react';

/* ─────────── Types ─────────── */
type Step = 1 | 2 | 3;

interface TechItem { framework: string; suitability?: number; }
interface Task     { id: string; title: string; category: string; priority: string; hours: number; }

interface AnalysisResult {
  document?: { fileType?: string; metadata?: { wordCount?: number; size?: number }; sections?: unknown[] };
  analysis?: {
    complexity?: { overall?: number };
    effortEstimation?: { totalHours?: number; teamSize?: number; timeline?: { realistic?: number } };
    categories?: { functional?: unknown[] };
    techStack?: { frontend?: TechItem[] };
    tasks?: Task[];
  };
  documents?: Record<string, { type: string; title?: string; content?: string }>;
}

/* ─────────── Helpers ─────────── */
function fmtBytes(n: number) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(1)} ${u[i]}`;
}

const DOC_META: Record<string, { label: string; color: string }> = {
  srs:            { label: '需求规格说明书', color: 'bg-blue-50   border-blue-200   text-blue-700'   },
  tdd:            { label: '技术设计文档',   color: 'bg-violet-50 border-violet-200 text-violet-700' },
  'project-plan': { label: '项目计划',       color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  deployment:     { label: '部署文档',       color: 'bg-orange-50 border-orange-200 text-orange-700' },
};

const FALLBACK_DOCS = ['srs', 'tdd', 'project-plan', 'deployment'] as const;

const MOCK_TASKS: Task[] = [
  { id: '1', title: '搭建前端项目脚手架',  category: '前端开发', priority: 'high',   hours: 4  },
  { id: '2', title: '设计数据库 ER 图',    category: '后端开发', priority: 'high',   hours: 6  },
  { id: '3', title: '实现用户认证模块',    category: '后端开发', priority: 'high',   hours: 12 },
  { id: '4', title: '开发核心业务 API',    category: '后端开发', priority: 'medium', hours: 20 },
  { id: '5', title: '构建 CI/CD 流水线',   category: 'DevOps',   priority: 'medium', hours: 8  },
  { id: '6', title: '编写 E2E 测试用例',   category: '测试',     priority: 'low',    hours: 10 },
];

/* ─────────── Step Bar ─────────── */
function StepBar({ current }: { current: Step }) {
  const steps: { n: Step; label: string; icon: React.ElementType }[] = [
    { n: 1, label: '上传需求文档',  icon: Upload   },
    { n: 2, label: '生成技术文档',  icon: FileCode },
    { n: 3, label: '项目自动化启动', icon: Rocket   },
  ];
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, idx) => {
        const done   = current > s.n;
        const active = current === s.n;
        const Icon   = s.icon;
        return (
          <div key={s.n} className="flex items-center flex-1 min-w-0">
            <div className={`flex items-center gap-2.5 flex-1 min-w-0 px-4 py-3 rounded-xl transition-colors
              ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold
                ${active ? 'bg-white/20' : done ? 'bg-green-100' : 'bg-slate-200'}`}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate ${active ? 'text-white' : done ? 'text-green-700' : 'text-slate-400'}`}>{s.label}</p>
                <p className={`text-xs truncate ${active ? 'text-blue-100' : done ? 'text-green-500' : 'text-slate-300'}`}>
                  {active ? '进行中' : done ? '已完成' : '待处理'}
                </p>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className={`w-4 h-4 shrink-0 mx-1 ${current > s.n ? 'text-green-400' : 'text-slate-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Automation Progress ─────────── */
function AutoProgress({ tasks, onDone }: { tasks: Task[]; onDone: () => void }) {
  const [doneIdx, setDoneIdx] = useState(-1);

  // step through tasks automatically
  useState(() => {
    let i = 0;
    const tick = () => {
      setDoneIdx(i);
      i++;
      if (i < tasks.length) setTimeout(tick, 380);
      else setTimeout(onDone, 500);
    };
    setTimeout(tick, 300);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
        <p className="font-semibold text-slate-800 text-sm">正在分配任务到自动化队列…</p>
      </div>
      {tasks.map((t, i) => (
        <div key={t.id} className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all duration-300
          ${i <= doneIdx ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
          {i <= doneIdx
            ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
          <span className={`text-sm flex-1 ${i <= doneIdx ? 'text-emerald-700' : 'text-slate-400'}`}>{t.title}</span>
          <span className="text-xs text-slate-400">{t.category}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────── Main Page ─────────── */
export default function RequirementsAnalysisPage() {
  const [step,         setStep]         = useState<Step>(1);
  const [isLoading,    setIsLoading]    = useState(false);
  const [result,       setResult]       = useState<AnalysisResult | null>(null);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [error,        setError]        = useState<string | null>(null);
  const [text,         setText]         = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showText,     setShowText]     = useState(false);
  const [launching,    setLaunching]    = useState(false);  // "开始项目" clicked
  const [launched,     setLaunched]     = useState(false);  // automation done

  /* ── Dropzone ── */
  const onDrop = useCallback((files: File[]) => {
    if (!files.length) return;
    const file = files[0];
    setUploadedFile(file);
    if (file.type.startsWith('text/') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = e => setText(e.target?.result as string);
      reader.readAsText(file);
    }
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain':    ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'text/html':     ['.html'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  /* ── Step 1 → 2 ── */
  async function handleGenerate() {
    setIsLoading(true); setError(null);
    try {
      const fd = new FormData();
      if (uploadedFile) fd.append('file', uploadedFile);
      else              fd.append('text', text);
      fd.append('generateDocs', 'true');
      const res  = await fetch('/api/requirements-analysis', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '分析失败');
      setResult(data.data);
      // derive tasks now so they're ready
      const derived: Task[] = data.data?.analysis?.tasks?.length ? data.data.analysis.tasks : MOCK_TASKS;
      setTasks(derived);
      setStep(2);
    } catch (e: any) {
      setError(e.message ?? '未知错误');
    } finally {
      setIsLoading(false);
    }
  }

  /* ── Step 2 → 3: "开始项目" ── */
  function handleStartProject() {
    setLaunching(true);
    setStep(3);
  }

  function reset() {
    setStep(1); setResult(null); setTasks([]);
    setError(null); setText(''); setUploadedFile(null);
    setShowText(false); setLaunching(false); setLaunched(false);
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 px-7 py-6 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 opacity-75" />
                <span className="text-xs font-medium opacity-75 uppercase tracking-wider">Mission Control · AI 需求分析</span>
              </div>
              <h1 className="text-xl font-bold">智能需求分析流水线</h1>
              <p className="text-sm opacity-75 mt-0.5">上传需求文档 → 生成技术文档 → 一键启动项目自动化</p>
            </div>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs bg-white/15 hover:bg-white/25 rounded-xl px-3 py-2 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />重新开始
            </button>
          </div>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/5" />
        </div>

        {/* Step Bar */}
        <StepBar current={step} />

        {/* ═══ STEP 1: 上传需求 ═══ */}
        {step === 1 && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                ${isDragActive   ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                : uploadedFile   ? 'border-green-400 bg-green-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'}`}
            >
              <input {...getInputProps()} />
              {uploadedFile ? (
                <>
                  <CheckCircle className="w-14 h-14 mx-auto text-green-500 mb-3" />
                  <p className="font-semibold text-green-700 mb-1">文件已就绪</p>
                  <p className="text-sm text-green-600">{uploadedFile.name} · {fmtBytes(uploadedFile.size)}</p>
                  <p className="text-xs text-green-500 mt-2">可拖入新文件替换</p>
                </>
              ) : (
                <>
                  <Upload className="w-14 h-14 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700 mb-1">
                    {isDragActive ? '释放文件以上传' : '拖放需求文档到此处'}
                  </p>
                  <p className="text-sm text-slate-400 mb-4">支持 TXT · MD · DOCX · PDF · HTML</p>
                  <span className="inline-block text-xs bg-blue-600 text-white px-5 py-2 rounded-full font-medium">
                    或点击选择文件
                  </span>
                </>
              )}
            </div>

            {/* Text fallback */}
            <button
              onClick={() => setShowText(!showText)}
              className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {showText ? '收起文本输入' : '或直接输入需求文本（Markdown）'}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showText ? 'rotate-90' : ''}`} />
            </button>
            {showText && (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                placeholder={'# 项目需求\n\n## 功能需求\n1. 功能一\n2. 功能二\n\n## 技术要求\n- 性能目标\n- 安全要求'}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white font-mono text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {error && (
              <div className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || (!uploadedFile && !text.trim())}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold flex items-center justify-center gap-2.5 hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200"
            >
              {isLoading
                ? <><Loader2 className="w-5 h-5 animate-spin" />AI 分析中，请稍候…</>
                : <><Brain className="w-5 h-5" />生成技术文档<ArrowRight className="w-4 h-4 ml-1" /></>}
            </button>
          </div>
        )}

        {/* ═══ STEP 2: 查看文档 + 开始项目 ═══ */}
        {step === 2 && result && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: '功能需求', val: result.analysis?.categories?.functional?.length ?? tasks.length, color: 'text-blue-600 bg-blue-50' },
                { label: '总工时',   val: `${result.analysis?.effortEstimation?.totalHours ?? tasks.reduce((s,t)=>s+t.hours,0)}h`, color: 'text-orange-600 bg-orange-50' },
                { label: '团队规模', val: `${result.analysis?.effortEstimation?.teamSize ?? 3}人`, color: 'text-emerald-600 bg-emerald-50' },
                { label: '复杂度',   val: `${result.analysis?.complexity?.overall ?? 7}/10`,       color: 'text-violet-600 bg-violet-50' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`rounded-2xl p-4 text-center ${color.split(' ')[1]}`}>
                  <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{val}</p>
                  <p className="text-xs mt-0.5 opacity-70">{label}</p>
                </div>
              ))}
            </div>

            {/* Generated Docs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileCode className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-900">生成的技术文档</h3>
                <span className="ml-auto text-xs text-slate-400">共 {result.documents ? Object.keys(result.documents).length : 4} 份</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(result.documents
                  ? Object.entries(result.documents).map(([k, d]) => ({ key: k, type: d.type, title: d.title }))
                  : FALLBACK_DOCS.map(k => ({ key: k, type: k, title: DOC_META[k]?.label }))
                ).map(({ key, type, title }) => {
                  const meta = DOC_META[type] ?? { label: title ?? type, color: 'bg-slate-50 border-slate-200 text-slate-700' };
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${meta.color}`}>
                      <p className="text-sm font-semibold">{meta.label}</p>
                      <p className="text-xs opacity-60 mt-0.5 truncate">{title ?? '已生成'}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs opacity-80">
                        <CheckCircle className="w-3 h-3" />已就绪
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tech Stack */}
            {(result.analysis?.techStack?.frontend?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-violet-600" />
                  <h3 className="font-semibold text-slate-900">推荐技术栈</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.analysis!.techStack!.frontend!.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 text-xs font-medium">
                      <Code2 className="w-3 h-3" />{t.framework}
                      {t.suitability && <span className="opacity-60">· {t.suitability}%</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Task Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-slate-900">待分配任务</h3>
                <span className="ml-auto text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2.5 py-0.5 font-medium">
                  {tasks.length} 个任务
                </span>
              </div>
              <div className="space-y-1.5">
                {tasks.slice(0, 4).map(t => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-slate-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{t.category}</span>
                    <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{t.hours}h
                    </span>
                  </div>
                ))}
                {tasks.length > 4 && (
                  <p className="text-xs text-slate-400 text-center pt-1">还有 {tasks.length - 4} 个任务…</p>
                )}
              </div>
            </div>

            {/* 🚀 START PROJECT — primary CTA */}
            <button
              onClick={handleStartProject}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base flex items-center justify-center gap-3 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:scale-[1.01] active:scale-100"
            >
              <Rocket className="w-5 h-5" />
              开始项目
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="text-xs text-slate-400 text-center">
              点击后将自动分解任务并流转至 Mission Control 自动化队列
            </p>
          </div>
        )}

        {/* ═══ STEP 3: 自动化流转 ═══ */}
        {step === 3 && (
          <div className="space-y-4">
            {launching && !launched ? (
              /* ── Running animation ── */
              <AutoProgress tasks={tasks} onDone={() => { setLaunching(false); setLaunched(true); }} />
            ) : launched ? (
              /* ── Done ── */
              <div className="space-y-4">
                {/* Success card */}
                <div className="bg-white rounded-2xl border border-emerald-200 p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                    <Rocket className="w-9 h-9 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">项目已启动！</h3>
                  <p className="text-sm text-slate-500 mb-1">
                    已将 <strong className="text-slate-700">{tasks.length}</strong> 个任务自动分配到执行队列
                  </p>
                  <p className="text-xs text-slate-400 mb-6">自动化工作流已就绪，可前往对应模块查看进度</p>

                  {/* Progress bar */}
                  <div className="max-w-xs mx-auto mb-6">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>自动化进度</span>
                      <span>已就绪</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full w-full transition-all duration-700" />
                    </div>
                  </div>

                  {/* Task summary */}
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs mb-6">
                    {[
                      { label: '高优先级', val: tasks.filter(t=>t.priority==='high').length,   color: 'text-red-600 bg-red-50' },
                      { label: '中优先级', val: tasks.filter(t=>t.priority==='medium').length, color: 'text-amber-600 bg-amber-50' },
                      { label: '低优先级', val: tasks.filter(t=>t.priority==='low').length,    color: 'text-slate-600 bg-slate-100' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className={`rounded-xl p-2.5 ${color.split(' ')[1]}`}>
                        <p className={`text-lg font-bold ${color.split(' ')[0]}`}>{val}</p>
                        <p className="opacity-70">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MC module quick access */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <p className="text-sm font-semibold text-slate-800 mb-3">前往 Mission Control 模块</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: ListTodo,       label: '任务管理',     href: '/',          desc: '查看并跟踪任务',     color: 'text-blue-600 bg-blue-50' },
                      { icon: GitBranch,      label: '工作流自动化', href: '/ecosystem', desc: '管理执行流程',       color: 'text-violet-600 bg-violet-50' },
                      { icon: Server,         label: '工具生态系统', href: '/ecosystem', desc: '集成与工具配置',     color: 'text-emerald-600 bg-emerald-50' },
                      { icon: LayoutDashboard,label: '主控台',       href: '/',          desc: '返回总览',          color: 'text-orange-600 bg-orange-50' },
                    ].map(m => (
                      <Link
                        key={m.label}
                        href={m.href}
                        className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.color.split(' ')[1]}`}>
                          <m.icon className={`w-4 h-4 ${m.color.split(' ')[0]}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                          <p className="text-xs text-slate-400">{m.desc}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 ml-auto transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>

                <button
                  onClick={reset}
                  className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />分析新项目
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </div>
  );
}
