import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// Sheet 名稱對應階段
const SHEET_TO_STAGE: Record<string, string> = {
  '進行中': '進行中',
  '待出貨（取得訂單）': '待出貨',
  '已出貨（量產出貨）': '已出貨',
  '失敗案件': '失敗'
}

function parseNumber(val: any): number {
  if (!val) return 0
  try {
    const s = String(val).replace(/,/g, '').replace('TWD', '').trim()
    return parseFloat(s) || 0
  } catch {
    return 0
  }
}

function parseDate(val: any): string | null {
  if (!val) return null
  try {
    if (val instanceof Date) {
      return val.toISOString().split('T')[0]
    }
    // Excel 日期是數字，需要轉換
    if (typeof val === 'number') {
      const date = XLSX.SSF.parse_date_code(val)
      if (date) {
        const y = date.y
        const m = String(date.m).padStart(2, '0')
        const d = String(date.d).padStart(2, '0')
        return `${y}-${m}-${d}`
      }
    }
    return String(val).split(' ')[0]
  } catch {
    return null
  }
}

function normalizeHeader(h: any): string {
  if (!h) return ''
  return String(h).replace(/\n/g, '').replace(/ /g, '').trim()
}

interface Case {
  id: string
  stage: string
  orderId?: string
  rep: string
  dealer: string
  endCustomer?: string
  machine?: string
  probability: number
  quantity: number
  amount: number
  expected: number
  orderDate?: string | null
  shipDate?: string | null
  category?: string
  brand?: string
  failReason?: string
}

function readExcelCases(buffer: Buffer): Case[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const allCases: Case[] = []
  
  for (const sheetName of wb.SheetNames) {
    if (!(sheetName in SHEET_TO_STAGE)) continue
    
    const stage = SHEET_TO_STAGE[sheetName]
    const sheet = wb.Sheets[sheetName]
    
    // 轉成 JSON，跳過前兩行（標題行在第3行）
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })
    
    if (data.length < 4) continue
    
    // 第3行是表頭（index 2）
    const headers = (data[2] as any[]).map(h => normalizeHeader(h))
    
    // 建立欄位索引
    const idx: Record<string, number> = {}
    headers.forEach((h, i) => {
      if (h) idx[h] = i
    })
    
    const getVal = (row: any[], colName: string, defaultVal: any = '') => {
      const i = idx[colName]
      if (i !== undefined && i < row.length) {
        return row[i] !== undefined && row[i] !== null ? row[i] : defaultVal
      }
      return defaultVal
    }
    
    // 從第4行開始讀取資料（index 3）
    for (let rowNum = 3; rowNum < data.length; rowNum++) {
      const row = data[rowNum] as any[]
      if (!row || row.length === 0) continue
      
      const caseId = row[0]
      if (!caseId || !String(caseId).startsWith('ASX')) continue
      
      const caseData: Case = {
        id: String(caseId),
        stage,
        rep: '',
        dealer: '',
        probability: 0,
        quantity: 0,
        amount: 0,
        expected: 0
      }
      
      if (sheetName === '進行中') {
        caseData.orderId = ''
        caseData.rep = getVal(row, '業務', '')
        caseData.dealer = getVal(row, '客戶名稱', '')
        caseData.endCustomer = getVal(row, '終端客戶', '')
        caseData.machine = getVal(row, '機台名稱', '')
        caseData.probability = Math.round(parseNumber(getVal(row, 'Probabilty', 0)))
        caseData.quantity = Math.round(parseNumber(getVal(row, '預估數量', 0)))
        caseData.amount = parseNumber(getVal(row, '預估銷售額(本幣仟元)', 0))
        caseData.expected = parseNumber(getVal(row, '期望值金額(本幣仟元)', 0))
        caseData.orderDate = parseDate(getVal(row, '預估取得訂單日'))
        caseData.shipDate = parseDate(getVal(row, '預估出貨日'))
        caseData.category = getVal(row, '產品類別', '')
        caseData.brand = getVal(row, '產品品牌', '')
      } else if (sheetName === '待出貨（取得訂單）') {
        caseData.orderId = getVal(row, '訂單號碼', '')
        caseData.rep = getVal(row, '業務', '')
        caseData.dealer = getVal(row, '客戶名稱', '')
        caseData.endCustomer = ''
        caseData.machine = getVal(row, '機台名稱', '')
        caseData.probability = 100
        caseData.quantity = Math.round(parseNumber(getVal(row, '預估數量', 0)))
        caseData.amount = parseNumber(getVal(row, '預估銷售額(本幣仟元)', 0))
        caseData.expected = caseData.amount
        caseData.orderDate = null
        caseData.shipDate = parseDate(getVal(row, '預估出貨日'))
        caseData.category = ''
        caseData.brand = ''
      } else if (sheetName === '已出貨（量產出貨）') {
        caseData.orderId = getVal(row, '訂單號碼', '')
        caseData.rep = getVal(row, '業務', '')
        caseData.dealer = getVal(row, '客戶名稱', '')
        caseData.endCustomer = ''
        caseData.machine = getVal(row, '機台名稱', '')
        caseData.probability = 100
        caseData.quantity = Math.round(parseNumber(getVal(row, '實際數量', 0)))
        caseData.amount = parseNumber(getVal(row, '實際銷售額(本幣仟元)', 0))
        caseData.expected = caseData.amount
        caseData.orderDate = null
        caseData.shipDate = parseDate(getVal(row, '實際出貨日'))
        caseData.category = ''
        caseData.brand = ''
      } else if (sheetName === '失敗案件') {
        caseData.orderId = getVal(row, '結案單號', '')
        caseData.rep = getVal(row, '業務', '')
        caseData.dealer = getVal(row, '客戶名稱', '')
        caseData.endCustomer = getVal(row, '終端客戶', '')
        caseData.machine = getVal(row, '機台名稱', '')
        caseData.probability = 0
        caseData.quantity = 0
        caseData.amount = 0
        caseData.expected = 0
        caseData.orderDate = null
        caseData.shipDate = null
        caseData.failReason = getVal(row, '失敗原因', '')
        caseData.category = getVal(row, '產品類別', '')
        caseData.brand = ''
      }
      
      allCases.push(caseData)
    }
  }
  
  return allCases
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: '未收到檔案' 
      }, { status: 400 })
    }

    // 檢查檔案類型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ 
        success: false, 
        message: '請上傳 Excel 檔案 (.xlsx 或 .xls)' 
      }, { status: 400 })
    }

    // 讀取檔案
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 解析 Excel
    const cases = readExcelCases(buffer)
    
    // 統計
    const stageCounts: Record<string, number> = {}
    cases.forEach(c => {
      stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1
    })
    
    // 建立輸出
    const output = {
      cases,
      updatedAt: new Date().toISOString()
    }
    
    // 寫入檔案
    const outputPath = path.join(process.cwd(), 'public', 'data', 'cases.json')
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8')
    
    // 建立結果摘要
    const summary = Object.entries(stageCounts)
      .map(([stage, count]) => `${stage}: ${count} 筆`)
      .join('\n')
    
    return NextResponse.json({
      success: true,
      message: `資料更新成功！共 ${cases.length} 筆案件`,
      details: `📊 案件統計：\n${summary}\n\n✅ 已更新 cases.json`
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      message: '處理失敗',
      details: error.message
    }, { status: 500 })
  }
}
