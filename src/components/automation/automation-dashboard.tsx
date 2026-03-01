'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, Pause, RefreshCw, Settings, Plus, 
  BarChart3, Cpu, Clock, AlertCircle, CheckCircle,
  Zap, Server, Database, Bell, Activity
} from 'lucide-react';
import ModulesManager from './modules-manager';
import TasksScheduler from './tasks-scheduler';
import ExecutionsMonitor from './executions-monitor';
// import EventsViewer from './events-viewer'; // Disabled
import FaultDiagnosisDashboard from './fault-diagnosis-dashboard';

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
  lastError?: string;
}

export default function AutomationDashboard() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch service status
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

  // Restart service
  const restartService = async () => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      });
      const data = await response.json();
      if (data.success) {
        setTimeout(fetchServiceStatus, 2000); // Re-fetch status after 2s
      }
    } catch (error) {
      console.error('Failed to restart service:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 10000); // Update every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading automation service status...</p>
        </div>
      </div>
    );
  }

  if (!serviceStatus) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="mt-4 text-lg font-semibold">Cannot connect to automation service</h3>
        <p className="text-muted-foreground mt-2">Please check if the service is running</p>
        <Button onClick={fetchServiceStatus} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  const statusColor = {
    starting: 'text-yellow-500',
    running: 'text-green-500',
    stopping: 'text-yellow-500',
    stopped: 'text-gray-500',
    error: 'text-red-500'
  }[serviceStatus.status];

  const statusText = {
    starting: 'Starting',
    running: 'Running',
    stopping: 'Stopping',
    stopped: 'Stopped',
    error: 'Error'
  }[serviceStatus.status];

  return (
    <div className="space-y-6">
      {/* Header status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Control Center</h1>
          <p className="text-muted-foreground">
            Modular automation framework · Real-time monitoring · Smart scheduling
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColor} animate-pulse`} />
            <span className="font-medium">{statusText}</span>
            <Badge variant="outline" className="ml-2">
              Uptime: {Math.floor(serviceStatus.uptime / 60)}min
            </Badge>
          </div>
          <Button onClick={restartService} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Restart Service
          </Button>
        </div>
      </div>

      {/* Status card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cpu className="mr-2 h-4 w-4" />
              Module Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.enabledModules}/{serviceStatus.stats.totalModules}
                </div>
                <p className="text-xs text-muted-foreground">Enabled/Total</p>
              </div>
              <Badge variant={serviceStatus.components.moduleManager ? 'default' : 'destructive'}>
                {serviceStatus.components.moduleManager ? 'OK' : 'Error'}
              </Badge>
            </div>
            <Progress 
              value={(serviceStatus.stats.enabledModules / Math.max(serviceStatus.stats.totalModules, 1)) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Task status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Task Scheduler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.enabledTasks}/{serviceStatus.stats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground">Enabled/Total</p>
              </div>
              <Badge variant={serviceStatus.components.taskScheduler ? 'default' : 'destructive'}>
                {serviceStatus.components.taskScheduler ? 'OK' : 'Error'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Active: </span>
              <span className="font-medium">{serviceStatus.stats.activeExecutions}</span>
            </div>
          </CardContent>
        </Card>

        {/* Event status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Event System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.totalEvents.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
              <Badge variant={serviceStatus.components.eventSystem ? 'default' : 'destructive'}>
                {serviceStatus.components.eventSystem ? 'OK' : 'Error'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Messages: </span>
              <span className="font-medium">{serviceStatus.stats.totalMessages.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Data bus status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="mr-2 h-4 w-4" />
              Data Bus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {serviceStatus.stats.totalMessages.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Messages</p>
              </div>
              <Badge variant={serviceStatus.components.dataBus ? 'default' : 'destructive'}>
                {serviceStatus.components.dataBus ? 'OK' : 'Error'}
              </Badge>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Channels: </span>
              <span className="font-medium">4</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main feature tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center">
            <Cpu className="mr-2 h-4 w-4" />
            Module Management
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Task Scheduler
          </TabsTrigger>
          <TabsTrigger value="executions" className="flex items-center">
            <Play className="mr-2 h-4 w-4" />
            Execution Monitor
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Event Viewer
          </TabsTrigger>
          <TabsTrigger value="fault-diagnosis" className="flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            Fault Diagnosis
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>
                Overall automation framework status and key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Component Health */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Component Health</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(serviceStatus.components).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <Badge variant={value ? 'default' : 'destructive'}>
                          {value ? 'OK' : 'Error'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Register New Module
                    </Button>
                    <Button variant="outline" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Create Scheduled Task
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Stats Report
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      System Settings
                    </Button>
                  </div>
                </div>

                {/* System Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Info</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service Status:</span>
                        <span className="font-medium">{statusText}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime:</span>
                        <span className="font-medium">
                          {Math.floor(serviceStatus.uptime / 3600)}h {Math.floor((serviceStatus.uptime % 3600) / 60)}m
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last updated:</span>
                        <span className="font-medium">Just now</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Version:</span>
                        <span className="font-medium">v1.0.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module management tab */}
        <TabsContent value="modules">
          <ModulesManager />
        </TabsContent>

        {/* Task scheduler tab */}
        <TabsContent value="tasks">
          <TasksScheduler />
        </TabsContent>

        {/* Execution monitor tab */}
        <TabsContent value="executions">
          <ExecutionsMonitor />
        </TabsContent>

        {/* Event viewer tab */}
        <TabsContent value="events">
          <div className="p-8 text-center text-gray-500">
            Event viewer coming soon...
          </div>
        </TabsContent>

        {/* Fault diagnosis tab */}
        <TabsContent value="fault-diagnosis">
          <FaultDiagnosisDashboard />
        </TabsContent>
      </Tabs>
      </div>

      {/* Error display */}
      {serviceStatus.lastError && (
        <Card className="border-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" />
              Service Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{serviceStatus.lastError}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={restartService}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Restarting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}