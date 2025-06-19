"use client";

import React, { createContext, useContext, ReactNode, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useAuth as useAppAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { ViewType } from "@/components/auth/types"; // Added for setAuthView

type UserTeam = {
  email: string;
  id: string;
  name: string;
  tier: string;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userTeam: UserTeam | undefined; 
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  openAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
  // openAuthDialog is now part of the return from useAppAuth
  const { openAuthDialog } = useAppAuth(setAuthDialog, setAuthView);


  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const contextValue = { session, user, userTeam, isLoading, authError, signOut, openAuthDialog };

  useEffect(() => {
    console.log('[AuthContext.tsx] Context values updated:', {
      session: session?.user?.id,
      user: user?.id,
      userTeam: userTeam?.id,
      isLoading,
      authError,
    });
  }, [session, user, userTeam, isLoading, authError]);

  return (
    <AuthContext.Provider value={contextValue}>
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
