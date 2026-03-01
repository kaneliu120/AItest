// Hybrid component - server component fetches data, client component handles interaction

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import ClientInteractivePart from './client-part-v2';

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

export default async function ExternalApisPage() {
  // Fetch all data in parallel
  const [apiData, statsData, alertsData] = await Promise.all([
    getApiData(),
    getStats(),
    getAlerts()
  ]);

  const apis = apiData.success ? apiData.data.apis : [];
  const stats = statsData.success ? statsData.data : null;
  const alerts = alertsData.success ? alertsData.data.alerts : [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">External API Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage the connection status and performance of all external API services
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            API count: <span className="font-semibold text-foreground">{apis.length}</span> | 
            Status: <span className="font-semibold text-foreground">Loaded (SSR)</span>
          </div>
        </div>
      </div>

      {/* Pass data to client component */}
      <ClientInteractivePart 
        initialApis={apis}
        initialStats={stats}
        initialAlerts={alerts}
      />
    </div>
  );
}