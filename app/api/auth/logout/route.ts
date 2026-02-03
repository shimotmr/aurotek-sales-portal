import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userEmail = cookieStore.get('user_email')?.value || 'unknown'
    
    // 記錄登出 log
    console.log('[ACTIVITY LOG]', JSON.stringify({
      action: 'logout',
      user: userEmail,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    }))
    
    // 清除所有認證 cookies
    cookieStore.delete('auth_token')
    cookieStore.delete('user_email')
    cookieStore.delete('user_name')
    cookieStore.delete('is_admin')
    cookieStore.delete('is_super_admin')
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
