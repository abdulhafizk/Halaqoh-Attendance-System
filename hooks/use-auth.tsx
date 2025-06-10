"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, type Profile } from "@/lib/supabase-client"

interface AuthUser {
  id: string
  username: string
  role: "admin" | "masul_tahfidz" | "tim_tahfidz"
  loginTime: string
  isDemo?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  profile: Profile | null
  login: (username: string, password: string, role: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role permissions
const PERMISSIONS = {
  admin: [
    "view_dashboard",
    "manage_attendance",
    "manage_memorization",
    "view_reports",
    "manage_ustadz",
    "manage_santri",
    "manage_schedule",
    "manage_users",
    "export_data",
  ],
  masul_tahfidz: [
    "view_dashboard",
    "manage_attendance",
    "manage_memorization",
    "view_reports",
    "manage_santri",
    "manage_schedule",
    "export_data",
  ],
  tim_tahfidz: ["view_dashboard", "manage_attendance", "manage_memorization", "view_reports"],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkSession()
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login")
    } else if (!isLoading && user && pathname === "/login") {
      router.push("/")
    }
  }, [user, isLoading, pathname, router])

  const checkSession = async () => {
    try {
      // Check Supabase session for real users only
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error("Error checking session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error loading profile:", error)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setUser({
          id: profileData.id,
          username: profileData.username,
          role: profileData.role,
          loginTime: new Date().toISOString(),
          isDemo: false,
        })
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error)
    }
  }

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      // Only try Supabase auth for real users (email-based login)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username, // Username should be email for real users
        password: password,
      })

      if (error) {
        console.error("Login error:", error)
        return false
      }

      if (data.user) {
        await loadUserProfile(data.user.id)
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()

      setUser(null)
      setProfile(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    return PERMISSIONS[user.role]?.includes(permission) || false
  }

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
