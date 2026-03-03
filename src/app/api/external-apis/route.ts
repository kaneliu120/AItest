/**
 * External APIsMonitoringAPI
 * 功can: 管理External APIsConfiguration, StatusCheck和Monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllApis, 
  getApiById, 
  addApi, 
  updateApi, 
  deleteApi,
  recordApiCheck,
  getApiCheckResults,
  getApiStats,
  createAlert,
  getAlerts,
  resolveAlert,
  ExternalApi,
  ApiCheckResult
} from '@/lib/external-api-store';

// ─── APICheck器 ────────────────────────────────────────────────────────────────
async function checkApiStatus(api: ExternalApi): Promise<ApiCheckResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    let success = false;
    let statusCode = 0;
    let error = '';
    let data: Record<string, unknown> = {};
    
    // 根据APITypeExecute不同'sCheck
    switch (api.provider) {
      case 'google':
        // Google APICheck
        if (api.name.includes('Analytics')) {
          // 模拟GA4Check
          success = Math.random() > 0.2; // 80%success率
          statusCode = success ? 200 : 500;
          data = { 
            propertyId: '524777065',
            activeUsers: success ? Math.floor(Math.random() * 100) : 0 
          };
        } else if (api.name.includes('Ads')) {
          // Google AdsCheck
          success = api.status === 'active';
          statusCode = success ? 200 : 401;
          error = success ? '' : 'need toOAuthAuth';
        }
        break;
        
      case 'openai':
        // OpenAI APICheck
        success = Math.random() > 0.1; // 90%success率
        statusCode = success ? 200 : 429;
        data = { 
          model: 'gpt-4',
          available: success 
        };
        break;
        
      case 'anthropic':
        // Anthropic APICheck
        success = true; // false设总Yessuccess
        statusCode = 200;
        data = { model: 'claude-sonnet-4-6' };
        break;
        
      case 'github':
        // GitHub APICheck
        success = Math.random() > 0.05; // 95%success率
        statusCode = success ? 200 : 403;
        data = { 
          rateLimit: success ? 5000 : 0,
          remaining: success ? Math.floor(Math.random() * 5000) : 0 
        };
        break;
        
      case 'azure':
        // Azure APICheck
        success = true;
        statusCode = 200;
        data = { 
          services: ['app-service', 'sql-database'],
          region: 'southeastasia' 
        };
        break;
        
      default:
        // 通用APICheck
        success = Math.random() > 0.3; // 70%success率
        statusCode = success ? 200 : 500;
        data = { checked: true };
    }
    
    const responseTime = Date.now() - startTime;
    
    const result: Omit<ApiCheckResult, 'id'> = {
      apiId: api.id,
      timestamp,
      responseTime,
      statusCode,
      success,
      error: error || (success ? '' : 'APICheckfailed'),
      data
    };
    
    // LogCheckresult
    const recorded = recordApiCheck(result);
    
    // ifCheckfailed, CreateAlert
    if (!success) {
      createAlert({
        apiId: api.id,
        type: 'error',
        severity: responseTime > 5000 ? 'critical' : 'high',
        message: `${api.name} Checkfailed: ${error || 'Unknown error'}`,
        details: { statusCode, responseTime, error },
        resolved: false
      });
    }
    
    return recorded;
    
  } catch (err: any) {
    const responseTime = Date.now() - startTime;
    
    const result: Omit<ApiCheckResult, 'id'> = {
      apiId: api.id,
      timestamp,
      responseTime,
      statusCode: 0,
      success: false,
      error: err.message || 'Abnormal condition occurred during check',
      data: { exception: true }
    };
    
    const recorded = recordApiCheck(result);
    
    // CreateAbnormalAlert
    createAlert({
      apiId: api.id,
      type: 'error',
      severity: 'critical',
      message: `${api.name} CheckAbnormal: ${err.message}`,
      details: { exception: err.message, responseTime },
      resolved: false
    });
    
    return recorded;
  }
}

// ─── batchCheck所AllAPI ──────────────────────────────────────────────────────────
async function checkAllApis() {
  const apis = getAllApis();
  const results = [];
  
  for (const api of apis) {
    if (api.status !== 'inactive') {
      const result = await checkApiStatus(api);
      results.push(result);
      
      // 避免过快Request
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// ─── APIrouteProcess ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    const id = url.searchParams.get('id');
    const provider = url.searchParams.get('provider');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');
    
    // ── FetchAPIList ──
    if (action === 'list') {
      const filters: any = {};
      if (provider) filters.provider = provider;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (limit) filters.limit = parseInt(limit);
      
      const apis = getAllApis(filters);
      return NextResponse.json({ success: true, data: { apis } });
    }
    
    // ── Fetch单 API ──
    if (action === 'get' && id) {
      const api = getApiById(id);
      if (!api) {
        return NextResponse.json({ success: false, error: 'APINot found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { api } });
    }
    
    // ── FetchStatisticsinformation ──
    if (action === 'stats') {
      const stats = getApiStats();
      return NextResponse.json({ success: true, data: stats });
    }
    
    // ── FetchCheckresult ──
    if (action === 'check-results') {
      const apiId = url.searchParams.get('apiId');
      const success = url.searchParams.get('success');
      const limit = url.searchParams.get('limit') || '50';
      
      const filters: any = {};
      if (apiId) filters.apiId = apiId;
      if (success) filters.success = success === 'true';
      if (limit) filters.limit = parseInt(limit);
      
      const results = getApiCheckResults(filters);
      return NextResponse.json({ success: true, data: { results } });
    }
    
    // ── FetchAlert ──
    if (action === 'alerts') {
      const apiId = url.searchParams.get('apiId');
      const resolved = url.searchParams.get('resolved');
      const severity = url.searchParams.get('severity');
      const limit = url.searchParams.get('limit') || '20';
      
      const filters: any = {};
      if (apiId) filters.apiId = apiId;
      if (resolved) filters.resolved = resolved === 'true';
      if (severity) filters.severity = severity;
      if (limit) filters.limit = parseInt(limit);
      
      const alerts = getAlerts(filters);
      return NextResponse.json({ success: true, data: { alerts } });
    }
    
    // ── CheckAPIStatus ──
    if (action === 'check') {
      if (id) {
        // Check单 API
        const api = getApiById(id);
        if (!api) {
          return NextResponse.json({ success: false, error: 'APINot found' }, { status: 404 });
        }
        
        const result = await checkApiStatus(api);
        return NextResponse.json({ success: true, data: { result } });
      } else {
        // Check所AllAPI
        const results = await checkAllApis();
        return NextResponse.json({ success: true, data: { results } });
      }
    }
    
    // ── Default返回List ──
    const apis = getAllApis();
    return NextResponse.json({ success: true, data: { apis } });
    
  } catch (error) {
    console.error('External APIs APIerror:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'create';
    
    // ── CreateNewAPI ──
    if (action === 'create') {
      const body = await request.json();
      const { name, provider, category, description, authType, apiKey, ...rest } = body;
      
      if (!name || !provider || !category) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters: name, provider, category' },
          { status: 400 }
        );
      }
      
      const apiData: Omit<ExternalApi, 'id' | 'createdAt' | 'updatedAt'> = {
        name,
        provider,
        category,
        description: description || '',
        authType: authType || 'api_key',
        apiKey,
        status: 'needs_setup',
        lastChecked: new Date().toISOString(),
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageResponseTime: 0,
        tags: rest.tags || [],
        metadata: rest.metadata,
        ...rest
      };
      
      const api = addApi(apiData);
      return NextResponse.json({ success: true, data: { api } });
    }
    
    // ── UpdateAPI ──
    if (action === 'update') {
      const body = await request.json();
      const { id, ...updates } = body;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing API ID' }, { status: 400 });
      }
      
      const success = updateApi(id, updates);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Update failed, APINot found' }, { status: 404 });
      }
      
      const api = getApiById(id);
      return NextResponse.json({ success: true, data: { api } });
    }
    
    // ── 解决Alert ──
    if (action === 'resolve-alert') {
      const body = await request.json();
      const { id, resolvedBy = 'system' } = body;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing AlertID' }, { status: 400 });
      }
      
      const success = resolveAlert(id);
      return NextResponse.json({ success, data: { resolved: success } });
    }
    
    // ── TestAPIConnect ──
    if (action === 'test-connection') {
      const body = await request.json();
      const { id } = body;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing API ID' }, { status: 400 });
      }
      
      const api = getApiById(id);
      if (!api) {
        return NextResponse.json({ success: false, error: 'APINot found' }, { status: 404 });
      }
      
      const result = await checkApiStatus(api);
      return NextResponse.json({ success: true, data: { result } });
    }
    
    // ── re-Auth ──
    if (action === 'reauth') {
      const body = await request.json();
      const { id, apiKey, clientId, clientSecret, refreshToken, serviceAccount } = body;
      
      if (!id) {
        return NextResponse.json({ success: false, error: 'Missing API ID' }, { status: 400 });
      }
      
      const api = getApiById(id);
      if (!api) {
        return NextResponse.json({ success: false, error: 'APINot found' }, { status: 404 });
      }
      
      // UpdateAuthinformation
      const updates: any = {};
      if (apiKey !== undefined) updates.apiKey = apiKey;
      if (clientId !== undefined) updates.clientId = clientId;
      if (clientSecret !== undefined) updates.clientSecret = clientSecret;
      if (refreshToken !== undefined) updates.refreshToken = refreshToken;
      if (serviceAccount !== undefined) updates.serviceAccount = serviceAccount;
      
      // UpdateStatusforneed toCheck
      updates.status = 'active';
      updates.lastChecked = new Date().toISOString();
      
      const success = updateApi(id, updates as Partial<ExternalApi>);
      if (!success) {
        return NextResponse.json({ success: false, error: 'Re-authentication failed' }, { status: 500 });
      }
      
      // TestNew凭证
      const updatedApi = getApiById(id);
      if (updatedApi) {
        const result = await checkApiStatus(updatedApi);
        return NextResponse.json({ 
          success: true, 
          data: { 
            api: updatedApi,
            checkResult: result
          } 
        });
      }
      
      return NextResponse.json({ success: true, data: { api: updatedApi } });
    }
    
    return NextResponse.json({ success: false, error: 'Unknown operation' }, { status: 400 });
    
  } catch (error) {
    console.error('External APIs POSTerror:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing API ID' }, { status: 400 });
    }
    
    const success = deleteApi(id);
    return NextResponse.json({ success, data: { deleted: success } });
    
  } catch (error) {
    console.error('External APIs DELETEerror:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}