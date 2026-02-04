// 管理員資料結構
export interface Admin {
  email: string
  name: string
  role: 'admin' | 'super_admin'
  addedAt: string
  addedBy: string
}

// 預設管理員
const DEFAULT_ADMINS: Admin[] = [
  { 
    email: 'williamhsiao@aurotek.com', 
    name: 'williamhsiao', 
    role: 'super_admin', 
    addedAt: '2026-02-01', 
    addedBy: 'system' 
  }
]

// 從環境變數讀取額外管理員
// 格式: EXTRA_ADMINS=email1:role1,email2:role2
function getExtraAdmins(): Admin[] {
  const extraAdminsStr = process.env.EXTRA_ADMINS || ''
  if (!extraAdminsStr) return []
  
  return extraAdminsStr.split(',').map(item => {
    const [email, role] = item.split(':')
    if (!email) return null
    return {
      email: email.includes('@') ? email : `${email}@aurotek.com`,
      name: email.split('@')[0],
      role: (role === 'super_admin' ? 'super_admin' : 'admin') as 'admin' | 'super_admin',
      addedAt: '2026-02-01',
      addedBy: 'env'
    }
  }).filter((a): a is Admin => a !== null)
}

// 全局管理員列表（在 serverless 環境中每個實例獨立）
let adminList: Admin[] = [...DEFAULT_ADMINS, ...getExtraAdmins()]

// 取得所有管理員
export function getAdminList(): Admin[] {
  return [...adminList]
}

// 新增管理員
export function addAdmin(admin: Admin): boolean {
  if (adminList.some(a => a.email === admin.email)) {
    return false
  }
  adminList.push(admin)
  return true
}

// 移除管理員
export function removeAdmin(email: string): boolean {
  if (email === 'williamhsiao@aurotek.com') {
    return false
  }
  const before = adminList.length
  adminList = adminList.filter(a => a.email !== email)
  return adminList.length < before
}

// 檢查是否為管理員
export function isAdmin(email: string): boolean {
  const normalized = email.includes('@') ? email : `${email}@aurotek.com`
  const name = normalized.split('@')[0]
  return adminList.some(a => a.email === normalized || a.name === name)
}

// 檢查是否為超級管理員
export function isSuperAdmin(email: string): boolean {
  const normalized = email.includes('@') ? email : `${email}@aurotek.com`
  const name = normalized.split('@')[0]
  const admin = adminList.find(a => a.email === normalized || a.name === name)
  return admin?.role === 'super_admin'
}
