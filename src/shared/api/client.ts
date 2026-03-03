import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError, ApplicationError, getErrorMessage, getHttpStatus } from '../types';

// APIclient端Configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

// Request拦截器
export type RequestInterceptor = (config: AxiosRequestConfig) => AxiosRequestConfig | Promise<AxiosRequestConfig>;

// Response拦截器
export type ResponseInterceptor = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;

// error拦截器
export type ErrorInterceptor = (error: AxiosError) => Promise<never>;

// APIclient端class
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

    // SettingsDefault拦截器
    this.setupDefaultInterceptors();
  }

  // SettingsDefault拦截器
  private setupDefaultInterceptors(): void {
    // Request拦截器 - AddAuthToken
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

    // Response拦截器 - 统一ProcessResponseFormat
    this.client.interceptors.response.use(
      (response) => {
        // 统一ResponseFormat
        if (response.data) {
          response.data = this.normalizeResponse(response.data);
        }
        return response;
      },
      (error) => this.handleError(error)
    );
  }

  // FetchAuthToken
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  // standard化Response
  private normalizeResponse(data: any): ApiResponse {
    // ifalready经YesstandardFormat, 直接返回
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
      return data as ApiResponse;
    }

    // convertforstandardFormat
    return {
      data,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Processerror
  private async handleError(error: AxiosError): Promise<never> {
    // Applicationerror拦截器
    for (const interceptor of this.errorInterceptors) {
      try {
        await interceptor(error);
      } catch (interceptorError) {
        console.error('Error interceptor failed:', interceptorError);
      }
    }

    // 构建Applicationerror
    let appError: ApplicationError;

    if (error.response) {
      // servervice器Response了errorStatus码
      const { status, data } = error.response;
      
      if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
        // servervice器返回了standarderrorFormat
        const apiError = data as ApiError;
        appError = new ApplicationError(
          apiError.code as any,
          apiError.message,
          apiError.details,
          status
        );
      } else {
        // servervice器返回了非standarderror
        appError = new ApplicationError(
          'INTERNAL_SERVER_ERROR',
          getErrorMessage(error),
          { responseData: data },
          status
        );
      }
    } else if (error.request) {
      // RequestalreadySend但没All收toResponse
      appError = new ApplicationError(
        'NETWORK_ERROR',
        'Network error occurred. Please check your connection.',
        { originalError: error.message },
        503
      );
    } else {
      // RequestConfiguration出错
      appError = new ApplicationError(
        'INTERNAL_SERVER_ERROR',
        getErrorMessage(error),
        { originalError: error.message },
        500
      );
    }

    // Logerror
    this.logError(appError, error);

    throw appError;
  }

  // Logerror
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

    // TODO: SenderrortoMonitoringservervice
    // this.sendErrorToMonitoring(appError);
  }

  // AddRequest拦截器
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
    this.client.interceptors.request.use(interceptor);
  }

  // AddResponse拦截器
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
    this.client.interceptors.response.use(interceptor);
  }

  // Adderror拦截器
  public addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // HTTPmethod
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

  // Pagination查询
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

  // fileUpload
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

  // SettingsAuthToken
  public setAuthToken(token: string, persist: boolean = true): void {
    if (typeof window !== 'undefined') {
      if (persist) {
        localStorage.setItem('auth_token', token);
      } else {
        sessionStorage.setItem('auth_token', token);
      }
    }
  }

  // ClearAuthToken
  public clearAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
    }
  }

  // Fetchclient端实例(High级用法)
  public getClient(): AxiosInstance {
    return this.client;
  }
}

// DefaultAPIclient端实例
const defaultConfig: ApiClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
};

export const apiClient = new ApiClient(defaultConfig);

// ExportToolfunction
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

export function isApiClientError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

// ExportDefault实例
export default apiClient;