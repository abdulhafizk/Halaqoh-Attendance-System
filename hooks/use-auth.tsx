"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase, type Profile } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

interface AuthUser {
  id: string
  username: string
  role: "admin" | "masul_tahfidz" | "tim_tahfidz"
  loginTime: string
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

// Demo users for development
const DEMO_USERS = {
  admin: { username: "admin", password: "admin123", role: "admin" },
  masul: { username: "masul", password: "masul123", role: "masul_tahfidz" },
  tim: { username: "tim", password: "tim123", role: "tim_tahfidz" },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // First check for demo session
        const demoSession = localStorage.getItem("demoUserSession")
        if (demoSession) {
          const userData = JSON.parse(demoSession)
          setUser(userData)
          setIsLoading(false)
          return
        }

        // Then check Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserProfile(session.user)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading && !user && pathname !== "/login") {
      router.push("/login")
    } else if (!isLoading && user && pathname === "/login") {
      router.push("/")
    }
  }, [user, isLoading, pathname, router])

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

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
        })
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error)
    }
  }

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      // Check if it's a demo user first
      const demoUser = Object.values(DEMO_USERS).find(
        (u) => u.username === username && u.password === password && u.role === role,
      )

      if (demoUser) {
        // Demo login
        const userData: AuthUser = {
          id: `demo-${username}`,
          username: demoUser.username,
          role: demoUser.role as "admin" | "masul_tahfidz" | "tim_tahfidz",
          loginTime: new Date().toISOString(),
        }

        setUser(userData)
        localStorage.setItem("demoUserSession", JSON.stringify(userData))
        return true
      }

      // Try Supabase auth (for real users)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      })

      if (error) {
        console.error("Login error:", error)
        return false
      }

      if (data.user) {
        await loadUserProfile(data.user)
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
      // Clear demo session first
      localStorage.removeItem("demoUserSession")

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
