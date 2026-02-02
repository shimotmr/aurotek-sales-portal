import { NextResponse } from 'next/server'
import Imap from 'imap'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '請輸入帳號和密碼' }, { status: 400 })
    }

    // 確保是 @aurotek.com 或 @aurotek.co 的帳號
    const email = username.includes('@') ? username : `${username}@aurotek.com`
    
    // 用 IMAP 驗證 Zimbra 帳號
    const isValid = await verifyZimbraCredentials(email, password)
    
    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        user: { 
          email,
          name: email.split('@')[0]
        }
      })
    } else {
      return NextResponse.json({ success: false, message: '帳號或密碼錯誤' }, { status: 401 })
    }
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ success: false, message: '驗證失敗，請稍後再試' }, { status: 500 })
  }
}

function verifyZimbraCredentials(email: string, password: string): Promise<boolean> {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: email,
      password: password,
      host: 'mail.aurotek.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 10000,
      authTimeout: 10000
    })

    imap.once('ready', () => {
      imap.end()
      resolve(true)
    })

    imap.once('error', (err: Error) => {
      console.log('IMAP auth failed:', err.message)
      resolve(false)
    })

    imap.connect()
  })
}
