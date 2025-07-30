import { ApiResponse } from './types';

/**
 * Base URL for API requests
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Generic type for request data
 */
export type RequestData = Record<string, unknown>;

/**
 * Generic function to make API requests to the NestJS backend
 */
export async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: RequestData,
  token?: string
): Promise<ApiResponse<T>> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authorization token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include', // Include cookies for CSRF protection if used
    };

    // Add body data for non-GET requests
    if (method !== 'GET' && data) {
      options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, options);
    const responseData = await response.json();

    // If the NestJS response is not in our ApiResponse format, convert it
    if (responseData.success === undefined) {
      if (!response.ok) {
        // Handle NestJS error format
        const errorMessage = responseData.message || 
          (Array.isArray(responseData.message) ? responseData.message[0] : 'Request failed');
        
        return {
          success: false,
          message: errorMessage,
          data: null as unknown as T,
          timestamp: Date.now(),
          statusCode: response.status
        };
      }

      // Format successful response
      return {
        success: true,
        message: 'Success',
        data: responseData as T,
        timestamp: Date.now(),
        statusCode: response.status
      };
    }

    // If it's already in our format, return as is
    return responseData;
  } catch (error) {
    console.error(`API request error (${endpoint}):`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
      data: null as unknown as T,
      timestamp: Date.now(),
      statusCode: 500
    };
  }
}

/**
 * User profile data interface
 */
export interface UserProfileData {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  [key: string]: unknown;
}

/**
 * Auth-related API functions
 */
export const authApi = {
  login: (email: string, password: string) => 
    apiRequest('auth/login', 'POST', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    apiRequest('auth/register', 'POST', { name, email, password }),
  
  me: (token: string) => 
    apiRequest('auth/me', 'GET', undefined, token)
};

/**
 * User-related API functions
 */
export const userApi = {
  getProfile: (token: string) => 
    apiRequest('users/profile', 'GET', undefined, token),
  
  updateProfile: (token: string, data: UserProfileData) => 
    apiRequest('users/profile', 'PUT', data, token)
};

/**
 * Transaction-related API functions
 */
export interface CreatePayPalOrderParams {
  amount: number;
  currency?: string;
  returnUrl?: string;
  cancelUrl?: string;
  description?: string;
  [key: string]: unknown;
}

export interface PayPalOrderResponse {
  paypalOrderId: string;
  transactionId: string;
  transactionCode: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  approveUrl: string;
}

export const transactionApi = {
  // Create PayPal order for deposit
  createPayPalOrder: (token: string, params: CreatePayPalOrderParams) => 
    apiRequest<PayPalOrderResponse>('transactions/paypal/create-order', 'POST', params, token),
  
  // Approve and process PayPal order after payment
  approvePayPalOrder: (token: string, orderId: string) => 
    apiRequest('transactions/paypal/approve-order', 'POST', { orderId }, token),
  
  // Get user transactions
  getUserTransactions: (token: string) => 
    apiRequest('transactions', 'GET', undefined, token),
  
  // Get transaction by ID
  getTransactionById: (token: string, id: string) => 
    apiRequest(`transactions/${id}`, 'GET', undefined, token),
    
  // Get transaction by code
  getTransactionByCode: (token: string, code: string) => 
    apiRequest(`transactions/code/${code}`, 'GET', undefined, token),
};

// Add more API function groups as needed for your application 

/**
 * Product-related API functions
 */
export const productApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string }) => 
    apiRequest('products', 'GET', params),
  
  getById: (id: string) => 
    apiRequest(`products/${id}`, 'GET'),
  
  getSimilar: (id: string, limit: number = 10) => 
    apiRequest(`products/${id}/similar?limit=${limit}`, 'GET'),
  
  getFeatured: (limit: number = 10) => 
    apiRequest(`products/featured?limit=${limit}`, 'GET'),
  
  search: (query: string, params?: { page?: number; limit?: number; category?: string }) => 
    apiRequest(`products/search?q=${encodeURIComponent(query)}`, 'GET', params),
};

/**
 * Category-related API functions
 */
export const categoryApi = {
  getAll: () => apiRequest('categories', 'GET'),
  
  getById: (id: string) => apiRequest(`categories/${id}`, 'GET'),
  
  getItems: (categoryId: string) => apiRequest(`categories/${categoryId}/items`, 'GET')
}; 