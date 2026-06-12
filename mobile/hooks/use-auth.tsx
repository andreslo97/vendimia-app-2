import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { supabase } from "@/services/supabase";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const nativePasswordRecoveryRedirectUrl = "vendimiaapp://auth/reset-password";

const getPasswordRecoveryRedirectUrl = () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `${window.location.origin}/auth/reset-password`;
  }

  return nativePasswordRecoveryRedirectUrl;
};

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId?: string) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,email,role")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) throw error;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      loadProfile(nextSession?.user.id).catch(() => setProfile(null));
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (fullName, email, password) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: Linking.createURL("/auth/login"),
            data: {
              full_name: fullName
            }
          }
        });
        if (error) throw error;

        supabase.functions
          .invoke("send-registration-email", {
            body: {
              fullName,
              email
            }
          })
          .catch(() => undefined);
      },
      resetPasswordForEmail: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getPasswordRecoveryRedirectUrl()
        });
        if (error) throw error;
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setProfile(null);
      },
      refreshProfile: async () => loadProfile(session?.user.id)
    }),
    [loading, profile, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
