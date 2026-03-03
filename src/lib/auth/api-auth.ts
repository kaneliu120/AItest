import { NextRequest, NextResponse } from 'next/server';

/**
 * ValidateRequestwhether it携带All效's API Key. 
 * From x-api-key Request头or apiKey 查询ParametersCenter读取, and API_SECRET_KEY Environmentvariable比for. 
 * 生产Environment未ConfigurationKey时拒绝所AllRequest；dev environment未ConfigurationKey时放行. 
 */
export function isApiAuthorized(request: NextRequest): boolean {
  const secret = process.env.API_SECRET_KEY;

  if (secret) {
    const headerKey = request.headers.get('x-api-key');
    const queryKey = new URL(request.url).searchParams.get('apiKey');
    return headerKey === secret || queryKey === secret;
  }

  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return true;
}

/** Unauthorized时返回standard 401 Response */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
