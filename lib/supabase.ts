import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  username: string
  full_name?: string
  role: "admin" | "masul_tahfidz" | "tim_tahfidz"
  last_login?: string
  login_count?: number
  is_active?: boolean
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
  alpha: boolean
  sakit: boolean
  izin: boolean
  notes?: string
  created_at: string
  updated_at: string
  ustadz?: Ustadz
}

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

export interface TargetHafalan {
  id: string
  kelas: string
  target_juz: number
  merah_min: number
  merah_max: number
  kuning_min: number
  kuning_max: number
  hijau_min: number
  hijau_max: number
  biru_min: number
  biru_max: number
  pink_threshold: number
  created_at: string
  updated_at: string
}

export interface UserLoginStats {
  id: string
  username: string
  full_name: string
  role: string
  last_login: string | null
  login_count: number
  is_active: boolean
  created_at: string
}
