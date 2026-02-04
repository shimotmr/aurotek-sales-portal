import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { 
  Admin, 
  getAdminList, 
  addAdmin, 
  removeAdmin 
} from '@/lib/admins'

// GET: 讀取管理員名單
export async function GET() {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  
  // 只有超級管理員可以讀取完整名單
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  return NextResponse.json({ admins: getAdminList() })
}

// POST: 新增管理員
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  const currentUser = cookieStore.get('user_email')?.value || 'unknown'
  
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  try {
    const { email, role } = await request.json()
    
    const normalizedEmail = email.includes('@') ? email : `${email}@aurotek.com`
    
    const newAdmin: Admin = {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: role === 'super_admin' ? 'super_admin' : 'admin',
      addedAt: new Date().toISOString().split('T')[0],
      addedBy: currentUser
    }
    
    const success = addAdmin(newAdmin)
    
    if (!success) {
      return NextResponse.json({ error: '此帳號已是管理員' }, { status: 400 })
    }
    
    console.log('[ADMIN] Added:', newAdmin)
    
    return NextResponse.json({ success: true, admin: newAdmin })
  } catch (error) {
    console.error('Failed to add admin:', error)
    return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 })
  }
}

// DELETE: 移除管理員
export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const isSuperAdmin = cookieStore.get('is_super_admin')?.value === 'true'
  
  if (!isSuperAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  try {
    const { email } = await request.json()
    
    const success = removeAdmin(email)
    
    if (!success) {
      if (email === 'williamhsiao@aurotek.com') {
        return NextResponse.json({ error: '無法移除系統超級管理員' }, { status: 400 })
      }
      return NextResponse.json({ error: '找不到此管理員' }, { status: 404 })
    }
    
    console.log('[ADMIN] Removed:', email)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove admin:', error)
    return NextResponse.json({ error: 'Failed to remove admin' }, { status: 500 })
  }
}
