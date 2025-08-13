import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, RequestData } from "../api";
import { useSession } from "next-auth/react";
import { ApiResponse, PaginatedResponse } from "../types";

/**
 * Hook for fetching paginated data from the API
 */
export function useFetchPaginatedData<T>(
  endpoint: string,
  queryKey: string | string[],
  options?: {
    page?: number;
    limit?: number;
    filters?: Record<string, string | number | boolean>;
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
    onSuccess?: (data: PaginatedResponse<T>) => void;
    onError?: (error: Error) => void;
  }
) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const page = options?.page || 1;
  const limit = options?.limit || 10;
  const filters = options?.filters || {};

  // Build query params
  const queryParams = new URLSearchParams();
  queryParams.append("page", page.toString());
  queryParams.append("limit", limit.toString());

  // Add any additional filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const actualQueryKey = Array.isArray(queryKey)
    ? [...queryKey, page, limit, JSON.stringify(filters)]
    : [queryKey, page, limit, JSON.stringify(filters)];

  return useQuery({
    queryKey: actualQueryKey,
    queryFn: async () => {
      const fullEndpoint = `${endpoint}?${queryParams.toString()}`;
      const response = await apiRequest<PaginatedResponse<T>>(
        fullEndpoint,
        "GET",
        undefined,
        token
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch paginated data");
      }

      return response.data;
    },
    enabled: options?.enabled !== false && !!token,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for direct API operations
 */
export function useApi() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  return {
    get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
      return apiRequest<T>(endpoint, "GET", undefined, token);
    },

    post: async <T>(
      endpoint: string,
      data: RequestData
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(endpoint, "POST", data, token);
    },

    put: async <T>(
      endpoint: string,
      data: RequestData
    ): Promise<ApiResponse<T>> => {
      return apiRequest<T>(endpoint, "PUT", data, token);
    },

    delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
      return apiRequest<T>(endpoint, "DELETE", undefined, token);
    },
  };
}

/**
 * Hook for fetching data from the API
 */
export function useFetchData<T>(
  endpoint: string,
  queryKey: string | string[],
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  // debugger;
  console.log("endpoint", endpoint);
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  const actualQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useQuery({
    queryKey: actualQueryKey,
    queryFn: async () => {
      const response = await apiRequest<T>(endpoint, "GET", undefined, token);
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch data");
      }
      return response.data;
    },
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for creating data through the API
 */
export function useCreateData<T, R = T>(
  endpoint: string,
  queryKey: string | string[],
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const queryClient = useQueryClient();
  const actualQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useMutation({
    mutationFn: async (data: R) => {
      const response = await apiRequest<T>(
        endpoint,
        "POST",
        data as RequestData,
        token
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to create data");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actualQueryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for updating data through the API
 */
export function useUpdateData<T, R = Partial<T>>(
  endpoint: string,
  queryKey: string | string[],
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const queryClient = useQueryClient();
  const actualQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useMutation({
    mutationFn: async (data: R) => {
      const response = await apiRequest<T>(
        endpoint,
        "PATCH",
        data as RequestData,
        token
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to update data");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actualQueryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}

/**
 * Hook for deleting data through the API
 */
export function useDeleteData<T>(
  endpoint: string,
  queryKey: string | string[],
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const queryClient = useQueryClient();
  const actualQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiRequest<T>(
        `${endpoint}/${id}`,
        "DELETE",
        undefined,
        token
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to delete data");
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: actualQueryKey });
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
