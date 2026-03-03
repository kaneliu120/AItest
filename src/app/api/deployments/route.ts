import { deploymentservervice } from '@/lib/deployment-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'stats';

    if (action === 'stats') {
      const stats = await deploymentservervice.getDeploymentStats();
      return NextResponse.json({ success: true, data: stats });
    }

    if (action === 'environments') {
      const environments = await deploymentservervice.getEnvironments();
      return NextResponse.json({ success: true, data: { environments } });
    }

    if (action === 'deployments') {
      const projectId = url.searchParams.get('projectId');
      const environmentId = url.searchParams.get('environmentId');
      const status = url.searchParams.get('status') as any;
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

      const deployments = await deploymentservervice.getDeployments({
        projectId: projectId || undefined,
        environmentId: environmentId || undefined,
        status: status || undefined,
      });

      const startIndex = (page - 1) * pageSize;
      const paginatedDeployments = deployments.slice(startIndex, startIndex + pageSize);

      return NextResponse.json({
        success: true,
        data: { deployments: paginatedDeployments, total: deployments.length, page, pageSize },
      });
    }

    const environmentId = url.searchParams.get('environmentId');
    if (environmentId) {
      const environment = await deploymentservervice.getEnvironment(environmentId);
      if (!environment) return NextResponse.json({ success: false, error: 'EnvironmentNot found' }, { status: 404 });
      return NextResponse.json({ success: true, data: environment });
    }

    const deploymentId = url.searchParams.get('deploymentId');
    if (deploymentId) {
      const deployment = await deploymentservervice.getDeployment(deploymentId);
      if (!deployment) return NextResponse.json({ success: false, error: 'DeploymentNot found' }, { status: 404 });
      return NextResponse.json({ success: true, data: deployment });
    }

    const stats = await deploymentservervice.getDeploymentStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('DeploymentAPIerror:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'create' } = body;

    if (action === 'create-environment') {
      const { name, type, url, configuration } = body;
      if (!name || !type) return NextResponse.json({ success: false, error: 'Missing  name or type' }, { status: 400 });
      const env = await deploymentservervice.createEnvironment({ 
        name, type, url, configuration: configuration || {}, status: 'active' 
      });
      return NextResponse.json({ success: true, data: env });
    }

    if (action === 'create-deployment') {
      const { projectId, projectName, environmentId, version, deployedBy } = body;
      if (!projectId || !environmentId || !version) {
        return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 });
      }
      const deployment = await deploymentservervice.createDeployment({
        projectId, 
        projectName: projectName || `Project ${projectId}`,
        environmentId, 
        version, 
        deployedBy: deployedBy || 'system',
      });
      return NextResponse.json({ success: true, data: deployment });
    }

    if (action === 'rollback') {
      const { deploymentId, rollbackVersion } = body;
      if (!deploymentId || !rollbackVersion) {
        return NextResponse.json({ success: false, error: 'Missing  deploymentId or rollbackVersion' }, { status: 400 });
      }
      const result = await deploymentservervice.rollbackDeployment(deploymentId, rollbackVersion);
      return NextResponse.json({ success: true, data: { success: result } });
    }

    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 });
  } catch (error) {
    console.error('DeploymentAPI POSTerror:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
