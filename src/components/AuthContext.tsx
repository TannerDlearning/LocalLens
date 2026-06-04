"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isPremium: boolean;
  loggedIn: boolean;
  userId: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // LocalLens is a single-tier project build: every authenticated user has full access.
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Single-tier model: any logged-in user receives full access to all features.
  const loadPremium = async (u: User | null) => {
    setIsPremium(!!u);
  };

   useEffect(() => {
    // Get current session on mount
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error('Error getting session:', error);

      await loadPremium(session?.user ?? null);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();
    
    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setIsPremium(!!session?.user);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

   const value: AuthContextType = {
    user,
    isPremium,
    loggedIn: !!user,
    userId: user?.id ?? null,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
