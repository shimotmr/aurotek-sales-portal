import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 資料類型
export interface TeamMember {
  id: string
  name: string
  english_name?: string
  email?: string
  phone?: string
  region?: string
  status?: 'active' | 'inactive'
  created_at?: string
}

export interface Dealer {
  id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  region?: string
  status?: 'active' | 'inactive'
  address?: string
  notes?: string
  created_at?: string
}

export interface Target {
  id: string
  year: number
  month: number
  rep_id: string
  rep_name?: string
  target_amount: number
  created_at?: string
}
