import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export interface LogEntry {
  id?: string
  timestamp: string
  action: string
  user_email: string
  ip: string
  user_agent?: string
  details: string
  created_at?: string
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
  
  try {
    let query = supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (action && action !== 'all') {
      query = query.eq('action', action)
    }
    
    if (user) {
      query = query.ilike('user_email', `%${user}%`)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // 轉換欄位名稱以兼容前端
    const logs = (data || []).map(row => ({
      id: row.id,
      timestamp: row.timestamp || row.created_at,
      action: row.action,
      user: row.user_email,
      ip: row.ip,
      userAgent: row.user_agent,
      details: row.details
    }))
    
    return NextResponse.json({
      logs,
      total: logs.length
    })
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    return NextResponse.json({
      logs: [],
      total: 0,
      error: '讀取日誌失敗'
    })
  }
}

// POST: 新增日誌
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const userEmail = cookieStore.get('user_email')?.value || 'anonymous'
    
    const log = await request.json()
    
    const entry = {
      timestamp: log.timestamp || new Date().toISOString(),
      action: log.action,
      user_email: log.user || log.user_email || userEmail,
      ip: log.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: log.userAgent || log.user_agent || request.headers.get('user-agent') || '',
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})
    }
    
    const { data, error } = await supabase
      .from('logs')
      .insert(entry)
      .select('id')
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error('Failed to log:', error)
    // 即使日誌失敗也不要影響主流程
    return NextResponse.json({ success: false, error: 'Failed to log' })
  }
}
