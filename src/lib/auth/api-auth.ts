import { NextRequest, NextResponse } from 'next/server';

/**
 * 验证请求是否携带有效的 API 密钥。
 * 从 x-api-key 请求头或 apiKey 查询参数中读取，与 API_SECRET_KEY 环境变量比对。
 * 生产环境未配置密钥时拒绝所有请求；开发环境未配置密钥时放行。
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

/** 未授权时返回标准 401 响应 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
