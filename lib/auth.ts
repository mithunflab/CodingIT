"use client"

import { supabase } from "./supabase"
import type { ViewType } from "@/components/auth"
import type { Session } from "@supabase/supabase-js"
import { usePostHog } from "posthog-js/react"
import { useState, useEffect, useCallback } from "react"

type UserTeam = {
  email: string
  id: string
  name: string
  tier: string
}

export async function getUserTeam(session: Session): Promise<UserTeam | undefined> {
  if (!session?.user?.id) {
    console.warn("[getUserTeam] No session or user ID provided");
    return undefined;
  }
  console.log("[getUserTeam] Returning static default team for user:", session.user.id);
  return createDefaultTeam(session); // Will call the simplified createDefaultTeam
}

// SIMPLIFIED: Returns a static default team object without database interaction.
async function createDefaultTeam(session: Session): Promise<UserTeam> {
  console.log("[createDefaultTeam] Creating static default team object for user:", session.user.id);
  const teamName = session.user.user_metadata?.full_name
    ? `${session.user.user_metadata.full_name}'s Team`
    : session.user.email
      ? `${session.user.email.split("@")[0]}'s Team`
      : "My Default Team";

  const staticDefaultTeam: UserTeam = {
    id: `static_team_for_${session.user.id.replace(/-/g, "").substring(0, 16)}`, // Provide a static ID
    name: teamName,
    tier: "free", // Default tier
    email: session.user.email || "unknown@user.com",
  };
  console.log("[createDefaultTeam] Returning static default team:", staticDefaultTeam);
  return staticDefaultTeam;
}

