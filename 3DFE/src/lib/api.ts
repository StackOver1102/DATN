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

// Add more API function groups as needed for your application 

/**
 * Category-related API functions
 */
export const categoryApi = {
  getAll: () => apiRequest('categories', 'GET'),
  
  getById: (id: string) => apiRequest(`categories/${id}`, 'GET'),
  
  getItems: (categoryId: string) => apiRequest(`categories/${categoryId}/items`, 'GET')
}; 