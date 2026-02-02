import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: '請輸入帳號和密碼' }, { status: 400 })
    }

    // 確保帳號格式正確
    const account = username.includes('@') ? username : `${username}@aurotek.com`
    
    // 用 Zimbra SOAP API 驗證
    const isValid = await verifyZimbraCredentials(account, password)
    
    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        user: { 
          email: account,
          name: account.split('@')[0]
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

async function verifyZimbraCredentials(account: string, password: string): Promise<boolean> {
  const zimbraUrl = 'https://webmail.aurotek.com/service/soap'
  
  // Zimbra SOAP AuthRequest
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
    
    // 檢查是否驗證成功（回應包含 authToken）
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