export function useAuth(setAuthDialog: (value: boolean) => void, setAuthView: (value: ViewType) => void) {
  const [session, setSession] = useState<Session | null>(null)
  const [userTeam, setUserTeam] = useState<UserTeam | undefined>(undefined)
  const [recovery, setRecovery] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const posthog = usePostHog()

  const setupUserTeam = useCallback(
    async (session: Session, retryCount = 0): Promise<UserTeam | undefined> => {
      console.log("[setupUserTeam] Setting up team for user:", session.user.id, "retry:", retryCount)

      try {
        const team = await getUserTeam(session)

        if (!team && retryCount < 2) {
          console.log("[setupUserTeam] No team found, retrying...")
          await new Promise((resolve) => setTimeout(resolve, 1000)) // Wait 1 second
          return setupUserTeam(session, retryCount + 1)
        }

        console.log("[setupUserTeam] Team retrieved:", team)
        setUserTeam(team)
        setAuthError(null) // Clear any previous auth errors
        return team
      } catch (error) {
        console.error("[setupUserTeam] Error setting up team:", error)
        setAuthError("Failed to set up user team. Please try refreshing the page.")

        // Return a fallback team to prevent blocking the user
        const fallbackTeam: UserTeam = {
          id: `fallback_${session.user.id.substring(0, 8)}`,
          name: "Default Team",
          tier: "free",
          email: session.user.email || "unknown@user.com",
        }

        setUserTeam(fallbackTeam)
        return fallbackTeam
      }
    },
    [setUserTeam, setAuthError]
  )

  useEffect(() => {
    const activeSupabase = supabase;

    // Early exit if Supabase is not configured
    if (typeof activeSupabase === "undefined") {
      console.error("Supabase client is not initialized. Authentication cannot proceed.");
      setSession(null);
      setUserTeam(undefined);
      setAuthError("Application is not configured correctly. Supabase client is missing.");
      setIsLoading(false); // Ensure loading is stopped
      return; // Exit useEffect if supabase is not available
    }

    // From this point, activeSupabase is defined.
    const initializeAuth = async () => {
      try {
        // The check for activeSupabase being undefined is now handled by the early return above.
        const { data: { session: initialSession }, error: initialError } = await activeSupabase.auth.getSession();

        if (initialError) {
          console.error("[useAuth] Error getting initial session:", initialError);
          setAuthError("Failed to authenticate. Please try signing in again.");
          setSession(null); // Ensure session is null on error
          setUserTeam(undefined); // Ensure team is undefined
          return;
        }

        console.log("[useAuth] Initial session:", initialSession?.user?.id);
        setSession(initialSession);

        if (initialSession) {
          console.log("[useAuth] Starting team setup for initial session...");
          const teamSetupStartTime = Date.now();
          const teamSetupPromise = setupUserTeam(initialSession);
          const TEAM_SETUP_TIMEOUT = 15000; // Increased to 15 seconds timeout

          try {
            await Promise.race([
              teamSetupPromise,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Team setup timed out')), TEAM_SETUP_TIMEOUT)
              )
            ]);
            const teamSetupEndTime = Date.now();
            console.log(`[useAuth] Team setup completed in ${teamSetupEndTime - teamSetupStartTime}ms.`);
            // If teamSetupPromise resolved, it would have set userTeam via its internal state updates.
          } catch (error: any) {
            const teamSetupEndTime = Date.now();
            console.error(`[useAuth] Error during team setup (duration: ${teamSetupEndTime - teamSetupStartTime}ms, possibly timeout):`, error.message);
            if (error.message === 'Team setup timed out') {
              setAuthError("User team setup took too long. Using default settings. Please refresh if issues persist.");
              // Ensure a fallback team is set if setupUserTeam hung and didn't set one.
              // setupUserTeam is designed to set a fallback in its own catch, but this handles a complete hang.
              setUserTeam(currentTeam => {
                if (currentTeam) return currentTeam; // Already set by a part of setupUserTeam or its internal fallback
                console.warn("[useAuth] Timeout fallback: Setting a minimal team as setupUserTeam hung.");
                return {
                  id: `timeout_fallback_${initialSession.user.id.replace(/-/g, "").substring(0, 16)}`,
                  name: "Default Team (Timeout)",
                  tier: "free",
                  email: initialSession.user.email || "unknown@user.com",
                };
              });
            } else {
              // For other errors not caught by setupUserTeam's internal try/catch (should be rare)
              setAuthError("An unexpected error occurred during team setup.");
            }
          }

          // Proceed with user metadata update and PostHog identification
          if (!initialSession.user.user_metadata?.is_fragments_user) {
            try {
              await activeSupabase.auth.updateUser({
                data: { is_fragments_user: true },
              });
            } catch (updateError) {
              console.warn("[useAuth] Failed to update user metadata:", updateError);
            }
          }

          posthog.identify(initialSession.user.id, {
            email: initialSession.user.email,
            supabase_id: initialSession.user.id,
          });
          // posthog.capture("sign_in"); // This might be redundant if onAuthStateChange also captures it
        }
      } catch (e) {
        console.error("[useAuth] Critical error during initial auth setup:", e);
        setAuthError("An unexpected error occurred during authentication setup.");
        setSession(null);
        setUserTeam(undefined);
      } finally {
        setIsLoading(false); // Ensure isLoading is set to false in all cases
      }
    };

    initializeAuth();

    // Fallback timeout to ensure isLoading is eventually set to false
    const loadingFallbackTimeout = setTimeout(() => {
      setIsLoading(currentIsLoading => {
        if (currentIsLoading) {
          console.warn("[useAuth] Fallback: Forcing isLoading to false after 20s timeout. Auth process might have hung or is very slow.");
          setAuthError(prevError => prevError || "Authentication is taking longer than expected. Displaying page with potentially incomplete auth state.");
        }
        return false;
      });
    }, 20000); // Increased to 20 seconds

    const {
      data: { subscription },
    } = activeSupabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("[useAuth] Auth state change:", _event, session?.user?.id);
      setSession(session)

      if (session) {
        const team = await setupUserTeam(session)
        console.log("[useAuth] Team after auth change:", team)
      } else {
        setUserTeam(undefined)
        setAuthError(null)
      }

      if (_event === "PASSWORD_RECOVERY") {
        setRecovery(true)
        setAuthView("update_password")
        setAuthDialog(true)
      }

      if (_event === "USER_UPDATED" && recovery) {
        setRecovery(false)
      }

      if (_event === "SIGNED_IN" && !recovery) {
        const team = await setupUserTeam(session as Session)
        setAuthDialog(false)

        if (!session?.user.user_metadata?.is_fragments_user) {
          try { // @ts-ignore
            await activeSupabase.auth.updateUser({
              data: { is_fragments_user: true },
            })
          } catch (updateError) {
            console.warn("[useAuth] Failed to update user metadata:", updateError)
          }
        }

        posthog.identify(session?.user.id, {
          email: session?.user.email,
          supabase_id: session?.user.id,
        })
        posthog.capture("sign_in")
      }

      if (_event === "SIGNED_OUT") {
        setAuthView("sign_in")
        setUserTeam(undefined)
        setAuthError(null)
        posthog.capture("sign_out")
        posthog.reset()
        setRecovery(false)
      }
    })

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingFallbackTimeout); // Clear the fallback timeout on unmount
    }
  }, [recovery, setAuthDialog, setAuthView, posthog, setupUserTeam])

  return {
    session,
    userTeam,
    isLoading,
    authError,
  }
}
