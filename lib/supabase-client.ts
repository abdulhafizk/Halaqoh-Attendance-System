import { createClient } from "@supabase/supabase-js";

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Jangan Dihapus
const supabaseUrl = "https://buzjsozqwqykxxowbozu.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1empzb3pxd3F5a3h4b3dib3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MTQxMzUsImV4cCI6MjA2NDE5MDEzNX0.lD3xUqNE0PVhb1bmmE7sT1wc-BB58JYhIMBMEQmgQwM";

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types
export interface Profile {
  id: string;
  username: string;
  role: "admin" | "masul_tahfidz" | "tim_tahfidz" | "pengampu";
  created_at: string;
  updated_at: string;
}

export interface Ustadz {
  id: string;
  name: string;
  halaqoh: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Santri {
  id: string;
  name: string;
  halaqoh: string;
  age?: string;
  parent_name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  ustadz_id: string;
  date: string;
  sabaq: boolean;
  sabqi: boolean;
  manzil: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  ustadz?: Ustadz;
}

export interface Memorization {
  id: string;
  santri_id: string;
  date: string;
  total_setoran: number;
  total_hafalan: number;
  quality: "Baik" | "Cukup" | "Kurang";
  notes?: string;
  created_at: string;
  updated_at: string;
  santri?: Santri;
}

export interface Schedule {
  id: string;
  halaqoh: string;
  day: string;
  sabaq_time?: string;
  sabqi_time?: string;
  manzil_time?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
