// Mixed component - server component fetches data, client component handles interaction

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
    const response = await fetch('http://localhost:3001/api/external-apis', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
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
    const response = await fetch('http://localhost:3001/api/external-apis?action=stats', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
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
    const response = await fetch('http://localhost:3001/api/external-apis?action=alerts&resolved=false&limit=5', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
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
        {/* Title and controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🌐 External API Monitoring Center
            </h1>
            <p className="text-muted-foreground">Monitor and manage the status and configuration of all external API services</p>
            <p className="text-xs text-slate-500 mt-1">APIs: {apis.length} | Load status: Complete (server-side rendering)</p>
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
        
        {/* Stats cards */}
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
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.averageResponseTime ? `${stats.averageResponseTime.toFixed(1)}ms` : 'N/A'}
              </div>
              <p className="text-xs text-slate-500">Average response time across all APIs</p>
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
        
        {/* Operation guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operation Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  🔑 Add New API
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
                  🔧 Troubleshooting
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
                  🛡️ Security Best Practices
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
      </div>
    </div>
  );
}