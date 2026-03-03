/**
 * API 配置 - 指向独立的Express API服务器
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    tasks: `${API_BASE_URL}/api/tasks`,
    tasksAll: `${API_BASE_URL}/api/tasks/all`,
    finance: `${API_BASE_URL}/api/finance`,
    freelance: `${API_BASE_URL}/api/freelance`,
    health: `${API_BASE_URL}/api/health`
  }
};

// API客户端函数
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 特定API函数
export async function getTaskStats() {
  return fetchAPI('/api/tasks');
}

export async function getAllTasks() {
  return fetchAPI('/api/tasks/all');
}

export async function createTask(taskData: any) {
  return fetchAPI('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function getFinanceData() {
  return fetchAPI('/api/finance');
}

export async function getFreelanceData() {
  return fetchAPI('/api/freelance');
}
