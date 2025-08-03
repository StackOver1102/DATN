"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  fetchUserProfile,
  setHasLoadedProfile,
  setSessionLoaded,
} from "@/lib/store/userSlice";

/**
 * This component initializes and synchronizes data between Redux store and session
 */
export function StoreInitializer() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { profile, hasLoadedProfile, sessionLoaded } = useAppSelector(
    (state) => state.user
  );

  // Use ref to track if profile has been loaded
  // to avoid infinite loops
  const hasInitializedRef = useRef(false);

  // Track session status changes
  useEffect(() => {
    // Mark session as loaded when status is no longer loading
    if (status !== "loading" && !sessionLoaded) {
      dispatch(setSessionLoaded(true));
    }
  }, [status, sessionLoaded, dispatch]);

  // Only load profile information once when user is logged in
  // and profile hasn't been loaded before
  useEffect(() => {
    const initializeProfile = async () => {
      // Only load if logged in, profile not loaded, and not initialized before
      // Skip API call if we already have profile data
      if (
        status === "authenticated" &&
        session &&
        !hasLoadedProfile &&
        !hasInitializedRef.current &&
        !profile &&
        sessionLoaded // Only proceed if session is fully loaded
      ) {
        // Mark as initialized to avoid calling again
        hasInitializedRef.current = true;

        try {
          const token = session?.accessToken as string | undefined;
          await dispatch(fetchUserProfile(token)).unwrap();
        } catch (error) {
          console.error("Failed to initialize profile:", error);
          // Reset flag if there's an error to try again
          hasInitializedRef.current = false;
        }
      } else if (profile && !hasLoadedProfile) {
        // If we already have profile data but hasLoadedProfile is false,
        // just mark it as loaded without making an API call
        dispatch(setHasLoadedProfile(true));
      }
    };

    initializeProfile();
  }, [session, status, hasLoadedProfile, profile, dispatch, sessionLoaded]);

  return null;
}
