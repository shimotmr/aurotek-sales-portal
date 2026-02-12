import { supabase } from './supabase'

export interface Admin {
  id?: number
  employee_id: string
  email: string | null
  nickname: string | null
  name: string | null
  title: string | null
  role: 'admin' | 'super_admin'
  added_by: string
  created_at?: string
  updated_at?: string
}

// 取得所有管理員
export async function getAdminList(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from('portal_admins')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error('getAdminList error:', error); return [] }
  return data || []
}

// 新增管理員
export async function addAdmin(admin: Pick<Admin, 'employee_id' | 'email' | 'nickname' | 'role' | 'added_by' | 'name' | 'title'>): Promise<{ success: boolean; admin?: Admin; error?: string }> {
  const { data, error } = await supabase
    .from('portal_admins')
    .insert({
      employee_id: admin.employee_id,
      email: admin.email || null,
      nickname: admin.nickname || null,
      name: admin.name || null,
      title: admin.title || null,
      role: admin.role,
      added_by: admin.added_by,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return { success: false, error: '此帳號已是管理員' }
    return { success: false, error: error.message }
  }
  return { success: true, admin: data }
}

// 更新管理員
export async function updateAdmin(employee_id: string, updates: Partial<Pick<Admin, 'email' | 'nickname' | 'role'>>): Promise<boolean> {
  const { error } = await supabase
    .from('portal_admins')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('employee_id', employee_id)
  if (error) { console.error('updateAdmin error:', error); return false }
  return true
}

// 移除管理員
export async function removeAdmin(employee_id: string): Promise<boolean> {
  if (employee_id === 'u1612' || employee_id === 'williamhsiao') return false
  const { error, count } = await supabase
    .from('portal_admins')
    .delete()
    .eq('employee_id', employee_id)
  if (error) { console.error('removeAdmin error:', error); return false }
  return true
}

// 檢查是否為管理員（支援工號 u1612 或 email 帳號 williamhsiao）
export async function isAdmin(identifier: string): Promise<boolean> {
  const id = identifier.includes('@') ? identifier.split('@')[0] : identifier
  // Try direct match first
  let { data } = await supabase
    .from('portal_admins')
    .select('id')
    .eq('employee_id', id)
    .maybeSingle()
  if (data) return true
  // Fallback: match by email
  ;({ data } = await supabase
    .from('portal_admins')
    .select('id')
    .ilike('email', `${id}@%`)
    .maybeSingle())
  return !!data
}

// 檢查是否為超級管理員（支援工號或 email 帳號）
export async function isSuperAdmin(identifier: string): Promise<boolean> {
  const id = identifier.includes('@') ? identifier.split('@')[0] : identifier
  let { data } = await supabase
    .from('portal_admins')
    .select('role')
    .eq('employee_id', id)
    .maybeSingle()
  if (!data) {
    ;({ data } = await supabase
      .from('portal_admins')
      .select('role')
      .ilike('email', `${id}@%`)
      .maybeSingle())
  }
  return data?.role === 'super_admin'
}
