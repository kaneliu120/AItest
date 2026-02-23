import { deploymentService } from '@/lib/deployment-service';
import { NextRequest } from 'next/server';
import { 
  successResponse, 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  serverErrorResponse,
  withRequestId,
  extractPaginationParams,
  paginatedResponse
} from '@/lib/api-response';
import { standardApiHandler } from '@/middleware/api-standardizer';

export const GET = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';
    
    if (action === 'stats') {
      const stats = await deploymentService.getDeploymentStats();
      return successResponse(stats, {
        message: '部署统计获取成功',
        requestId,
      });
    }
    
    if (action === 'environments') {
      const environments = await deploymentService.getEnvironments();
      return successResponse(environments, {
        message: '环境列表获取成功',
        requestId,
      });
    }
    
    if (action === 'deployments') {
      const projectId = url.searchParams.get('projectId');
      const environmentId = url.searchParams.get('environmentId');
      const status = url.searchParams.get('status') as any;
      const { page, pageSize } = extractPaginationParams(url.searchParams);
      
      const deployments = await deploymentService.getDeployments({
        projectId: projectId || undefined,
        environmentId: environmentId || undefined,
        status: status || undefined
      });
      
      // 分页
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedDeployments = deployments.slice(startIndex, endIndex);
      
      return paginatedResponse(
        paginatedDeployments,
        deployments.length,
        page,
        pageSize,
        {
          message: '部署列表获取成功',
          requestId,
        }
      );
    }
    
    const environmentId = url.searchParams.get('environmentId');
    if (environmentId) {
      const environment = await deploymentService.getEnvironment(environmentId);
      if (!environment) {
        return notFoundResponse('环境未找到');
      }
      
      return successResponse(environment, {
        message: '环境详情获取成功',
        requestId,
      });
    }
    
    const deploymentId = url.searchParams.get('deploymentId');
    if (deploymentId) {
      const deployment = await deploymentService.getDeployment(deploymentId);
      if (!deployment) {
        return notFoundResponse('部署未找到');
      }
      
      return successResponse(deployment, {
        message: '部署详情获取成功',
        requestId,
      });
    }
    
    // 默认返回统计信息
    const stats = await deploymentService.getDeploymentStats();
    return successResponse(stats, {
      message: '部署统计获取成功',
      requestId,
    });
  } catch (error) {
    console.error('部署API错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

export const POST = standardApiHandler(async (request: NextRequest, requestId: string) => {
  try {
    const body = await request.json();
    const action = body.action || 'create-deployment';
    
    if (action === 'create-deployment') {
      const { projectId, projectName, environmentId, version, deployedBy } = body;
      
      if (!projectId || !projectName || !environmentId || !version) {
        return errorResponse('缺少必要参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const deployment = await deploymentService.createDeployment({
        projectId,
        projectName,
        environmentId,
        version,
        deployedBy: deployedBy || 'system'
      });
      
      return successResponse(deployment, {
        message: '部署创建成功',
        requestId,
      });
    }
    
    if (action === 'create-environment') {
      const { name, type, url, configuration } = body;
      
      if (!name || !type || !url) {
        return errorResponse('缺少必要参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const environment = await deploymentService.createEnvironment({
        name,
        type,
        url,
        status: 'active',
        configuration: configuration || {}
      });
      
      return successResponse(environment, {
        message: '环境创建成功',
        requestId,
      });
    }
    
    if (action === 'rollback') {
      const { deploymentId, rollbackVersion } = body;
      
      if (!deploymentId || !rollbackVersion) {
        return errorResponse('缺少必要参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const success = await deploymentService.rollbackDeployment(deploymentId, rollbackVersion);
      
      return successResponse({ success }, {
        message: '回滚操作执行成功',
        requestId,
      });
    }
    
    if (action === 'add-log') {
      const { deploymentId, level, message, source } = body;
      
      if (!deploymentId || !level || !message) {
        return errorResponse('缺少必要参数', {
          statusCode: 400,
          requestId,
        });
      }
      
      const success = await deploymentService.addDeploymentLog(deploymentId, {
        level,
        message,
        source: source || 'unknown'
      });
      
      return successResponse({ success }, {
        message: '日志添加成功',
        requestId,
      });
    }
    
    return errorResponse('不支持的操作', {
      statusCode: 400,
      requestId,
    });
  } catch (error) {
    console.error('部署API POST错误:', error);
    return errorResponse(
      error instanceof Error ? error.message : '未知错误',
      {
        statusCode: 500,
        requestId,
      }
    );
  }
});

