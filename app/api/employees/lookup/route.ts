import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('is_admin')?.value === 'true'
  const currentUser = cookieStore.get('user_name')?.value?.split('@')[0] || ''

  const { searchParams } = new URL(request.url)
  const employee_id = searchParams.get('employee_id')

  // Allow self-lookup or admin lookup
  if (!isAdmin && employee_id !== currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 })

  // 工號查詢（employee_id = u-number）,也支援 email 帳號查詢
  let data, error
  ;({ data, error } = await supabase
    .from('employees')
    .select('employee_id, emp_code, name, email, department, title')
    .eq('employee_id', employee_id)
    .maybeSingle())
  
  // Fallback: try email prefix match
  if (!data && !error) {
    ;({ data, error } = await supabase
      .from('employees')
      .select('employee_id, emp_code, name, email, department, title')
      .ilike('email', `${employee_id}@%`)
      .maybeSingle())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '查無此工號' }, { status: 404 })

  return NextResponse.json(data)
}
