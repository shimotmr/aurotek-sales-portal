import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    
    let query = supabase
      .from('targets')
      .select('*')
      .order('month')
    
    if (year) {
      query = query.eq('year', parseInt(year))
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // 轉換欄位名稱
    const targets = (data || []).map(row => ({
      id: row.id,
      year: row.year,
      month: row.month,
      repId: row.rep_id,
      repName: row.rep_name,
      targetAmount: row.target_amount,
    }))
    
    return NextResponse.json({ success: true, data: targets })
  } catch (error) {
    console.error('Failed to get targets:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (!body.repId || !body.year || !body.month) {
      return NextResponse.json({ success: false, message: '業務員、年、月為必填' }, { status: 400 })
    }
    
    const id = body.id || `T-${body.year}-${body.month}-${body.repId}`
    
    const { error } = await supabase
      .from('targets')
      .upsert({
        id,
        year: body.year,
        month: body.month,
        rep_id: body.repId,
        rep_name: body.repName || '',
        target_amount: body.targetAmount || 0,
      })
    
    if (error) throw error
    
    return NextResponse.json({ success: true, message: '儲存成功' })
  } catch (error) {
    console.error('Failed to save target:', error)
    return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  return POST(request)
}
