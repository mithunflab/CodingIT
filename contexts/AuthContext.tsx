"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useAuth as useAppAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ViewType } from "@/components/auth/types"; // Added for setAuthView

// Copied from lib/auth.ts
type UserTeam = {
  email: string;
  id: string;
  name: string;
  tier: string;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userTeam: UserTeam | undefined; // Use the defined UserTeam type
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  // Consider if setAuthDialog and setAuthView are needed globally
  // For now, they are not part of the context value but handled by useAppAuth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Dummy functions for setAuthDialog and setAuthView as per plan.
  // If these need to be globally accessible or modifiable,
  // their state and setters would need to be part of this context
  // or another global state management solution.
  const setAuthDialog = (value: boolean) => {
    console.log("AuthDialog state changed (globally, placeholder):", value);
  };
  const setAuthView = (view: ViewType) => {
    console.log("AuthView state changed (globally, placeholder):", view);
  };

  const { session, userTeam, isLoading, authError } = useAppAuth(
    setAuthDialog,
    setAuthView
  );
  const user = session?.user ?? null;

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      // Optionally, update authError state here if it's part of the context
    }
    // onAuthStateChange in useAppAuth should handle resetting session, userTeam etc.
  };

  return (
    <AuthContext.Provider
      value={{ session, user, userTeam, isLoading, authError, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
