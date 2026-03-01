import { NextRequest } from 'next/server';

export function isWorkflowAdminAuthorized(request: NextRequest): boolean {
  const adminToken = process.env.WORKFLOW_ADMIN_TOKEN;

  // If token configured, require token in header/query
  if (adminToken) {
    const headerToken = request.headers.get('x-workflow-admin-token');
    const queryToken = new URL(request.url).searchParams.get('adminToken');
    return headerToken === adminToken || queryToken === adminToken;
  }

  // No token configured: production must deny, non-production allow for local development
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return true;
}
