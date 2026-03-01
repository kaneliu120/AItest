'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 Test useEffect triggered');
    
    const loadData = async () => {
      try {
        console.log('📡 Loading API data...');
        setLoading(true);
        
        const response = await fetch('/api/external-apis');
        const data = await response.json();
        console.log('📊 API data:', data.success ? 'success' : 'failed', 'length:', data.data?.apis?.length || 0);
        
        if (data.success) {
          const apiList = data.data.apis || [];
          console.log('📋 Setting API list:', apiList.length);
          setApis(apiList);
          console.log('✅ setApis call complete');
        }
        
      } catch (error) {
        console.error('❌ Load failed:', error);
      } finally {
        console.log('🔚 Loading complete, setting loading=false');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-4">
        <div>
          <p>Status: {loading ? 'Loading' : 'Loaded'}</p>
          <p>API count: {apis.length}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">API list:</h2>
          {apis.length > 0 ? (
            <ul className="space-y-2">
              {apis.slice(0, 5).map((api, index) => (
                <li key={index} className="p-2 border rounded">
                  {api.name} - {api.provider}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No API data</p>
          )}
        </div>
      </div>
    </div>
  );
}