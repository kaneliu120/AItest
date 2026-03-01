'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Edit,
  Trash2,
  TestTube,
  Key,
  Settings,
  Eye,
  EyeOff,
  Download,
  Upload,
  Shield,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Server,
  Cloud,
  Brain,
  Code,
  MessageSquare,
  Globe,
  Wrench,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ExternalApi {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  authType: string;
  status: 'active' | 'inactive' | 'needs_setup' | 'error';
  lastChecked: string;
  lastResponseTime: number | null;
  lastStatusCode: number | null;
  lastError: string | null;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  rateLimit: number | null;
  rateLimitPeriod: string | null;
  quotaUsed: number | null;
  quotaLimit: number | null;
  quotaResetAt: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function DetailedExternalApisPage() {
  const [apis, setApis] = useState<ExternalApi[]>([]);
  const [filteredApis, setFilteredApis] = useState<ExternalApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Show/hide sensitive info
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchApis();
  }, []);

  useEffect(() => {
    filterAndPaginateApis();
  }, [apis, searchQuery, categoryFilter, statusFilter, providerFilter, currentPage, pageSize]);

  const fetchApis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/external-apis');
      const data = await res.json();
      if (data.success) {
        setApis(data.data.apis || []);
      }
    } catch (error) {
      console.error('Failed to fetch API list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndPaginateApis = () => {
    let filtered = [...apis];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(api => 
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.provider.toLowerCase().includes(query) ||
        api.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(api => api.category === categoryFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(api => api.status === statusFilter);
    }
    
    // Provider filter
    if (providerFilter !== 'all') {
      filtered = filtered.filter(api => api.provider === providerFilter);
    }
    
    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / pageSize);
    setTotalPages(pages);
    
    // Ensure current page is valid
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
    
    // Get current page data
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);
    
    setFilteredApis(paginated);
  };

  const handleCheckApi = async (apiId: string) => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', apiId }),
      });
      if (res.ok) {
        fetchApis(); // refresh data
      }
    } catch (error) {
      console.error('Failed to check API:', error);
    }
  };

  const handleCheckAll = async () => {
    try {
      const res = await fetch('/api/external-apis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-all' }),
      });
      if (res.ok) {
        fetchApis(); // refresh data
      }
    } catch (error) {
      console.error('Failed to check all APIs:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_setup': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'needs_setup': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'needs_setup': return 'Needs Setup';
      case 'error': return 'Error';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider.includes('google')) return <Cloud className="h-4 w-4" />;
    if (provider.includes('openai')) return <Brain className="h-4 w-4" />;
    if (provider.includes('anthropic')) return <Brain className="h-4 w-4" />;
    if (provider.includes('deepseek')) return <Brain className="h-4 w-4" />;
    if (provider.includes('github')) return <Code className="h-4 w-4" />;
    if (provider.includes('azure')) return <Server className="h-4 w-4" />;
    if (provider.includes('linkedin')) return <MessageSquare className="h-4 w-4" />;
    if (provider.includes('brave')) return <Globe className="h-4 w-4" />;
    if (provider.includes('transcript')) return <MessageSquare className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  // Client-side time formatting component
  const ClientFormattedTime = ({ timestamp }: { timestamp: string }) => {
    const [formattedTime, setFormattedTime] = useState('');
    
    useEffect(() => {
      const date = new Date(timestamp);
      setFormattedTime(date.toLocaleString('en-US'));
    }, [timestamp]);
    
    return <span>{formattedTime || 'Loading...'}</span>;
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getCategories = () => {
    const categories = new Set(apis.map(api => api.category));
    return Array.from(categories);
  };

  const getProviders = () => {
    const providers = new Set(apis.map(api => api.provider));
    return Array.from(providers);
  };

  const getStatuses = () => {
    const statuses = new Set(apis.map(api => api.status));
    return Array.from(statuses);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: string) => {
    setPageSize(parseInt(size));
    setCurrentPage(1); // Reset to first page
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Loading external API data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Page title and actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">External API Detailed List</h1>
          <p className="text-gray-500 mt-2">
            Detailed information and configuration for all integrated external APIs and CLI MCPs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchApis}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCheckAll}>
            <TestTube className="h-4 w-4 mr-2" />
            Check All APIs
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add API
          </Button>
        </div>
      </div>

      {/* Filter and search bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search API name, description, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {getStatuses().map(status => (
                    <SelectItem key={status} value={status}>
                      {getStatusText(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Provider</label>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {getProviders().map(provider => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API list table */}
      <Card>
        <CardHeader>
          <CardTitle>API List</CardTitle>
          <CardDescription>
            Total {apis.length} APIs, showing {filteredApis.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Auth Type</TableHead>
                <TableHead>Last Checked</TableHead>
                <TableHead>Call Stats</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApis.map((api) => (
                <TableRow key={api.id}>
                  <TableCell>
                    <Badge className={getStatusColor(api.status)}>
                      {getStatusIcon(api.status)}
                      <span className="ml-1">{getStatusText(api.status)}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getProviderIcon(api.provider)}
                      <div className="ml-2">
                        <div className="font-medium">{api.name}</div>
                        <div className="text-xs text-gray-500">{api.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{api.provider}</div>
                    <div className="text-xs text-gray-500">
                      {api.tags.slice(0, 2).join(', ')}
                      {api.tags.length > 2 && '...'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{api.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{api.authType}</div>
                    <div className="text-xs text-gray-500">
                      {api.status === 'needs_setup' ? 'Needs Setup' : 'Configured'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatRelativeTime(api.lastChecked)}</div>
                    <div className="text-xs text-gray-500">
                      {api.lastResponseTime ? `${api.lastResponseTime}ms` : 'Not checked'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      Success: {api.successfulCalls}/{api.totalCalls}
                    </div>
                    <div className="text-xs text-gray-500">
                      Avg: {api.averageResponseTime}ms
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCheckApi(api.id)}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Check
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Config
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" />
                            {showSensitiveInfo[api.id] ? 'Hide Keys' : 'Show Keys'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Re-authenticate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wrench className="h-4 w-4 mr-2" />
                            Manual Fix
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Stats
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete API
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination controls */}
          {apis.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, apis.length)} of {apis.length}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-600" />
              Key Management
            </CardTitle>
            <CardDescription>API keys and security configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Show/Hide All Keys
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security Audit
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export Key Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2 text-green-600" />
              Batch Operations
            </CardTitle>
            <CardDescription>Batch management and configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleCheckAll}>
                <TestTube className="h-4 w-4 mr-2" />
                Batch Check All APIs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Batch Refresh Tokens
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Batch Import Config
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Reports & Analytics
            </CardTitle>
            <CardDescription>Performance reports and data analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Download Detailed Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                View Historical Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Server className="h-4 w-4 mr-2" />
                Performance Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
