import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  const token = session?.user?.token;

  // Don't set Content-Type for FormData, let browser set it automatically
  const headers: Record<string, string> = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for JSON data
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "An error occurred");
  }

  return response.json();
}

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  
  post: (endpoint: string, data: unknown) =>
    fetchWithAuth(endpoint, {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  
  put: (endpoint: string, data: unknown) =>
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  
  delete: (endpoint: string) =>
    fetchWithAuth(endpoint, {
      method: "DELETE",
    }),
};