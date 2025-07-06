"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, type Profile } from "@/lib/supabase";

interface AuthUser {
  id: string;
  username: string;
  full_name?: string;
  role: "admin" | "masul_tahfidz" | "tim_tahfidz" | "pengampu";
  loginTime: string;
  email?: string;
  last_login?: string;
  login_count?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role permissions - KEEPING ALL ATTENDANCE FEATURES
const PERMISSIONS = {
  admin: [
    "view_dashboard",
    "manage_attendance",
    "manage_memorization",
    "view_reports",
    "manage_ustadz",
    "manage_santri",
    "manage_users",
    "export_data",
  ],
  masul_tahfidz: [
    "view_dashboard",
    "manage_attendance",
    "manage_memorization",
    "view_reports",
    "manage_ustadz",
    "manage_santri",
    "manage_users",
    "export_data",
  ],
  tim_tahfidz: [
    "view_dashboard",
    "manage_attendance",
    "manage_memorization",
    "manage_target_hafalan",
    "view_reports",
  ],
  pengampu: ["view_dashboard", "manage_memorization"],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    // Redirect logic
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login");
    } else if (!isLoading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  const initializeAuth = async () => {
    try {
      setError(null);

      // Check current session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        await loadUserProfile(session.user.id, session.user.email || "");
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Auth state changed:", event);

        if (event === "SIGNED_IN" && session?.user) {
          await loadUserProfile(session.user.id, session.user.email || "");
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setError(null);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("Error initializing auth:", error);
      setError("Failed to initialize authentication");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      setError(null);
      console.log("Loading profile for user:", userId, email);

      // Extract username from email (part before @)
      const username = email.split("@")[0];
      console.log("Looking for username:", username);

      // Query profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (profileError) {
        console.error("Error loading profile:", profileError);
        setError(`Profile lookup failed: ${profileError.message}`);
        return;
      }

      if (profileData) {
        console.log("Profile found:", profileData);

        // Update the profile ID to match the auth user ID if different
        if (profileData.id !== userId) {
          console.log("Updating profile ID to match auth user");
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ id: userId })
            .eq("username", username);

          if (updateError) {
            console.error("Error updating profile ID:", updateError);
          }
        }

        // Update last login
        await supabase.rpc("update_last_login", { user_id: userId });

        setProfile({ ...profileData, id: userId });
        setUser({
          id: userId,
          username: profileData.username,
          full_name: profileData.full_name,
          role: profileData.role,
          loginTime: new Date().toISOString(),
          email: email,
          last_login: profileData.last_login,
          login_count: profileData.login_count,
        });
      } else {
        console.log("No profile found for username:", username);
        setError(
          `No profile found for username: ${username}. Please contact administrator.`
        );
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
      setError("Failed to load user profile");
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      console.log("Attempting login for:", email);

      // Sign in with Supabase Auth
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (signInError) {
        console.error("Login error:", signInError);
        setError(signInError.message);
        return false;
      }

      if (data.user) {
        console.log("Login successful, user:", data.user.id);
        // Profile will be loaded via the auth state change listener
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      console.log("Starting logout process...");

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
        setError("Logout failed");
        return;
      }

      console.log("Logout successful, clearing user state...");

      // Clear user state
      setUser(null);
      setProfile(null);

      // Redirect to login page
      router.push("/login");

      console.log("Logout completed successfully");
    } catch (error) {
      console.error("Logout error:", error);
      setError("Logout failed");
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, login, logout, hasPermission, isLoading, error }}
    >
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
