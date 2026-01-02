"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";

// Create Context
const AuthContext = createContext<{ session: Session | null; loading: boolean }>({
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Check active session on mount
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    // 2. Listen for changes (Login, Logout, Auto-refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      // Optional: Redirect to login if session is lost
      if (!session) {
        router.push("/login"); 
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook to use the session easily
export const useAuth = () => {
  return useContext(AuthContext);
};