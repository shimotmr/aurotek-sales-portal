import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 管理員名單（之後可以從 Google Sheets 讀取）
const ADMINS = [
  'williamhsiao@aurotek.com',
  'williamhsiao',
]

// 超級管理員
const SUPER_ADMINS = [
  'williamhsiao@aurotek.com',
  'williamhsiao',
]

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '請輸入帳號和密碼' }, { status: 400 })
    }

    // 確保帳號格式正確
    const account = username.includes('@') ? username : `${username}@aurotek.com`
    const accountName = account.split('@')[0]
    
    // 用 Zimbra SOAP API 驗證
    const isValid = await verifyZimbraCredentials(account, password)
    
    if (isValid) {
      // 檢查是否為管理員
      const isAdmin = ADMINS.includes(account) || ADMINS.includes(accountName)
      const isSuperAdmin = SUPER_ADMINS.includes(account) || SUPER_ADMINS.includes(accountName)
      
      // 生成 session token
      const token = generateToken()
      const user = {
        email: account,
        name: accountName,
        isAdmin,
        isSuperAdmin,
        loginTime: new Date().toISOString()
      }
      
      // 記錄登入 log
      await logActivity({
        action: 'login',
        user: account,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { isAdmin, isSuperAdmin }
      })
      
      // 設置 cookies
      const cookieStore = await cookies()
      const maxAge = 60 * 60 * 24 * 7 // 7 天
      
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      })
      
      cookieStore.set('user_email', account, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      })
      
      cookieStore.set('user_name', accountName, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      })
      
      cookieStore.set('is_admin', isAdmin ? 'true' : 'false', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      })
      
      cookieStore.set('is_super_admin', isSuperAdmin ? 'true' : 'false', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge
      })
      
      return NextResponse.json({ 
        success: true, 
        user
      })
    } else {
      // 記錄失敗登入
      await logActivity({
        action: 'login_failed',
        user: account,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        details: { reason: 'invalid_credentials' }
      })
      
      return NextResponse.json({ success: false, message: '帳號或密碼錯誤' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ success: false, message: '驗證失敗，請稍後再試' }, { status: 500 })
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

async function verifyZimbraCredentials(account: string, password: string): Promise<boolean> {
  const zimbraUrl = 'https://webmail.aurotek.com/service/soap'
  
  const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <AuthRequest xmlns="urn:zimbraAccount">
      <account by="name">${escapeXml(account)}</account>
      <password>${escapeXml(password)}</password>
    </AuthRequest>
  </soap:Body>
</soap:Envelope>`

  try {
    const response = await fetch(zimbraUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/soap+xml; charset=utf-8',
      },
      body: soapRequest,
    })

    const responseText = await response.text()
    
    if (responseText.includes('authToken') && !responseText.includes('AUTH_FAILED')) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('Zimbra SOAP error:', error)
    return false
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Log 記錄函數 - 寫入 Google Sheets
async function logActivity(log: {
  action: string
  user: string
  timestamp: string
  ip: string
  userAgent: string
  details: Record<string, unknown>
}) {
  try {
    // 這裡可以寫入 Google Sheets
    // 暫時先用 console.log
    console.log('[ACTIVITY LOG]', JSON.stringify(log))
    
    // TODO: 實作 Google Sheets 寫入
    // const SHEET_ID = 'xxx'
    // await appendToSheet(SHEET_ID, 'Logs', [[log.timestamp, log.action, log.user, log.ip, JSON.stringify(log.details)]])
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}
