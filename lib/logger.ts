import { supabase } from './supabase'

export interface LogData {
  action: string
  user: string
  ip?: string
  userAgent?: string
  details?: Record<string, unknown> | string
}

export async function logActivity(data: LogData): Promise<boolean> {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      action: data.action,
      user_email: data.user,
      ip: data.ip || 'unknown',
      user_agent: data.userAgent || '',
      details: typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {})
    }
    
    const { error } = await supabase
      .from('logs')
      .insert(entry)
    
    if (error) {
      console.error('Failed to log activity:', error)
      return false
    }
    
    console.log('[LOG]', data.action, data.user)
    return true
  } catch (error) {
    console.error('Logger error:', error)
    return false
  }
}

// 操作類型常量
export const LogActions = {
  // 認證
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  
  // 業務團隊
  TEAM_CREATE: 'team_create',
  TEAM_UPDATE: 'team_update',
  TEAM_DELETE: 'team_delete',
  
  // 經銷商
  DEALER_CREATE: 'dealer_create',
  DEALER_UPDATE: 'dealer_update',
  DEALER_DELETE: 'dealer_delete',
  
  // 目標
  TARGET_CREATE: 'target_create',
  TARGET_UPDATE: 'target_update',
  
  // 影片
  VIDEO_CREATE: 'video_create',
  VIDEO_UPDATE: 'video_update',
  VIDEO_DELETE: 'video_delete',
  
  // 簡報
  SLIDE_CREATE: 'slide_create',
  SLIDE_UPDATE: 'slide_update',
  SLIDE_DELETE: 'slide_delete',
  
  // 管理員
  ADMIN_ADD: 'admin_add',
  ADMIN_REMOVE: 'admin_remove',
  
  // 系統
  SYSTEM: 'system',
}
