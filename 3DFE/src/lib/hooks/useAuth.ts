import { useMutation } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from '../types';
import { useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '../store/userStore';
import { useApi } from './useApi';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  captchaToken: string;
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
    onSuccess: (data, variables) => {
      router.push(`/check-email?email=${encodeURIComponent(variables.email)}`);
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
 * Simple hook for accessing user profile data
 * This hook will fetch the profile only once when needed
 * and won't cause continuous API calls
 */
export function useUserProfile() {
  const { data: session, status } = useSession();
  const api = useApi();
  const {
    profile,
    isLoading,
    setProfile,
    setLoading,
    setError,
    setHasLoadedProfile,
    hasLoadedProfile
  } = useUserStore();

  // Function to fetch profile directly without causing re-renders
  const fetchProfile = useCallback(async () => {
    // If we already have the profile data, just return it without API call
    if (profile) return profile;

    // If we've already marked it as loaded but don't have data, something's wrong
    if (hasLoadedProfile && !profile) {
      setHasLoadedProfile(false); // Reset the flag to try loading again
    }

    try {
      setLoading(true);
      const response = await api.get<User>('users/profile');
      if (response.success && response.data) {
        setProfile(response.data);
        setHasLoadedProfile(true);
        return response.data;
      } else {
        setError(response.message || "Failed to load profile");
        return null;
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, profile, hasLoadedProfile, setHasLoadedProfile, setLoading, setError, setProfile]);

  // Load profile once if authenticated and not already loaded
  useEffect(() => {
    if (status === 'authenticated' && !hasLoadedProfile && !profile) {
      fetchProfile();
    }
  }, [status, hasLoadedProfile, profile, fetchProfile]);

  return {
    profile,
    isLoading,
    fetchProfile,
    isAuthenticated: status === 'authenticated',
    session
  };
}
