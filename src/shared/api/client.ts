import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError, ApplicationError, getErrorMessage, getHttpStatus } from '../types';

// API客户端配置
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// 请求拦截器
export type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;

// 响应拦截器
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

// 错误拦截器
export type ErrorInterceptor = (error: AxiosError) => Promise<never>;

// API客户端类
export class ApiClient {
  private client: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      withCredentials: config.withCredentials || false,
    });

    // 设置默认拦截器
    this.setupDefaultInterceptors();
  }

  // 设置默认拦截器
  private setupDefaultInterceptors(): void {
    // 请求拦截器 - 添加认证令牌
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 统一处理响应格式
    this.client.interceptors.response.use(
      (response) => {
        // 统一响应格式
        if (response.data) {
          response.data = this.normalizeResponse(response.data);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  // 获取认证令牌
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  // 标准化响应
  private normalizeResponse(data: any): ApiResponse {
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data as ApiResponse;
    }

    // 转换为标准格式
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // 处理错误
  private async handleError(error: AxiosError): Promise<never> {
    // 应用错误拦截器
    for (const interceptor of this.errorInterceptors) {
      try {
        await interceptor(error);
      } catch (interceptorError) {
        console.error('Error interceptor failed:', interceptorError);
      }
    }

    // 构建应用错误
    let appError: ApplicationError;

    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response;
      
      if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
        // 服务器返回了标准错误格式
        const apiError = data as ApiError;
        appError = new ApplicationError(
          apiError.code as any,
          apiError.message,
          apiError.details,
          status
        );
      } else {
        // 服务器返回了非标准错误
        appError = new ApplicationError(
          'INTERNAL_SERVER_ERROR',
          getErrorMessage(error),
          { responseData: data },
          status
        );
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      appError = new ApplicationError(
        'NETWORK_ERROR',
        'Network error occurred. Please check your connection.',
        { originalError: error.message },
        503
      );
    } else {
      // 请求配置出错
      appError = new ApplicationError(
        'INTERNAL_SERVER_ERROR',
        getErrorMessage(error),
        { originalError: error.message },
        500
      );
    }

    // 记录错误
    this.logError(appError, error);

    throw appError;
  }

  // 记录错误
  private logError(appError: ApplicationError, originalError: AxiosError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        appError: appError.toJSON(),
        originalError: {
          message: originalError.message,
          code: originalError.code,
          config: originalError.config,
        },
      });
    }

    // TODO: 发送错误到监控服务
    // this.sendErrorToMonitoring(appError);
  }

  // 添加请求拦截器
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    this.client.interceptors.request.use(interceptor);
  }

  // 添加响应拦截器
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    this.client.interceptors.response.use(interceptor);
  }

  // 添加错误拦截器
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // HTTP方法
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // 分页查询
  public async paginate<T = any>(
    url: string,
    page: number = 1,
    limit: number = 10,
    config?: AxiosRequestConfig
  ): Promise<{ data: T[]; pagination: any }> {
    const params = { page, limit, ...config?.params };
    const response = await this.client.get<ApiResponse<{ data: T[]; pagination: any }>>(url, {
      ...config,
      params,
    });
    return response.data.data;
  }

  // 文件上传
  public async upload<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data.data;
  }

  // 设置认证令牌
  public setAuthToken(token: string, persist: boolean = true): void {
    if (typeof window !== 'undefined') {
      if (persist) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    }
  }

  // 清除认证令牌
  public clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  // 获取客户端实例（高级用法）
  public getClient(): AxiosInstance {
    return this.client;
  }
}

// 默认API客户端实例
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
};

export const apiClient = new ApiClient(defaultConfig);

// 导出工具函数
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

export function isApiClientError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

// 导出默认实例
export default apiClient;