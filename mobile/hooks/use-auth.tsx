import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { AppState, Platform } from "react-native";

import { registerPushToken } from "@/services/pushNotificationsService";
import { normalizePhoneNumber, resolveEmailByPhone } from "@/services/phoneCountryService";
import { supabase } from "@/services/supabase";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  can_manage_appointments: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (identifier: string, password: string, phoneCountryCode?: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, phoneCountryCode: string, phoneNumber: string, avatarUri?: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  updateProfileDetails: (fullName: string, email: string, phoneCountryCode: string, phoneNumber: string) => Promise<void>;
  updateProfileAvatar: (imageUri: string) => Promise<void>;
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

const uploadProfileAvatar = async (userId: string, imageUri: string) => {
  const imageResponse = await fetch(imageUri);
  const imageBody = await imageResponse.arrayBuffer();
  const storagePath = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("profile-avatars")
    .upload(storagePath, imageBody, {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: true
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
  return data.publicUrl;
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
      .select("id,full_name,email,role,avatar_url,phone_country_code,phone_number,can_manage_appointments")
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

  useEffect(() => {
    if (!session?.user.id) return;
    registerPushToken(session.user.id).catch(() => undefined);
  }, [session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        registerPushToken(session.user.id).catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn: async (identifier, password, phoneCountryCode) => {
        const normalizedIdentifier = identifier.trim();
        const email = normalizedIdentifier.includes("@")
          ? normalizedIdentifier.toLowerCase()
          : await resolveEmailByPhone(phoneCountryCode ?? "", normalizedIdentifier);

        if (!email) throw new Error("No encontramos una cuenta con ese teléfono.");

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (fullName, email, password, phoneCountryCode, phoneNumber, avatarUri) => {
        const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: Linking.createURL("/auth/login"),
            data: {
              full_name: fullName,
              phone_country_code: phoneCountryCode,
              phone_number: normalizedPhoneNumber
            }
          }
        });
        if (error) throw error;

        if (data.user) {
          const { error: phoneError } = await supabase
            .from("profiles")
            .update({
              phone_country_code: phoneCountryCode,
              phone_number: normalizedPhoneNumber
            })
            .eq("id", data.user.id);

          if (phoneError && data.session) throw phoneError;
        }

        if (avatarUri && data.user && data.session) {
          const avatarUrl = await uploadProfileAvatar(data.user.id, avatarUri);

          const { error: profileError } = await supabase
            .from("profiles")
            .update({ avatar_url: avatarUrl })
            .eq("id", data.user.id);

          if (profileError) throw profileError;
          await loadProfile(data.user.id);
        }

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

        if (session?.user.id) {
          await supabase.from("profile_change_logs").insert({
            user_id: session.user.id,
            changed_by: session.user.id,
            field_name: "password",
            old_value: null,
            new_value: "updated"
          });
        }
      },
      updateProfileDetails: async (fullName, email, phoneCountryCode, phoneNumber) => {
        if (!session?.user.id) throw new Error("No active user session.");

        const normalizedFullName = fullName.trim().replace(/\s+/g, " ");
        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

        if (normalizedEmail !== session.user.email) {
          const { error: authError } = await supabase.auth.updateUser({ email: normalizedEmail });
          if (authError) throw authError;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: normalizedFullName,
            email: normalizedEmail,
            phone_country_code: phoneCountryCode,
            phone_number: normalizedPhoneNumber
          })
          .eq("id", session.user.id);

        if (profileError) throw profileError;
        await loadProfile(session.user.id);
      },
      updateProfileAvatar: async (imageUri) => {
        if (!session?.user.id) throw new Error("No active user session.");

        const avatarUrl = await uploadProfileAvatar(session.user.id, imageUri);

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", session.user.id);

        if (updateError) throw updateError;
        await loadProfile(session.user.id);
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
