import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { logActivity, LogActions } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

async function getCurrentUser() {
  const cookieStore = await cookies()
  return cookieStore.get('user_email')?.value || 'unknown'
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name')
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('Failed to get dealers:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    if (!body.name) {
      return NextResponse.json({ success: false, message: '經銷商名稱為必填' }, { status: 400 })
    }
    
    const id = body.id || `D${Date.now()}`
    
    const { error } = await supabase
      .from('dealers')
      .insert({
        id,
        name: body.name,
        contact: body.contact || '',
        phone: body.phone || '',
        email: body.email || '',
        region: body.region || '北區',
        status: body.status || 'active',
        address: body.address || '',
        notes: body.notes || '',
      })
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.DEALER_CREATE,
      user,
      details: { id, name: body.name }
    })
    
    return NextResponse.json({ success: true, message: '新增成功', data: { id } })
  } catch (error) {
    console.error('Failed to create dealer:', error)
    return NextResponse.json({ success: false, message: '新增失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    if (!body.id) {
      return NextResponse.json({ success: false, message: '缺少經銷商 ID' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('dealers')
      .update({
        name: body.name,
        contact: body.contact || '',
        phone: body.phone || '',
        email: body.email || '',
        region: body.region || '北區',
        status: body.status || 'active',
        address: body.address || '',
        notes: body.notes || '',
      })
      .eq('id', body.id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.DEALER_UPDATE,
      user,
      details: { id: body.id, name: body.name }
    })
    
    return NextResponse.json({ success: true, message: '更新成功' })
  } catch (error) {
    console.error('Failed to update dealer:', error)
    return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user = await getCurrentUser()
    
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少經銷商 ID' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.DEALER_DELETE,
      user,
      details: { id }
    })
    
    return NextResponse.json({ success: true, message: '刪除成功' })
  } catch (error) {
    console.error('Failed to delete dealer:', error)
    return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
  }
}
