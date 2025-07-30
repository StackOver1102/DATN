/**
 * Category-related interfaces
 */
export interface CategoryItem {
  name: string;
  subcategories?: string[];
}

export interface CategorySection {
  title: string;
  items: CategoryItem[];
}

/**
 * Common API response interface used across the application
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: number;
  statusCode: number;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * User interface
 */
export interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  bio?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  balance?: number;
  phone?: string;
  address?: string;
  totalDownloads?: number;
  // Add other user properties as needed
}

/**
 * Authentication related interfaces
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * Session related interfaces for NextAuth
 */
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  balance?: number | null;
}

export interface CustomSession {
  user: SessionUser;
  accessToken?: string;
  expires: string;
} 