// Server component - no state management issues

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Fetch API data
async function getApiData() {
  try {
    const response = await fetch('http://localhost:3001/api/external-apis', {
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

export default async function ServerTestPage() {
  const apiData = await getApiData();
  const apis = apiData.success ? apiData.data.apis || [] : [];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Server Component Test Page</h1>
      <div className="space-y-4">
        <div>
          <p>API count: {apis.length}</p>
          <p>Status: Loaded (SSR)</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">API list (first 5):</h2>
          {apis.length > 0 ? (
            <ul className="space-y-2">
              {apis.slice(0, 5).map((api: any) => (
                <li key={api.id} className="p-2 border rounded">
                  {api.name} - {api.provider}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No API data</p>
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Server Component Advantages</CardTitle>
            <CardDescription>No state management issues, fetches data directly</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✅ No React state update issues</li>
              <li>✅ No hydration errors</li>
              <li>✅ Fetches data directly</li>
              <li>✅ No client-side JavaScript dependency</li>
              <li>✅ Better SEO</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}