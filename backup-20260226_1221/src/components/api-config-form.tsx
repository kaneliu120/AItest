'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Key,
  Cloud,
  Server,
  Brain,
  Code,
  MessageSquare,
  Globe,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Wrench,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ApiConfigFormProps {
  apiId?: string;
  apiName?: string;
  provider?: string;
  category?: string;
  onSuccess?: () => Promise<void> | void;
}

export function ApiConfigForm({ apiId, apiName, provider, category, onSuccess }: ApiConfigFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: apiName || '',
    provider: provider || '',
    category: category || '',
    description: '',
    authType: 'api_key',
    apiKey: '',
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    serviceAccount: '',
    endpoint: '',
    projectId: '',
    accountId: '',
    region: '',
    tags: [] as string[],
  });

  const authTypes = [
    { value: 'api_key', label: 'API密钥' },
    { value: 'oauth', label: 'OAuth 2.0' },
    { value: 'token', label: '访问令牌' },
    { value: 'service_account', label: '服务账号' },
    { value: 'basic', label: '基本认证' },
    { value: 'none', label: '无需认证' },
  ];

  const categories = [
    { value: 'ai', label: '人工智能' },
    { value: 'cloud', label: '云服务' },
    { value: 'development', label: '开发工具' },
    { value: 'analytics', label: '数据分析' },
    { value: 'ads', label: '广告营销' },
    { value: 'social', label: '社交媒体' },
    { value: 'search', label: '搜索服务' },
    { value: 'audio', label: '音频处理' },
    { value: 'payment', label: '支付服务' },
    { value: 'other', label: '其他' },
  ];

  const providers = [
    { value: 'google', label: 'Google', icon: <Cloud className="h-4 w-4" /> },
    { value: 'openai', label: 'OpenAI', icon: <Brain className="h-4 w-4" /> },
    { value: 'anthropic', label: 'Anthropic', icon: <Brain className="h-4 w-4" /> },
    { value: 'deepseek', label: 'DeepSeek', icon: <Brain className="h-4 w-4" /> },
    { value: 'github', label: 'GitHub', icon: <Code className="h-4 w-4" /> },
    { value: 'azure', label: 'Azure', icon: <Server className="h-4 w-4" /> },
    { value: 'aws', label: 'AWS', icon: <Cloud className="h-4 w-4" /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'brave', label: 'Brave', icon: <Globe className="h-4 w-4" /> },
    { value: 'transcript', label: '转录服务', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'custom', label: '自定义', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        action: apiId ? 'update' : 'create',
        apiId,
        ...formData,
        tags: formData.tags.length > 0 ? formData.tags : ['new'],
      };

      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOpen(false);
        if (onSuccess) {
          const result = onSuccess();
          if (result && typeof result.then === 'function') {
            result.catch(err => console.error('onSuccess callback failed:', err));
          }
        }
        // 重置表单
        if (!apiId) {
          setFormData({
            name: '',
            provider: '',
            category: '',
            description: '',
            authType: 'api_key',
            apiKey: '',
            clientId: '',
            clientSecret: '',
            refreshToken: '',
            serviceAccount: '',
            endpoint: '',
            projectId: '',
            accountId: '',
            region: '',
            tags: [],
          });
        }
      }
    } catch (error) {
      console.error('保存API配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiId) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', apiId }),
      });

      if (res.ok) {
        alert('连接测试成功！');
      } else {
        alert('连接测试失败，请检查配置。');
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      alert('测试连接时发生错误。');
    } finally {
      setLoading(false);
    }
  };

  const handleReauth = async () => {
    if (!apiId) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reauth', 
          apiId,
          ...formData 
        }),
      });

      if (res.ok) {
        alert('重新认证成功！');
        if (onSuccess) {
          const result = onSuccess();
          if (result && typeof result.then === 'function') {
            result.catch(err => console.error('onSuccess callback failed:', err));
          }
        }
      } else {
        alert('重新认证失败，请检查配置。');
      }
    } catch (error) {
      console.error('重新认证失败:', error);
      alert('重新认证时发生错误。');
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (providerValue: string) => {
    const provider = providers.find(p => p.value === providerValue);
    return provider?.icon || <Settings className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {apiId ? (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            配置
          </Button>
        ) : (
          <Button>
            <Key className="h-4 w-4 mr-2" />
            添加新API
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getProviderIcon(formData.provider)}
            {apiId ? '配置API' : '添加新API'}
          </DialogTitle>
          <DialogDescription>
            {apiId 
              ? `配置 ${apiName} 的认证信息和设置`
              : '添加新的外部API服务集成'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">基本信息</CardTitle>
              <CardDescription>API的基本标识信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">API名称 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="例如: Google Analytics 4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">服务提供商 *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({...formData, provider: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择提供商" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map(provider => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center gap-2">
                            {provider.icon}
                            {provider.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">类别 *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authType">认证类型 *</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={(value) => setFormData({...formData, authType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择认证类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {authTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="API的功能和用途描述"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">API端点 (可选)</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                  placeholder="https://api.example.com/v1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 认证信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">认证信息</CardTitle>
              <CardDescription>API访问凭证和密钥</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.authType === 'api_key' && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API密钥 *</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={formData.apiKey}
                      onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
                      placeholder="sk-..."
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {formData.authType === 'oauth' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">客户端ID *</Label>
                      <Input
                        id="clientId"
                        value={formData.clientId}
                        onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                        placeholder="客户端ID"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">客户端密钥 *</Label>
                      <div className="relative">
                        <Input
                          id="clientSecret"
                          type={showClientSecret ? "text" : "password"}
                          value={formData.clientSecret}
                          onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                          placeholder="客户端密钥"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                        >
                          {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refreshToken">刷新令牌 (可选)</Label>
                    <Input
                      id="refreshToken"
                      type="password"
                      value={formData.refreshToken}
                      onChange={(e) => setFormData({...formData, refreshToken: e.target.value})}
                      placeholder="刷新令牌"
                    />
                  </div>
                </>
              )}

              {formData.authType === 'service_account' && (
                <div className="space-y-2">
                  <Label htmlFor="serviceAccount">服务账号JSON (可选)</Label>
                  <Textarea
                    id="serviceAccount"
                    value={formData.serviceAccount}
                    onChange={(e) => setFormData({...formData, serviceAccount: e.target.value})}
                    placeholder="粘贴服务账号JSON内容"
                    rows={4}
                  />
                </div>
              )}

              {/* 项目信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">项目ID (可选)</Label>
                  <Input
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    placeholder="项目ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">账号ID (可选)</Label>
                  <Input
                    id="accountId"
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    placeholder="账号ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">区域 (可选)</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="例如: us-east-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 标签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">标签</CardTitle>
              <CardDescription>用于分类和搜索的标签</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>常用标签</Label>
                <div className="flex flex-wrap gap-2">
                  {['ai', 'cloud', 'api', 'development', 'analytics', 'production', 'test'].map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const newTags = formData.tags.includes(tag)
                          ? formData.tags.filter(t => t !== tag)
                          : [...formData.tags, tag];
                        setFormData({...formData, tags: newTags});
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            {apiId && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={loading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  测试连接
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReauth}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新认证
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  保存中...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {apiId ? '更新配置' : '添加API'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
