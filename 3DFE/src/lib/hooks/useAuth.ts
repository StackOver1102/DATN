import { useMutation, useQuery } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import { apiRequest } from '../api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
}

/**
 * Hook for handling user login
 */
export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const result = await signIn('credentials', {
        ...credentials,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      router.push('/');
      router.refresh();
    },
  });
}

/**
 * Hook for handling user registration
 */
export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register  `, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    },
    onSuccess: () => {
      router.push('/signin?message=Registration successful. Please sign in.');
    },
  });
}

/**
 * Hook for handling user logout
 */
export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      router.push('/signin');
      router.refresh();
    },
  });
}

/**
 * Hook for fetching user profile
 */
export function useUserProfile(token?: string) {
  return useQuery({
    queryKey: ['userProfile', token],
    queryFn: async () => {
      if (!token) return null;
      try {
        const response = await apiRequest<User>('users/profile', 'GET', undefined, token);
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch user profile');
        }
        return response.data;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }
    },
    enabled: !!token,
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
 