"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/lib/store/userStore";
import { useApi } from "@/lib/hooks/useApi";
import { User } from "@/lib/types";

/**
 * This component initializes and synchronizes data between stores and session
 */
export function StoreInitializer() {
  const { data: session, status } = useSession();
  const { profile, hasLoadedProfile, setProfile, setHasLoadedProfile } = useUserStore();
  const api = useApi();
  
  // Use ref to track if profile has been loaded
  // to avoid infinite loops
  const hasInitializedRef = useRef(false);
  
  // Only load profile information once when user is logged in
  // and profile hasn't been loaded before
  useEffect(() => {
    const initializeProfile = async () => {
      // Only load if logged in, profile not loaded, and not initialized before
      // Skip API call if we already have profile data
      if (status === 'authenticated' && session && !hasLoadedProfile && !hasInitializedRef.current && !profile) {
        // Mark as initialized to avoid calling again
        hasInitializedRef.current = true;
        
        try {
          const response = await api.get<User>('users/profile');
          if (response.success && response.data) {
            setProfile(response.data);
            setHasLoadedProfile(true);
          }
        } catch (error) {
          console.error("Failed to initialize profile:", error);
          // Reset flag if there's an error to try again
          hasInitializedRef.current = false;
        }
      } else if (profile && !hasLoadedProfile) {
        // If we already have profile data but hasLoadedProfile is false,
        // just mark it as loaded without making an API call
        setHasLoadedProfile(true);
      }
    };
    
    initializeProfile();
  }, [session, status, hasLoadedProfile, profile, setProfile, setHasLoadedProfile, api]);

  return null;
} 