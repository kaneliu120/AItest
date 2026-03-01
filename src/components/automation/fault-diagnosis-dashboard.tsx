'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Bell, Search, Filter } from 'lucide-react';

interface FaultStatus {
  status: string;
  stats: {
    totalFaults: number;
    resolvedFaults: number;
    pendingFaults: number;
    criticalFaults: number;
  };
  lastCheck: string;
}

interface FaultItem {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  updatedAt: string;
  affectedServices: string[];
}

export default function FaultDiagnosisDashboard() {
  const [status, setStatus] = useState<FaultStatus>({
    status: 'healthy',
    stats: {
      totalFaults: 12,
      resolvedFaults: 8,
      pendingFaults: 3,
      criticalFaults: 1,
    },
    lastCheck: new Date().toISOString(),
  });

  const [faults, setFaults] = useState<FaultItem[]>([
    {
      id: 'fault-001',
      title: 'Database connection timeout',
      description: 'PostgreSQL connection pool exhausted, causing API response delays',
      severity: 'critical',
      status: 'investigating',
      createdAt: '2026-02-22T14:30:00Z',
      updatedAt: '2026-02-22T15:45:00Z',
      affectedServices: ['API Gateway', 'User Service', 'Payment Service'],
    },
    {
      id: 'fault-002',
      title: 'Memory leak detected',
      description: 'Node.js service memory usage keeps growing',
      severity: 'high',
      status: 'open',
      createdAt: '2026-02-21T09:15:00Z',
      updatedAt: '2026-02-21T09:15:00Z',
      affectedServices: ['Notification Service', 'Background Jobs'],
    },
    {
      id: 'fault-003',
      title: 'Third-party API rate limiting',
      description: 'Stripe API call frequency exceeded limit',
      severity: 'medium',
      status: 'resolved',
      createdAt: '2026-02-20T16:20:00Z',
      updatedAt: '2026-02-20T17:30:00Z',
      affectedServices: ['Payment Service'],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-red-100';
      case 'high': return 'bg-orange-500 text-orange-100';
      case 'medium': return 'bg-yellow-500 text-yellow-100';
      case 'low': return 'bg-blue-500 text-blue-100';
      default: return 'bg-gray-500 text-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const refreshData = async () => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStatus(prev => ({
      ...prev,
      lastCheck: new Date().toISOString(),
    }));
  };

  const filteredFaults = faults.filter(fault => {
    const matchesSearch = fault.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fault.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || fault.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || fault.status === statusFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Status overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.stats.totalFaults}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{status.stats.criticalFaults} critical</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{status.stats.resolvedFaults}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Resolution rate: {Math.round((status.stats.resolvedFaults / status.stats.totalFaults) * 100)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{status.stats.pendingFaults}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>Needs attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
              <span className="text-lg font-bold capitalize">{status.status}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Last check: {new Date(status.lastCheck).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search faults..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        
        <Button onClick={refreshData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Fault list */}
      <Card>
        <CardHeader>
          <CardTitle>Fault List</CardTitle>
          <CardDescription>
            {filteredFaults.length} faults found, {status.stats.pendingFaults} pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredFaults.length > 0 ? (
            <div className="space-y-4">
              {filteredFaults.map(fault => (
                <div key={fault.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{fault.title}</h3>
                        <Badge className={getSeverityColor(fault.severity)}>
                          {fault.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={fault.status === 'resolved' ? 'outline' : 'default'}>
                          {fault.status === 'open' ? 'Open' : 
                           fault.status === 'investigating' ? 'Investigating' : 'Resolved'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{fault.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>Created: {new Date(fault.createdAt).toLocaleDateString()}</div>
                      <div>Updated: {new Date(fault.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {fault.affectedServices.map(service => (
                        <span key={service} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {service}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {fault.status !== 'resolved' && (
                        <Button size="sm">
                          Start Handling
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No matching faults</p>
              <p className="text-sm mt-2">Try adjusting search criteria or refresh</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer status bar */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status.status)}`} />
            <span>Service status: {status.status}</span>
          </div>
          <div>Version: 1.0.0</div>
          <div>Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span>{status.stats.pendingFaults} pending faults</span>
        </div>
      </div>
    </div>
  );
}