import { NextResponse } from 'next/server'
import { getTargets, saveTarget, Target } from '@/lib/db'

// GET - 取得目標設定
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    const targets = await getTargets(year ? parseInt(year) : undefined)
    return NextResponse.json({ success: true, data: targets })
  } catch (error) {
    console.error('Failed to get targets:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

// POST - 新增/更新目標
export async function POST(request: Request) {
  try {
    const target: Target = await request.json()
    
    if (!target.repId || !target.year || !target.month) {
      return NextResponse.json({ success: false, message: '業務員、年、月為必填' }, { status: 400 })
    }
    
    // 自動產生 ID
    if (!target.id) {
      target.id = `T-${target.year}-${target.month}-${target.repId}`
    }
    
    const success = await saveTarget(target)
    
    if (success) {
      return NextResponse.json({ success: true, message: '儲存成功' })
    } else {
      return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to save target:', error)
    return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
  }
}

// PUT - 更新目標
export async function PUT(request: Request) {
  return POST(request) // 使用相同邏輯
}
