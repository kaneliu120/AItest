// Hybrid component - server component fetches data, client component handles interaction

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import ClientInteractivePart from './client-part';

// Fetch API data
async function getApiData() {
  try {
    const response = await fetch('http://localhost:3000/api/external-apis', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch API data:', error);
    return { success: false, data: { apis: [] } };
  }
}

// Fetch stats
async function getStats() {
  try {
    const response = await fetch('http://localhost:3000/api/external-apis?action=stats', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return { success: false, data: null };
  }
}

// Fetch alerts
async function getAlerts() {
  try {
    const response = await fetch('http://localhost:3000/api/external-apis?action=alerts&resolved=false&limit=5', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return { success: false, data: { alerts: [] } };
  }
}

export default async function FixedExternalApisPage() {
  // Fetch all data in parallel
  const [apiData, statsData, alertsData] = await Promise.all([
    getApiData(),
    getStats(),
    getAlerts()
  ]);
  
  const apis = apiData.success ? apiData.data.apis || [] : [];
  const stats = statsData.success ? statsData.data : null;
  const alerts = alertsData.success ? alertsData.data.alerts || [] : [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header and Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🌐 External API Monitoring Center
            </h1>
            <p className="text-muted-foreground">Monitor and manage all external API service status and configuration</p>
            <p className="text-xs text-slate-500 mt-1">API count: {apis.length} | Load status: Complete (server-side rendering)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button variant="outline" size="default">
              🔄 Check All APIs
            </Button>
            <Link href="/external-apis/detailed">
              <Button variant="outline" size="default">
                📊 Detailed List
              </Button>
            </Link>
            <Button size="default">
              🔑 Add New API
            </Button>
            <Button variant="outline" size="default">
              ⚙️ Settings
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{apis.length}</div>
              <p className="text-xs text-slate-500">Configured external API services</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active APIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {apis.filter((api: any) => api.status === 'active').length}
              </div>
              <p className="text-xs text-slate-500">Currently available API services</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(1)}ms` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500">Average response time for all APIs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.successRate ? `${(stats.successRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <Progress value={stats?.successRate ? stats.successRate * 100 : 0} className="mt-2" />
            </CardContent>
          </Card>
        </div>
        
        {/* Client interaction section */}
        <ClientInteractivePart initialApis={apis} />
        
        {/* Operations Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operations Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🔑 Add New API
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>1. Click"Add API" button</li>
                  <li>2. Fill in API basic info</li>
                  <li>3. Configure authentication</li>
                  <li>4. Save and test connection</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🔧 Troubleshooting
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Check if API key is expired</li>
                  <li>• Verify network connection</li>
                  <li>• Check API quota limits</li>
                  <li>• View error log details</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🛡️ Security Recommendations
                </h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Regularly rotate API keys</li>
                  <li>• Use minimum necessary permissions</li>
                  <li>• Monitor abnormal call patterns</li>
                  <li>• Enable API usage audit</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-slate-500 pt-4">
          <p>External API monitoring data auto-refreshes every 60 seconds • Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Supports: Google APIs • OpenAI • Anthropic • GitHub • Azure • LinkedIn • Brave Search</p>
        </div>
      </div>
    </div>
  );
}