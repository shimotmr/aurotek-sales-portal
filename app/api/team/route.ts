import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { logActivity, LogActions } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function getCurrentUser() {
  const cookieStore = await cookies()
  return cookieStore.get('user_email')?.value || 'unknown'
}

// GET - 取得所有業務員
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('team')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    const members = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      englishName: row.english_name,
      email: row.email,
      phone: row.phone,
      region: row.region,
      status: row.status,
    }))
    
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('Failed to get team:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

// POST - 新增業務員
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    if (!body.id || !body.name) {
      return NextResponse.json({ success: false, message: '工號和姓名為必填' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('team')
      .insert({
        id: body.id,
        name: body.name,
        english_name: body.englishName || '',
        email: body.email || '',
        phone: body.phone || '',
        region: body.region || '全區',
        status: body.status || 'active',
      })
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, message: '工號已存在' }, { status: 400 })
      }
      throw error
    }
    
    // 記錄日誌
    await logActivity({
      action: LogActions.TEAM_CREATE,
      user,
      details: { id: body.id, name: body.name }
    })
    
    return NextResponse.json({ success: true, message: '新增成功' })
  } catch (error) {
    console.error('Failed to create team member:', error)
    return NextResponse.json({ success: false, message: '新增失敗' }, { status: 500 })
  }
}

// PUT - 更新業務員
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    if (!body.id) {
      return NextResponse.json({ success: false, message: '缺少工號' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('team')
      .update({
        name: body.name,
        english_name: body.englishName || '',
        email: body.email || '',
        phone: body.phone || '',
        region: body.region || '全區',
        status: body.status || 'active',
      })
      .eq('id', body.id)
    
    if (error) throw error
    
    // 記錄日誌
    await logActivity({
      action: LogActions.TEAM_UPDATE,
      user,
      details: { id: body.id, name: body.name }
    })
    
    return NextResponse.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
  }
}

// DELETE - 刪除業務員
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user = await getCurrentUser()
    
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少工號' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('team')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // 記錄日誌
    await logActivity({
      action: LogActions.TEAM_DELETE,
      user,
      details: { id }
    })
    
    return NextResponse.json({ success: true, message: '刪除成功' })
  } catch (error) {
    console.error('Failed to delete team member:', error)
    return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
  }
}
