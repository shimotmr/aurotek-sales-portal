import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getAdminList, addAdmin, updateAdmin, removeAdmin } from '@/lib/admins'

export async function GET() {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  const admins = await getAdminList()
  return NextResponse.json({ admins })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  const currentUser = cookieStore.get('user_name')?.value || 'unknown'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { employee_id, email, nickname, role, name, title } = await request.json()
    if (!employee_id) return NextResponse.json({ error: '帳號為必填' }, { status: 400 })

    const result = await addAdmin({
      employee_id,
      email: email || null,
      nickname: nickname || null,
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      added_by: currentUser,
      name: name || null,
      title: title || null,
    })

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true, admin: result.admin })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { employee_id, email, nickname, role } = await request.json()
    if (!employee_id) return NextResponse.json({ error: 'employee_id required' }, { status: 400 })

    const updates: any = {}
    if (email !== undefined) updates.email = email || null
    if (nickname !== undefined) updates.nickname = nickname || null
    if (role !== undefined) updates.role = role

    const success = await updateAdmin(employee_id, updates)
    if (!success) return NextResponse.json({ error: '更新失敗' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { employee_id } = await request.json()
    const success = await removeAdmin(employee_id)
    if (!success) {
      if (employee_id === 'williamhsiao') return NextResponse.json({ error: '無法移除系統超級管理員' }, { status: 400 })
      return NextResponse.json({ error: '找不到此管理員' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
  }
}
