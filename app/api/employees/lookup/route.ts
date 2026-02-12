import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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

  // Support both emp_code (u2349) and employee_id (email prefix)
  let data, error
  if (employee_id.startsWith('u') && /^u\d+$/.test(employee_id)) {
    ({ data, error } = await supabase
      .from('employees')
      .select('employee_id, emp_code, name, email, department, title')
      .eq('emp_code', employee_id)
      .maybeSingle())
  } else {
    ({ data, error } = await supabase
      .from('employees')
      .select('employee_id, emp_code, name, email, department, title')
      .eq('employee_id', employee_id)
      .maybeSingle())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '查無此工號' }, { status: 404 })

  return NextResponse.json(data)
}
