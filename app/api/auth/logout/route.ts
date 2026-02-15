import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userEmail = cookieStore.get('user_email')?.value || 'unknown'
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // 記錄登出到 logs API
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000'
      
      await fetch(`${baseUrl}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'logout',
          user: userEmail,
          timestamp: new Date().toISOString(),
          ip: ip,
          details: '用戶登出'
        })
      }).catch(() => {
        console.log('[ACTIVITY LOG]', JSON.stringify({
          action: 'logout',
          user: userEmail,
          timestamp: new Date().toISOString(),
          ip: ip,
        }))
      })
    } catch {
      // 忽略日誌錯誤
    }
    
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
