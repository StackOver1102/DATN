import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryOptions,
} from "@tanstack/react-query";
import { api } from "../api";

export function useApiQuery<T>(
  key: string | string[],
  endpoint: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number | false;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    refetchOnMount?: boolean;
  }
) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => api.get(endpoint),
    ...options,
  });
}

export function useApiMutation<T, R>(
  key: string | string[],
  endpoint: string,
  method: "post" | "put" | "delete" | "patch" = "post"
) {
  const queryClient = useQueryClient();

  return useMutation<T, Error, R>({
    mutationFn: (data: R) => {
      if (method === "delete") {
        return api.delete(endpoint);
      }
      if (method === "patch") {
        return api.patch(endpoint, data);
      }
      return method === "post"
        ? api.post(endpoint, data)
        : api.put(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(key) ? key : [key],
      });
    },
  });
}
