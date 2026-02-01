import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    // 讀取預先產生的靜態資料
    const dataPath = path.join(process.cwd(), 'public', 'data', 'performance.json')
    const fileContents = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    
    // 如果檔案不存在，返回示範資料
    return NextResponse.json({
      summary: {
        totalCases: 0,
        thisMonth: { month: 2, expected: 0, target: 0, gap: 0, rate: 0 },
        activeCases: 0,
      },
      monthlyStats: [],
      repStats: [],
      dealerStats: [],
      stageStats: [],
      updatedAt: new Date().toISOString(),
      error: 'Data file not found. Please run the sync script.'
    })
  }
}
