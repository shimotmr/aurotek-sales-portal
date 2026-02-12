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
    
    // 同時寫入 audit_logs
    await supabase.from('audit_logs').insert({
      action: data.action,
      user_id: null,
      user_name: data.user,
      ip: data.ip || null,
      details: typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {}),
      page: null,
    }).then(() => {}).catch(() => {})
    
    if (error) {
      console.error('Failed to log activity:', error)
      return false
    }
    
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
  
  // 頁面瀏覽
  PAGE_VIEW: 'page_view',
  CLICK: 'click',
  
  // 業務團隊
  TEAM_VIEW: 'team_view',
  TEAM_CREATE: 'team_create',
  TEAM_UPDATE: 'team_update',
  TEAM_DELETE: 'team_delete',
  
  // 經銷商
  DEALER_VIEW: 'dealer_view',
  DEALER_CREATE: 'dealer_create',
  DEALER_UPDATE: 'dealer_update',
  DEALER_DELETE: 'dealer_delete',
  
  // 目標
  TARGET_VIEW: 'target_view',
  TARGET_CREATE: 'target_create',
  TARGET_UPDATE: 'target_update',
  
  // 影片
  VIDEO_VIEW: 'video_view',
  VIDEO_CREATE: 'video_create',
  VIDEO_UPDATE: 'video_update',
  VIDEO_DELETE: 'video_delete',
  VIDEO_PLAY: 'video_play',
  
  // 簡報
  SLIDE_VIEW: 'slide_view',
  SLIDE_CREATE: 'slide_create',
  SLIDE_UPDATE: 'slide_update',
  SLIDE_DELETE: 'slide_delete',
  SLIDE_OPEN: 'slide_open',
  
  // 管理員
  ADMIN_ADD: 'admin_add',
  ADMIN_REMOVE: 'admin_remove',
  
  // 業績
  PERFORMANCE_VIEW: 'performance_view',
  CASES_VIEW: 'cases_view',
  CASE_FILTER: 'case_filter',
  
  // 同步
  SYNC_UPLOAD: 'sync_upload',
  SYNC_COMPLETE: 'sync_complete',
  
  // 系統
  SYSTEM: 'system',
  ERROR: 'error',
}

// 操作類型中文對照
export const LogActionLabels: Record<string, string> = {
  login: '登入',
  login_failed: '登入失敗',
  logout: '登出',
  page_view: '瀏覽頁面',
  click: '點擊',
  team_view: '查看業務團隊',
  team_create: '新增業務員',
  team_update: '編輯業務員',
  team_delete: '刪除業務員',
  dealer_view: '查看經銷商',
  dealer_create: '新增經銷商',
  dealer_update: '編輯經銷商',
  dealer_delete: '刪除經銷商',
  target_view: '查看目標',
  target_create: '新增目標',
  target_update: '編輯目標',
  video_view: '查看影片',
  video_create: '新增影片',
  video_update: '編輯影片',
  video_delete: '刪除影片',
  video_play: '播放影片',
  slide_view: '查看簡報',
  slide_create: '新增簡報',
  slide_update: '編輯簡報',
  slide_delete: '刪除簡報',
  slide_open: '開啟簡報',
  admin_add: '新增管理員',
  admin_remove: '移除管理員',
  performance_view: '查看業績',
  cases_view: '查看案件',
  case_filter: '篩選案件',
  sync_upload: '上傳同步',
  sync_complete: '同步完成',
  system: '系統',
  error: '錯誤',
}
