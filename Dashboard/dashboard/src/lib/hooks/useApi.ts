import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useApiQuery<T>(key: string | string[], endpoint: string) {
  return useQuery<T>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => api.get(endpoint),
  });
}

export function useApiMutation<T, R>(
  key: string | string[],
  endpoint: string,
  method: "post" | "put" | "delete" = "post"
) {
  const queryClient = useQueryClient();
  
  return useMutation<T, Error, R>({
    mutationFn: (data: R) => {
      if (method === "delete") {
        return api.delete(endpoint);
      }
      return method === "post" ? api.post(endpoint, data) : api.put(endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
    },
  });
}