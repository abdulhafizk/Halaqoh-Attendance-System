"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase, type Profile } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const rolePermissions = {
  admin: [
    "view_attendance",
    "manage_attendance",
    "view_ustadz",
    "manage_ustadz",
    "view_santri",
    "manage_santri",
    "view_memorization",
    "manage_memorization",
    "view_reports",
    "manage_users",
  ],
  masul_tahfidz: [
    "view_attendance",
    "manage_attendance",
    "view_ustadz",
    "manage_ustadz",
    "view_santri",
    "manage_santri",
    "view_memorization",
    "manage_memorization",
    "view_reports",
  ],
  tim_tahfidz: [
    "view_attendance",
    "view_ustadz",
    "view_santri",
    "view_memorization",
    "manage_memorization",
    "view_reports",
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        console.error("Error loading profile:", error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error("Error loading profile:", error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const hasPermission = (permission: string): boolean => {
    if (!profile) return false
    const permissions = rolePermissions[profile.role as keyof typeof rolePermissions] || []
    return permissions.includes(permission)
  }

  const value = {
    user,
    profile,
    isLoading,
    signOut,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
