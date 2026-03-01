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
  
  // Form state
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
    { value: 'api_key', label: 'API Key' },
    { value: 'oauth', label: 'OAuth 2.0' },
    { value: 'token', label: 'Access Token' },
    { value: 'service_account', label: 'Service Account' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'none', label: 'No Auth' },
  ];

  const categories = [
    { value: 'ai', label: 'AI' },
    { value: 'cloud', label: 'Cloud Services' },
    { value: 'development', label: 'Development MCP' },
    { value: 'analytics', label: 'Data Analytics' },
    { value: 'ads', label: 'Advertising' },
    { value: 'social', label: 'Social Media' },
    { value: 'search', label: 'Search Services' },
    { value: 'audio', label: 'Audio Processing' },
    { value: 'payment', label: 'Payment Services' },
    { value: 'other', label: 'Other' },
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
    { value: 'transcript', label: 'Transcription', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'custom', label: 'Custom', icon: <Settings className="h-4 w-4" /> },
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
        // Reset form
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
      console.error('Failed to save API config:', error);
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
        alert('Connection test successful!');
      } else {
        alert('Connection test failed, please check configuration.');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      alert('Error occurred during connection test.');
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
        alert('Re-authentication successful!');
        if (onSuccess) {
          const result = onSuccess();
          if (result && typeof result.then === 'function') {
            result.catch(err => console.error('onSuccess callback failed:', err));
          }
        }
      } else {
        alert('Re-authentication failed, please check configuration.');
      }
    } catch (error) {
      console.error('Re-authentication failed:', error);
      alert('Error occurred during re-authentication.');
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
            Configure
          </Button>
        ) : (
          <Button>
            <Key className="h-4 w-4 mr-2" />
            Add New API
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getProviderIcon(formData.provider)}
            {apiId ? 'Configure API' : 'Add New API'}
          </DialogTitle>
          <DialogDescription>
            {apiId 
              ? `Configure authentication and settings for ${apiName}`
              : 'Add new external API service integration'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
              <CardDescription>Basic API identification info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">API Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Google Analytics 4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Service Provider *</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({...formData, provider: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Provider" />
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
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({...formData, category: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
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
                  <Label htmlFor="authType">Auth Type *</Label>
                  <Select
                    value={formData.authType}
                    onValueChange={(value) => setFormData({...formData, authType: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Auth Type" />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe API functionality and purpose"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint (optional)</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                  placeholder="https://api.example.com/v1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Authentication</CardTitle>
              <CardDescription>API access credentials and keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.authType === 'api_key' && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
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
                      <Label htmlFor="clientId">Client ID *</Label>
                      <Input
                        id="clientId"
                        value={formData.clientId}
                        onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                        placeholder="Client ID"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clientSecret">Client Secret *</Label>
                      <div className="relative">
                        <Input
                          id="clientSecret"
                          type={showClientSecret ? "text" : "password"}
                          value={formData.clientSecret}
                          onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                          placeholder="Client Secret"
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
                    <Label htmlFor="refreshToken">Refresh Token (optional)</Label>
                    <Input
                      id="refreshToken"
                      type="password"
                      value={formData.refreshToken}
                      onChange={(e) => setFormData({...formData, refreshToken: e.target.value})}
                      placeholder="Refresh Token"
                    />
                  </div>
                </>
              )}

              {formData.authType === 'service_account' && (
                <div className="space-y-2">
                  <Label htmlFor="serviceAccount">Service Account JSON (optional)</Label>
                  <Textarea
                    id="serviceAccount"
                    value={formData.serviceAccount}
                    onChange={(e) => setFormData({...formData, serviceAccount: e.target.value})}
                    placeholder="Paste service account JSON content"
                    rows={4}
                  />
                </div>
              )}

              {/* Project info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID (optional)</Label>
                  <Input
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    placeholder="Project ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID (optional)</Label>
                  <Input
                    id="accountId"
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    placeholder="Account ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region (optional)</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="e.g. us-east-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tags</CardTitle>
              <CardDescription>Tags for categorization and search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Common Tags</Label>
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
                  Test Connection
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReauth}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-authenticate
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {apiId ? 'Update Config' : 'Add API'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
