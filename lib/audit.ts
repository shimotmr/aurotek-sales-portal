import { supabase } from './supabase'

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * 前端直接寫入 audit_logs（不記錄 IP）
 */
export async function logAction(action: string, details?: string, page?: string) {
  try {
    const userName = getCookie('user_name') || getCookie('user_email') || 'unknown'
    const userId = getCookie('user_id') || ''

    await supabase.from('audit_logs').insert({
      action,
      user_id: userId || null,
      user_name: userName,
      details: details || null,
      page: page || (typeof window !== 'undefined' ? window.location.pathname : null),
    })
  } catch (e) {
    console.error('audit logAction failed:', e)
  }
}

/**
 * 透過 API 記錄（會記錄 IP，用於登入等場景）
 */
export async function logActionWithIP(action: string, details?: string, page?: string, userName?: string) {
  try {
    await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, details, page, user_name: userName }),
    })
  } catch (e) {
    console.error('audit API failed:', e)
  }
}
