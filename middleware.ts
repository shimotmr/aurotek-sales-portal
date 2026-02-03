import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要登入的路徑
const PUBLIC_PATHS = [
  '/api/auth',  // 認證 API
  '/_next',     // Next.js 資源
  '/favicon.ico',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 檢查是否為公開路徑
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 檢查登入狀態（從 cookie 讀取）
  const authToken = request.cookies.get('auth_token')?.value
  const isLoggedIn = authToken && authToken.length > 0
  
  // 未登入時重定向到登入頁面
  if (!isLoggedIn) {
    // 如果已經在登入頁面，不重定向
    if (pathname === '/login') {
      return NextResponse.next()
    }
    
    // 保存原始路徑，登入後可以跳回
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 後台管理頁面需要額外檢查管理員權限
  if (pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('is_admin')?.value === 'true'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
