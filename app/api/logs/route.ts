import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 內存日誌存儲（重啟會重置，但 serverless 函數在一段時間內會保持）
// 未來可改用 Vercel KV 或 Google Sheets
let activityLogs: LogEntry[] = []

export interface LogEntry {
  id: string
  timestamp: string
  action: string
  user: string
  ip: string
  userAgent?: string
  details: string
}

// GET: 讀取日誌
export async function GET(request: Request) {
  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('is_admin')?.value === 'true'
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '100')
  const action = searchParams.get('action')
  const user = searchParams.get('user')
  
  let filtered = [...activityLogs]
  
  if (action && action !== 'all') {
    filtered = filtered.filter(log => log.action === action)
  }
  
  if (user) {
    filtered = filtered.filter(log => 
      log.user.toLowerCase().includes(user.toLowerCase())
    )
  }
  
  // 最新的在前面
  filtered.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  
  return NextResponse.json({
    logs: filtered.slice(0, limit),
    total: filtered.length
  })
}

// POST: 新增日誌
export async function POST(request: Request) {
  try {
    const log = await request.json()
    
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: log.timestamp || new Date().toISOString(),
      action: log.action,
      user: log.user,
      ip: log.ip || request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: log.userAgent,
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})
    }
    
    // 加到開頭
    activityLogs.unshift(entry)
    
    // 只保留最近 500 條
    if (activityLogs.length > 500) {
      activityLogs = activityLogs.slice(0, 500)
    }
    
    console.log('[ACTIVITY LOG]', JSON.stringify(entry))
    
    return NextResponse.json({ success: true, id: entry.id })
  } catch (error) {
    console.error('Failed to log:', error)
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}

// 初始化一些示範日誌（首次載入時）
if (activityLogs.length === 0) {
  activityLogs = [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      action: 'system',
      user: 'system',
      ip: 'server',
      details: '系統日誌初始化'
    }
  ]
}
