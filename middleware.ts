import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公開路徑（不需要登入）
  const publicPaths = ['/login', '/api/auth']
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // 靜態資源跳過
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }
  
  // 檢查登入狀態
  const authToken = request.cookies.get('auth_token')?.value
  
  if (!authToken) {
    // 未登入，重定向到登入頁面
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // 後台管理頁面需要管理員權限
  if (pathname.startsWith('/admin')) {
    const isAdmin = request.cookies.get('is_admin')?.value === 'true'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
