'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Cloud,
  Brain,
  Code,
  Server,
  Globe,
  MessageSquare
} from 'lucide-react';

interface Api {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  status: string;
  lastResponseTime: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

interface Stats {
  totalApis: number;
  activeApis: number;
  inactiveApis: number;
  pendingApis: number;
  errorApis: number;
  avgResponseTime: number;
  totalCalls: number;
  successRate: number;
}

interface Alert {
  id: string;
  apiId: string;
  apiName: string;
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface ClientInteractivePartProps {
  initialApis: Api[];
  initialStats: Stats | null;
  initialAlerts: Alert[];
}

export default function ClientInteractivePart({ 
  initialApis, 
  initialStats, 
  initialAlerts 
}: ClientInteractivePartProps) {
  const [apis] = useState<Api[]>(initialApis);
  const [stats] = useState<Stats | null>(initialStats);
  const [alerts] = useState<Alert[]>(initialAlerts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Filter logic
  const filteredApis = apis.filter(api => {
    // Search filter
    if (searchQuery && !api.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !api.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Provider filter
    if (filterProvider !== 'all' && api.provider !== filterProvider) {
      return false;
    }
    
    // Category filter
    if (filterCategory !== 'all' && api.category !== filterCategory) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && api.status !== filterStatus) {
      return false;
    }
    
    return true;
  });

  // Get provider list
  const providers = Array.from(new Set(apis.map(api => api.provider)));
  
  // Get category list
  const categories = Array.from(new Set(apis.map(api => api.category)));

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'google': return <Cloud className="h-4 w-4" />;
      case 'openai': return <Brain className="h-4 w-4" />;
      case 'anthropic': return <Brain className="h-4 w-4" />;
      case 'deepseek': return <Brain className="h-4 w-4" />;
      case 'github': return <Code className="h-4 w-4" />;
      case 'azure': return <Server className="h-4 w-4" />;
      case 'aws': return <Cloud className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'brave': return <Globe className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  return (
    <>
      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApis}</div>
              <div className="text-xs text-muted-foreground">
                Active: {stats.activeApis} | Inactive: {stats.inactiveApis}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
              <div className="text-xs text-muted-foreground">
                Total Calls: {stats.totalCalls}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
              <Progress value={stats.successRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <div className="text-xs text-muted-foreground">
                Unresolved: {alerts.filter(a => !a.resolved).length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search API name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Setup</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">External API List</CardTitle>
          <CardDescription>
            Total {filteredApis.length} APIs, showing 1 - {Math.min(filteredApis.length, 10)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 w-[200px] lg:w-[250px]">API Name</th>
                  <th className="text-left p-4 hidden sm:table-cell">Provider</th>
                  <th className="text-left p-4 hidden md:table-cell">Category</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4 hidden lg:table-cell">Response Time</th>
                  <th className="text-left p-4 hidden lg:table-cell">Call Stats</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.slice(0, 10).map((api) => (
                  <tr key={api.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <div className="font-medium">{api.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {api.description}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(api.provider)}
                        <span>{api.provider}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant="outline">{api.category}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(api.status)}
                        <span className="capitalize">{api.status}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {api.lastResponseTime}ms
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-xs">
                        {api.successfulCalls}/{api.totalCalls} ({api.totalCalls > 0 ? Math.round((api.successfulCalls / api.totalCalls) * 100) : 0}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredApis.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No matching APIs found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operation guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Operation Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Add New API
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>1. Click the "Add API" button</li>
                <li>2. Fill in the basic API information</li>
                <li>3. Configure authentication</li>
                <li>4. Save and test the connection</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Troubleshooting
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Check if API keys are expired</li>
                <li>• Verify network connectivity</li>
                <li>• Check API quota limits</li>
                <li>• Review error log details</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Security Best Practices
              </h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Rotate API keys regularly</li>
                <li>• Use least-privilege access</li>
                <li>• Monitor for abnormal call patterns</li>
                <li>• Enable API usage auditing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-slate-500 pt-4">
        <p>External API data refreshes every 60s • Last updated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Supports: Google APIs • OpenAI • Anthropic • GitHub • Azure • LinkedIn • Brave Search</p>
      </div>
    </>
  );
}