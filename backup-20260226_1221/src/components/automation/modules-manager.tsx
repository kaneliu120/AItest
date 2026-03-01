'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Cpu, Settings, Play, Pause, Trash2, Edit, Eye, 
  Download, Upload, RefreshCw, CheckCircle, XCircle,
  AlertTriangle, Package, Zap, Shield, BarChart3, Globe, Plus
} from 'lucide-react';

interface AutomationModule {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  category: 'testing' | 'deployment' | 'monitoring' | 'security' | 'business' | 'integration';
  dependencies: string[];
  configSchema?: Record<string, any>;
  metadata: {
    installedAt: string;
    updatedAt: string;
    lastRun?: string;
    runCount: number;
    successRate: number;
  };
}

interface ModuleHealth {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  issues: string[];
  lastRun: string | null;
  successRate: number;
}

export default function ModulesManager() {
  const [modules, setModules] = useState<AutomationModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [newModule, setNewModule] = useState({
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    author: '',
    category: 'testing' as const,
    dependencies: [] as string[],
  });
  const [importData, setImportData] = useState('');

  // 获取所有模块
  const fetchModules = async () => {
    try {
      const response = await fetch('/api/automation?action=modules');
      const data = await response.json();
      if (data.success) {
        setModules(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  };

  // 启用/禁用模块
  const toggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-module',
          moduleId,
          enabled
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchModules();
      }
    } catch (error) {
      console.error('Failed to toggle module:', error);
    }
  };

  // 注册新模块
  const registerModule = async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register-module',
          moduleData: {
            ...newModule,
            enabled: true
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowRegisterDialog(false);
        setNewModule({
          id: '',
          name: '',
          version: '1.0.0',
          description: '',
          author: '',
          category: 'testing',
          dependencies: [],
        });
        fetchModules();
      }
    } catch (error) {
      console.error('Failed to register module:', error);
    }
  };

  // 导入模块
  const importModule = async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import-state',
          stateJson: importData
        })
      });
      const data = await response.json();
      if (data.success) {
        setShowImportDialog(false);
        setImportData('');
        fetchModules();
      }
    } catch (error) {
      console.error('Failed to import module:', error);
    }
  };

  // 导出模块
  const exportModule = async (moduleId: string) => {
    try {
      // 这里需要实现导出逻辑
      console.log('Export module:', moduleId);
    } catch (error) {
      console.error('Failed to export module:', error);
    }
  };

  // 获取模块健康状态
  const getModuleHealth = (module: AutomationModule): ModuleHealth => {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'healthy';

    // 检查依赖
    if (module.dependencies.length > 0) {
      const missingDeps = module.dependencies.filter(dep => 
        !modules.some(m => m.id === dep && m.enabled)
      );
      if (missingDeps.length > 0) {
        issues.push(`缺少依赖: ${missingDeps.join(', ')}`);
        status = 'error';
      }
    }

    // 检查运行状态
    if (module.metadata.runCount > 0 && module.metadata.successRate < 80) {
      issues.push(`成功率较低: ${module.metadata.successRate}%`);
      status = status === 'error' ? 'error' : 'warning';
    }

    // 检查最近运行时间
    if (module.metadata.lastRun) {
      const lastRun = new Date(module.metadata.lastRun);
      const now = new Date();
      const hoursSinceLastRun = (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastRun > 24 && module.metadata.runCount > 0) {
        issues.push(`长时间未运行: ${Math.round(hoursSinceLastRun)}小时`);
        status = status === 'error' ? 'error' : 'warning';
      }
    }

    return {
      status,
      issues,
      lastRun: module.metadata.lastRun || null,
      successRate: module.metadata.successRate
    };
  };

  // 获取类别图标
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'testing': return <Zap className="h-4 w-4" />;
      case 'deployment': return <Package className="h-4 w-4" />;
      case 'monitoring': return <BarChart3 className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'business': return <Globe className="h-4 w-4" />;
      case 'integration': return <Settings className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'deployment': return 'bg-blue-100 text-blue-800';
      case 'monitoring': return 'bg-green-100 text-green-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'business': return 'bg-yellow-100 text-yellow-800';
      case 'integration': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 初始加载
  useEffect(() => {
    fetchModules();
    const interval = setInterval(fetchModules, 30000); // 每30秒更新一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">加载模块列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">模块管理</h2>
          <p className="text-muted-foreground">
            管理自动化模块，监控模块健康状态
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchModules}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                导入
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>导入模块</DialogTitle>
                <DialogDescription>
                  粘贴模块配置JSON数据
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="粘贴模块配置JSON..."
                className="min-h-[200px] font-mono text-sm"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  取消
                </Button>
                <Button onClick={importModule}>
                  导入
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
            <DialogTrigger>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                注册新模块
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>注册新模块</DialogTitle>
                <DialogDescription>
                  填写模块信息以注册新的自动化模块
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="module-id">模块ID</Label>
                  <Input
                    id="module-id"
                    value={newModule.id}
                    onChange={(e) => setNewModule({...newModule, id: e.target.value})}
                    placeholder="例如: test-automation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-name">模块名称</Label>
                  <Input
                    id="module-name"
                    value={newModule.name}
                    onChange={(e) => setNewModule({...newModule, name: e.target.value})}
                    placeholder="例如: 测试自动化模块"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-version">版本</Label>
                  <Input
                    id="module-version"
                    value={newModule.version}
                    onChange={(e) => setNewModule({...newModule, version: e.target.value})}
                    placeholder="例如: 1.0.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="module-category">类别</Label>
                  <Select
                    value={newModule.category}
                    onValueChange={(value: any) => setNewModule({...newModule, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="testing">测试</SelectItem>
                      <SelectItem value="deployment">部署</SelectItem>
                      <SelectItem value="monitoring">监控</SelectItem>
                      <SelectItem value="security">安全</SelectItem>
                      <SelectItem value="business">业务</SelectItem>
                      <SelectItem value="integration">集成</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="module-description">描述</Label>
                  <Textarea
                    id="module-description"
                    value={newModule.description}
                    onChange={(e) => setNewModule({...newModule, description: e.target.value})}
                    placeholder="模块功能描述..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="module-author">作者</Label>
                  <Input
                    id="module-author"
                    value={newModule.author}
                    onChange={(e) => setNewModule({...newModule, author: e.target.value})}
                    placeholder="例如: 小A"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="module-dependencies">依赖模块 (逗号分隔)</Label>
                  <Input
                    id="module-dependencies"
                    value={newModule.dependencies.join(', ')}
                    onChange={(e) => setNewModule({
                      ...newModule, 
                      dependencies: e.target.value.split(',').map(d => d.trim()).filter(d => d)
                    })}
                    placeholder="例如: module1, module2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRegisterDialog(false)}>
                  取消
                </Button>
                <Button onClick={registerModule}>
                  注册模块
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 模块统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{modules.length}</div>
              <p className="text-sm text-muted-foreground">总模块数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {modules.filter(m => m.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">启用模块</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {modules.filter(m => !m.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">禁用模块</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {modules.length > 0 
                  ? Math.round(modules.reduce((sum, m) => sum + m.metadata.successRate, 0) / modules.length)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">平均成功率</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模块列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module) => {
          const health = getModuleHealth(module);
          const healthColor = {
            healthy: 'text-green-500',
            warning: 'text-yellow-500',
            error: 'text-red-500',
            unknown: 'text-gray-500'
          }[health.status];

          const healthIcon = {
            healthy: <CheckCircle className="h-4 w-4" />,
            warning: <AlertTriangle className="h-4 w-4" />,
            error: <XCircle className="h-4 w-4" />,
            unknown: <AlertTriangle className="h-4 w-4" />
          }[health.status];

          return (
            <Card key={module.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(module.category)}
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getCategoryColor(module.category)}>
                          {module.category}
                        </Badge>
                        <span className="text-xs">v{module.version}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleModule(module.id, !module.enabled)}
                    >
                      {module.enabled ? (
                        <Pause className="h-4 w-4 text-green-600" />
                      ) : (
                        <Play className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => exportModule(module.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{module.description}</p>
                
                {/* 健康状态 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={healthColor}>{healthIcon}</span>
                    <span className="text-sm font-medium capitalize">{health.status}</span>
                  </div>
                  <Badge variant={module.enabled ? 'default' : 'secondary'}>
                    {module.enabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>

                {/* 成功率进度条 */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-xs">
                    <span>成功率</span>
                    <span>{module.metadata.successRate}%</span>
                  </div>
                  <Progress value={module.metadata.successRate} className="h-2" />
                </div>

                {/* 统计信息 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运行次数:</span>
                    <span className="font-medium">{module.metadata.runCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">最后运行:</span>
                    <span className="font-medium">
                      {module.metadata.lastRun 
                        ? new Date(module.metadata.lastRun).toLocaleDateString()
                        : '从未'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">安装时间:</span>
                    <span className="font-medium">
                      {new Date(module.metadata.installedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">作者:</span>
                    <span className="font-medium">{module.author}</span>
                  </div>
                </div>

                {/* 依赖项 */}
                {module.dependencies.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">依赖模块:</p>
                    <div className="flex flex-wrap gap-1">
                      {module.dependencies.map(dep => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 问题列表 */}
                {health.issues.length > 0 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="font-medium text-red-700 mb-1">问题:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {health.issues.map((issue, index) => (
                        <li key={index} className="text-red-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <div className="px-6 py-3 bg-muted/50 border-t flex justify-between">
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Eye className="mr-1 h-3 w-3" />
                  查看详情
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Settings className="mr-1 h-3 w-3" />
                  配置
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {modules.length === 0 && (
        <Card className="text-center py-12">
          <Cpu className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">暂无模块</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            还没有注册任何自动化模块
          </p>
          <Button onClick={() => setShowRegisterDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            注册第一个模块
          </Button>
        </Card>
      )}
    </div>
  );
}