'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play, Pause, RefreshCw, Eye, Filter, Search, 
  Clock, CheckCircle, XCircle, AlertTriangle,
  Download, Trash2, BarChart3, Calendar, Zap
} from 'lucide-react';

interface TaskExecution {
  id: string;
  taskId: string;
  taskName: string;
  moduleId: string;
  moduleName: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  result?: any;
  error?: string;
  retryCount: number;
  parameters?: Record<string, any>;
  metadata: {
    triggeredBy: 'schedule' | 'manual' | 'event';
    priority: number;
    tags: string[];
  };
}

interface ExecutionStats {
  totalExecutions: number;
  successRate: number;
  averageDuration: number;
  todayExecutions: number;
  activeExecutions: number;
  failedExecutions: number;
}

export default function ExecutionsMonitor() {
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [stats, setStats] = useState<ExecutionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'running' | 'success' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null);

  // Fetch executions
  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/automation?action=executions');
      const data = await response.json();
      if (data.success) {
        setExecutions(data.data.executions || []);
        setStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Trigger task manually
  const triggerTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger-task',
          taskId
        })
      });
      const data = await response.json();
      if (data.success) {
        // Show success message
        console.log('Task triggered:', data);
        // Refresh executions
        setTimeout(fetchExecutions, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger task:', error);
    }
  };

  // Cancel execution
  const cancelExecution = async (executionId: string) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel-execution',
          executionId
        })
      });
      const data = await response.json();
      if (data.success) {
        fetchExecutions();
      }
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'running': return <Play className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  };

  // Filter executions
  const filteredExecutions = executions.filter(exec => {
    // Status filter
    if (filter !== 'all' && exec.status !== filter) return false;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        exec.taskName.toLowerCase().includes(searchLower) ||
        exec.moduleName.toLowerCase().includes(searchLower) ||
        exec.id.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Initial load
  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading executions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Execution Monitor</h2>
          <p className="text-muted-foreground">
            Monitor task execution status and view results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchExecutions}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalExecutions}</div>
                <p className="text-sm text-muted-foreground">Total Executions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatDuration(stats.averageDuration)}</div>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.activeExecutions}</div>
                <p className="text-sm text-muted-foreground">Active Executions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{stats.failedExecutions}</div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search task name, module or execution ID..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="filter">Status Filter</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution list */}
      <div className="space-y-4">
        {filteredExecutions.map((exec) => (
          <Card key={exec.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(exec.status)}
                    {exec.taskName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{exec.moduleName}</Badge>
                    <Badge className={getStatusColor(exec.status)}>
                      {exec.status === 'success' ? 'Success' :
                       exec.status === 'running' ? 'Running' :
                       exec.status === 'failed' ? 'Failed' :
                       exec.status === 'pending' ? 'Pending' : 'Cancelled'}
                    </Badge>
                    <span className="text-xs">ID: {exec.id.substring(0, 8)}...</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  {exec.status === 'running' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelExecution(exec.id)}
                      title="Cancel Execution"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedExecution(selectedExecution === exec.id ? null : exec.id)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="font-medium">
                    {new Date(exec.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{formatDuration(exec.duration)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Retries</p>
                  <p className="font-medium">{exec.retryCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Trigger</p>
                  <p className="font-medium">
                    {exec.metadata.triggeredBy === 'schedule' ? 'Scheduled' :
                     exec.metadata.triggeredBy === 'manual' ? 'Manual' : 'Event'}
                  </p>
                </div>
              </div>

              {/* Expanded details */}
              {selectedExecution === exec.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Parameters */}
                  {exec.parameters && Object.keys(exec.parameters).length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Parameters:</p>
                      <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(exec.parameters, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Result */}
                  {exec.result && (
                    <div>
                      <p className="text-sm font-medium mb-2">Result:</p>
                      <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(exec.result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error */}
                  {exec.error && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-red-600">Error:</p>
                      <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto">
                        {exec.error}
                      </pre>
                    </div>
                  )}

                  {/* Tags */}
                  {exec.metadata.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {exec.metadata.tags.map(tag => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <div className="px-6 py-3 bg-muted/50 border-t flex justify-between">
              <div className="text-xs text-muted-foreground">
                Priority: {exec.metadata.priority}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => triggerTask(exec.taskId)}
              >
                <Zap className="mr-1 h-3 w-3" />
                Re-run
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredExecutions.length === 0 && (
        <Card className="text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No executions</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            {search || filter !== 'all' 
              ? 'No matching executions'
              : 'No execution records yet'}
          </p>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear Search
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}