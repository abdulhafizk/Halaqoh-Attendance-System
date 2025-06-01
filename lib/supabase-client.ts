import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database types - Updated to match actual schema
export interface Profile {
  id: string
  username: string
  role: "admin" | "masul_tahfidz" | "tim_tahfidz"
  created_at: string
  updated_at: string
}

export interface Ustadz {
  id: string
  name: string
  halaqoh: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Santri {
  id: string
  name: string
  halaqoh: string
  age?: string
  parent_name?: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  ustadz_id: string
  date: string
  sabaq: boolean
  sabqi: boolean
  manzil: boolean
  notes?: string
  created_at: string
  updated_at: string
  ustadz?: Ustadz
}

// Updated to match actual memorization schema
export interface Memorization {
  id: string
  santri_id: string
  date: string
  surah: string
  ayah_from: number
  ayah_to: number
  quality: "Baik" | "Cukup" | "Kurang"
  notes?: string
  created_at: string
  updated_at: string
  santri?: Santri
}

export interface Schedule {
  id: string
  halaqoh: string
  day: string
  sabaq_time?: string
  sabqi_time?: string
  manzil_time?: string
  location?: string
  notes?: string
  created_at: string
  updated_at: string
}
