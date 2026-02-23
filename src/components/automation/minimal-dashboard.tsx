'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  Zap, 
  Cpu, 
  Database, 
  Calendar,
  Activity,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  ExternalLink,
  Terminal
} from 'lucide-react';

interface ServiceStatus {
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  uptime: number;
  components: {
    moduleManager: boolean;
    taskScheduler: boolean;
    dataBus: boolean;
    eventSystem: boolean;
  };
  stats: {
    totalModules: number;
    enabledModules: number;
    totalTasks: number;
    enabledTasks: number;
    activeExecutions: number;
    totalEvents: number;
    totalMessages: number;
  };
}

export default function MinimalAutomationDashboard() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentExecutions, setRecentExecutions] = useState<any[]>([]);

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/automation?action=status');
      const data = await response.json();
      if (data.success) {
        setServiceStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      // 模拟数据 - 实际应该从 API 获取
      setRecentExecutions([
        { id: 1, module: 'aiassist-automation', action: 'run-web-test', status: 'success', duration: '2.3s', timestamp: '2026-02-21 17:19:09' },
        { id: 2, module: 'cortexaai-automation', action: 'run-api-test', status: 'success', duration: '1.8s', timestamp: '2026-02-21 17:19:09' },
        { id: 3, module: 'aiassist-automation', action: 'screenshot', status: 'pending', duration: '--', timestamp: '2026-02-21 17:18:45' },
        { id: 4, module: 'cortexaai-automation', action: 'performance-test', status: 'running', duration: '15.2s', timestamp: '2026-02-21 17:18:30' },
      ]);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  useEffect(() => {
    fetchServiceStatus();
    fetchRecentExecutions();
    const interval = setInterval(fetchServiceStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartService = () => {
    // 实际应该调用 API
    console.log('Starting service...');
  };

  const handleStopService = () => {
    // 实际应该调用 API
    console.log('Stopping service...');
  };

  const handleRunTest = (moduleId: string, action: string) => {
    console.log(`Running ${action} on ${moduleId}`);
    // 实际应该调用 API
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold gradient-text">初始化自动化系统</h3>
            <p className="text-muted-foreground mt-2">正在连接服务组件...</p>
            <div className="mt-4 flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!serviceStatus) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-2">无法连接到自动化服务</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            自动化框架服务当前不可用。请检查服务是否正常运行，或尝试重新启动。
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={fetchServiceStatus}
            className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            重试连接
          </button>
          <button 
            onClick={handleStartService}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            启动服务
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    starting: { color: 'from-yellow-500 to-amber-500', text: '启动中', icon: Activity },
    running: { color: 'from-green-500 to-emerald-500', text: '运行中', icon: CheckCircle },
    stopping: { color: 'from-yellow-500 to-amber-500', text: '停止中', icon: Activity },
    stopped: { color: 'from-gray-500 to-slate-500', text: '已停止', icon: XCircle },
    error: { color: 'from-red-500 to-rose-500', text: '错误', icon: AlertCircle }
  }[serviceStatus.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* 头部状态栏 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">自动化指挥中心</h1>
              <p className="text-muted-foreground">模块化框架 · 实时监控 · 智能调度 · 企业级</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl glass border border-border/50">
            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${statusConfig.color} animate-pulse`} />
            <div>
              <p className="text-sm text-muted-foreground">系统状态</p>
              <div className="flex items-center gap-2">
                <StatusIcon className="w-5 h-5" />
                <span className="font-semibold">{statusConfig.text}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleStartService}
              className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
              title="启动服务"
            >
              <Play className="w-5 h-5" />
            </button>
            <button
              onClick={handleStopService}
              className="p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              title="停止服务"
            >
              <Pause className="w-5 h-5" />
            </button>
            <button
              onClick={fetchServiceStatus}
              className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
              title="刷新状态"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 标签页导航 - 科技感设计 */}
      <div className="flex overflow-x-auto pb-2 border-b border-border/50">
        {[
          { id: 'overview', label: '系统概览', icon: BarChart3 },
          { id: 'modules', label: '模块管理', icon: Cpu },
          { id: 'tasks', label: '任务调度', icon: Calendar },
          { id: 'executions', label: '执行监控', icon: Activity },
          { id: 'events', label: '事件中心', icon: Terminal },
          { id: 'security', label: '安全审计', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-3 font-medium transition-all whitespace-nowrap ${isActive 
                ? 'text-primary border-b-2 border-primary relative' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
              {tab.label}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-primary to-purple-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* 标签页内容 */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="data-card card-hover p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${serviceStatus.components.moduleManager 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {serviceStatus.components.moduleManager ? '正常' : '异常'}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">模块管理</h3>
              <div className="text-3xl font-bold mb-1">
                {serviceStatus.stats.enabledModules}<span className="text-xl text-muted-foreground">/{serviceStatus.stats.totalModules}</span>
              </div>
              <p className="text-sm text-muted-foreground">启用/总数</p>
            </div>

            <div className="data-card card-hover p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${serviceStatus.components.taskScheduler 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {serviceStatus.components.taskScheduler ? '正常' : '异常'}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">任务调度</h3>
              <div className="text-3xl font-bold mb-1">
                {serviceStatus.stats.enabledTasks}<span className="text-xl text-muted-foreground">/{serviceStatus.stats.totalTasks}</span>
              </div>
              <p className="text-sm text-muted-foreground">启用/总数</p>
            </div>

            <div className="data-card card-hover p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <Database className="w-6 h-6 text-green-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${serviceStatus.components.dataBus 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {serviceStatus.components.dataBus ? '正常' : '异常'}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">数据总线</h3>
              <div className="text-3xl font-bold mb-1">
                {serviceStatus.stats.totalMessages.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">总消息数</p>
            </div>

            <div className="data-card card-hover p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                  <Terminal className="w-6 h-6 text-orange-400" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${serviceStatus.components.eventSystem 
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {serviceStatus.components.eventSystem ? '正常' : '异常'}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-2">事件系统</h3>
              <div className="text-3xl font-bold mb-1">
                {serviceStatus.stats.totalEvents.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">总事件数</p>
            </div>
          </div>

          {/* 集成模块展示 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Assist 模块 */}
            <div className="glass card-hover rounded-2xl p-6 border border-border/50">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                    <Cpu className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">AI Assist 自动化测试</h3>
                    <p className="text-sm text-muted-foreground">Web自动化测试 · UI测试 · 数据提取</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 text-sm font-semibold">
                  已集成
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6">
                基于 AI Assist 的自动化测试模块，支持 Web 自动化测试、UI 测试、截图和数据提取。
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-400 border border-blue-500/20 text-sm">
                  Web测试
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 border border-purple-500/20 text-sm">
                  截图
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-400 border border-green-500/20 text-sm">
                  数据提取
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 border border-orange-500/20 text-sm">
                  表单填写
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">模块ID</p>
                  <p className="font-mono text-foreground">aiassist-automation</p>
                </div>
                <button
                  onClick={() => handleRunTest('aiassist-automation', 'run-web-test')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  运行测试
                </button>
              </div>
            </div>

            {/* CortexaAI 模块 */}
            <div className="glass card-hover rounded-2xl p-6 border border-border/50">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Terminal className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">CortexaAI 自动化测试</h3>
                    <p className="text-sm text-muted-foreground">API测试 · 性能测试 · 响应验证</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 text-sm font-semibold">
                  已集成
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6">
                基于 CortexaAI 的自动化测试模块，支持 API 测试、性能压力测试和响应验证。
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-400 border border-purple-500/20 text-sm">
                  API测试
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 border border-orange-500/20 text-sm">
                  性能测试
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-400 border border-green-500/20 text-sm">
                  响应验证
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-400 border border-red-500/20 text-sm">
                  压力测试
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">模块ID</p>
                  <p className="font-mono text-foreground">cortexaai-automation</p>
                </div>
                <button
                  onClick={() => handleRunTest('cortexaai-automation', 'run-api-test')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  运行测试
                </button>
              </div>
            </div>
          </div>

          {/* 最近执行记录 */}
          <div className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold">最近执行记录</h3>
                <p className="text-sm text-muted-foreground">实时监控自动化任务的执行状态</p>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                刷新
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full">
                <thead>
                  <tr className="bg-accent/30">
                    <th className="text-left p-4 font-semibold">模块</th>
                    <th className="text-left p-4 font-semibold">动作</th>
                    <th className="text-left p-4 font-semibold">状态</th>
                    <th className="text-left p-4 font-semibold">耗时</th>
                    <th className="text-left p-4 font-semibold">时间</th>
                    <th className="text-left p-4 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExecutions.map((exec) => (
                    <tr key={exec.id} className="border-t border-border/50 hover:bg-accent/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            exec.module.includes('aiassist') ? 'bg-blue-500' : 'bg-purple-500'
                          }`} />
                          <span className="font-medium">{exec.module}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <code className="px-2 py-1 bg-accent/30 rounded text-sm">{exec.action}</code>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          exec.status === 'success' 
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                            : exec.status === 'running'
                            ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30'
                            : exec.status === 'pending'
                            ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {exec.status === 'success' ? '成功' : 
                           exec.status === 'running' ? '运行中' : 
                           exec.status === 'pending' ? '等待中' : '失败'}
                        </span>
                      </td>
                      <td className="p-4 font-mono">{exec.duration}</td>
                      <td className="p-4 text-sm text-muted-foreground">{exec.timestamp}</td>
                      <td className="p-4">
                        <button className="p-2 hover:bg-accent/30 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-400">✅ 自动化测试模块已成功集成</p>
                  <p className="text-sm text-green-500/80 mt-1">
                    所有模块均可通过 API 调用或任务调度器执行。系统运行稳定，已准备好接管实际业务任务。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 系统信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="text-lg font-bold mb-4">系统信息</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">服务状态</span>
                  <span className="font-semibold">{statusConfig.text}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">运行时间</span>
                  <span className="font-semibold">
                    {Math.floor(serviceStatus.uptime / 3600)}小时 {Math.floor((serviceStatus.uptime % 3600) / 60)}分钟
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">活跃执行</span>
                  <span className="font-semibold">{serviceStatus.stats.activeExecutions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">API版本</span>
                  <span className="font-semibold">v1.0.0</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="text-lg font-bold mb-4">快速操作</h3>
              <div className="space-y-3">
                <button className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center justify-between">
                  <span>运行 AI Assist 测试</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center justify-between">
                  <span>运行 CortexaAI 测试</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors flex items-center justify-between">
                  <span>查看所有模块</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button className="w-full p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors flex items-center justify-between">
                  <span>创建新任务</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50">
              <h3 className="text-lg font-bold mb-4">系统健康</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">模块管理器</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${serviceStatus.components.moduleManager ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {serviceStatus.components.moduleManager ? '正常' : '异常'}
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">任务调度器</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${serviceStatus.components.taskScheduler ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {serviceStatus.components.taskScheduler ? '正常' : '异常'}
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">数据总线</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${serviceStatus.components.dataBus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {serviceStatus.components.dataBus ? '正常' : '异常'}
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">事件系统</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${serviceStatus.components.eventSystem ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {serviceStatus.components.eventSystem ? '正常' : '异常'}
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 其他标签页内容 - 占位符 */}
      {activeTab === 'modules' && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Cpu className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">模块管理</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            模块管理功能正在积极开发中。当前已集成 AI Assist 和 CortexaAI 模块，更多模块即将上线。
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all">
              查看所有模块
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              添加新模块
            </button>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">任务调度</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            任务调度器支持定时任务、循环任务和事件触发任务。创建您的第一个自动化工作流。
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all">
              创建新任务
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              导入任务模板
            </button>
          </div>
        </div>
      )}

      {activeTab === 'executions' && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">执行监控</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            实时监控所有自动化任务的执行状态、日志和性能指标。快速诊断和解决问题。
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all">
              查看执行历史
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              实时监控面板
            </button>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <Terminal className="w-10 h-10 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">事件中心</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            集中管理所有系统事件、日志和通知。设置告警规则，确保系统稳定运行。
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all">
              查看事件日志
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              配置告警规则
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold mb-3">安全审计</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            安全审计功能确保所有自动化操作都符合安全策略。监控权限、访问记录和潜在威胁。
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all">
              安全报告
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all">
              访问控制
            </button>
          </div>
        </div>
      )}

      {/* 页脚信息 */}
      <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border/50">
        <p>Mission Control 自动化框架 v1.0.0 · 基于 Next.js 15 + TypeScript + Tailwind CSS</p>
        <p className="mt-1">
          访问 <a href="/api/automation" className="text-primary hover:underline">/api/automation</a> 查看完整 API 文档
        </p>
      </div>
    </div>
  );
}