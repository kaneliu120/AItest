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

interface ClientInteractivePartProps {
  initialApis: Api[];
}

export default function ClientInteractivePart({ initialApis }: ClientInteractivePartProps) {
  const [apis] = useState<Api[]>(initialApis);
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
  
  // Provider options
  const providerOptions = [
    { value: 'all', label: 'All Providers' },
    { value: 'google', label: 'Google' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'anthropic', label: 'Anthropic' },
    { value: 'deepseek', label: 'DeepSeek' },
    { value: 'github', label: 'GitHub' },
    { value: 'azure', label: 'Azure' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'brave', label: 'Brave' }
  ];
  
  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'ai', label: 'Artificial Intelligence' },
    { value: 'cloud', label: 'Cloud Services' },
    { value: 'dev', label: 'Dev MCP' },
    { value: 'analytics', label: 'Data Analytics' },
    { value: 'ads', label: 'Ad Marketing' },
    { value: 'social', label: 'Social Media' },
    { value: 'search', label: 'Search Services' }
  ];
  
  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending Setup' },
    { value: 'error', label: 'Error' }
  ];
  
  // Get provider icon
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google': return <Cloud className="h-4 w-4" />;
      case 'openai': return <Brain className="h-4 w-4" />;
      case 'anthropic': return <Brain className="h-4 w-4" />;
      case 'deepseek': return <Brain className="h-4 w-4" />;
      case 'github': return <Code className="h-4 w-4" />;
      case 'azure': return <Server className="h-4 w-4" />;
      case 'linkedin': return <MessageSquare className="h-4 w-4" />;
      case 'brave': return <Globe className="h-4 w-4" />;
      default: return <Cloud className="h-4 w-4" />;
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="outline">Inactive</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><AlertTriangle className="h-3 w-3 mr-1" />Pending Setup</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <>
      {/* Search and filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search API name or description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
              >
                {providerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select 
                className="w-[140px] px-3 py-2 border rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* API list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">External API List</CardTitle>
          <p className="text-sm text-slate-500">
            Total {filteredApis.length} APIs, showing 1 - {Math.min(filteredApis.length, 10)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 font-medium text-slate-500 w-[200px] lg:w-[250px]">API Name</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden sm:table-cell">Provider</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden md:table-cell">Category</th>
                  <th className="text-left py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden lg:table-cell">Response Time</th>
                  <th className="text-left py-3 font-medium text-slate-500 hidden lg:table-cell">Call Stats</th>
                  <th className="text-right py-3 font-medium text-slate-500 w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApis.slice(0, 10).map(api => (
                  <tr key={api.id} className="border-b hover:bg-slate-50">
                    <td className="py-3">
                      <div className="font-medium">{api.name}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{api.description}</div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getProviderIcon(api.provider)}
                        <span className="capitalize">{api.provider}</span>
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {api.category}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {getStatusBadge(api.status)}
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        {api.lastResponseTime > 0 ? `${api.lastResponseTime}ms` : 'N/A'}
                      </div>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        {api.totalCalls} calls
                        <div className="text-xs text-slate-500">
                          ✅ {api.successfulCalls} / ❌ {api.failedCalls}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredApis.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No matching APIs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}