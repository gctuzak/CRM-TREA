import { showToast } from './toast';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Custom error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request interceptor type
type RequestInterceptor = (config: RequestInit) => RequestInit | Promise<RequestInit>;

// Response interceptor type
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

class ApiClient {
  private baseURL: string;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  // Apply request interceptors
  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    return finalConfig;
  }

  // Apply response interceptors
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let finalResponse = response;
    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }
    return finalResponse;
  }

  // Main request method
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Default headers
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Merge headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    // Apply request interceptors
    const config = await this.applyRequestInterceptors({
      ...options,
      headers,
    });

    try {
      const response = await fetch(url, config);
      
      // Apply response interceptors
      const interceptedResponse = await this.applyResponseInterceptors(response);

      // Handle non-JSON responses
      const contentType = interceptedResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!interceptedResponse.ok) {
          throw new ApiError(
            `HTTP ${interceptedResponse.status}: ${interceptedResponse.statusText}`,
            interceptedResponse.status
          );
        }
        return interceptedResponse.text() as unknown as T;
      }

      const data = await interceptedResponse.json();

      if (!interceptedResponse.ok) {
        throw new ApiError(
          data.message || `HTTP ${interceptedResponse.status}: ${interceptedResponse.statusText}`,
          interceptedResponse.status,
          data.errorCode,
          data.errors
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or other errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError('Network error. Please check your connection.', 0);
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        0
      );
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params)}` : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Add auth token interceptor
apiClient.addRequestInterceptor((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

// Add error handling interceptor
apiClient.addResponseInterceptor((response) => {
  // Log response time if available
  const responseTime = response.headers.get('X-Response-Time');
  if (responseTime && process.env.NODE_ENV === 'development') {
    console.log(`API Response Time: ${responseTime}`);
  }

  return response;
});

// Retry mechanism for failed requests
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        throw error;
      }

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

// API helper functions with error handling
export const api = {
  // Generic methods
  get: <T>(endpoint: string, params?: Record<string, any>) => 
    apiClient.get<T>(endpoint, params),
  
  post: <T>(endpoint: string, data?: any) => 
    apiClient.post<T>(endpoint, data),
  
  put: <T>(endpoint: string, data?: any) => 
    apiClient.put<T>(endpoint, data),
  
  patch: <T>(endpoint: string, data?: any) => 
    apiClient.patch<T>(endpoint, data),
  
  delete: <T>(endpoint: string) => 
    apiClient.delete<T>(endpoint),

  // With retry
  getWithRetry: <T>(endpoint: string, params?: Record<string, any>, maxRetries?: number) =>
    withRetry(() => apiClient.get<T>(endpoint, params), maxRetries),

  // With toast notifications
  postWithToast: async <T>(endpoint: string, data?: any, successMessage?: string) => {
    try {
      const result = await apiClient.post<T>(endpoint, data);
      if (successMessage) {
        showToast.success(successMessage);
      }
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        showToast.error(error.message);
      }
      throw error;
    }
  },

  putWithToast: async <T>(endpoint: string, data?: any, successMessage?: string) => {
    try {
      const result = await apiClient.put<T>(endpoint, data);
      if (successMessage) {
        showToast.success(successMessage);
      }
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        showToast.error(error.message);
      }
      throw error;
    }
  },

  deleteWithToast: async <T>(endpoint: string, successMessage?: string) => {
    try {
      const result = await apiClient.delete<T>(endpoint);
      if (successMessage) {
        showToast.success(successMessage);
      }
      return result;
    } catch (error) {
      if (error instanceof ApiError) {
        showToast.error(error.message);
      }
      throw error;
    }
  }
};

// Auth token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Dashboard API endpoints
export const dashboardApi = {
  getOverview: async () => {
    return api.get('/api/dashboard/overview');
  },

  getSalesPipeline: async () => {
    return api.get('/api/dashboard/pipeline');
  },

  getTaskSummary: async () => {
    return api.get('/api/dashboard/tasks-summary');
  },

  getRevenueChart: async (period = 'month') => {
    return api.get(`/api/dashboard/revenue?period=${period}`);
  },

  getRecentActivities: async (limit = 10) => {
    return api.get(`/api/dashboard/activities?limit=${limit}`);
  },

  getUpcomingTasks: async (limit = 10) => {
    return api.get(`/api/dashboard/upcoming-tasks?limit=${limit}`);
  }
};

// Auth API endpoints
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response.token) {
      setAuthToken(response.token);
    }
    return response;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      clearAuthToken();
    }
  },

  getProfile: async () => {
    return api.get('/api/auth/current');
  },

  updateProfile: async (userData: any) => {
    return api.put('/api/auth/profile', userData);
  },

  changePassword: async (passwordData: any) => {
    return api.put('/api/auth/change-password', passwordData);
  }
};

// Users API endpoints
export const usersApi = {
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    return api.get('/api/users', params);
  },

  getUser: async (id: number) => {
    return api.get(`/api/users/${id}`);
  },

  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: 'admin' | 'manager' | 'user';
  }) => {
    return api.post('/api/users', userData);
  },

  updateUser: async (id: number, userData: Partial<{
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'manager' | 'user';
    status: 'active' | 'inactive';
  }>) => {
    return api.put(`/api/users/${id}`, userData);
  },

  updateUserStatus: async (id: number, status: 'active' | 'inactive') => {
    return api.put(`/api/users/${id}/status`, { status });
  },

  deleteUser: async (id: number) => {
    return api.delete(`/api/users/${id}`);
  }
};

export default api;