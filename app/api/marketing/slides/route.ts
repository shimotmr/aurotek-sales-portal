import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { logActivity, LogActions } from '@/lib/logger'

async function getCurrentUser() {
  const cookieStore = await cookies()
  return cookieStore.get('user_email')?.value || 'unknown'
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .order('category')
    
    if (error) throw error
    
    const slides = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      subCategory: row.sub_category,
      region: row.region,
      client: row.client,
      slideUrl: row.slide_url,
      keywords: row.keywords,
      permittedAdmins: row.permitted_admins,
      customThumbnail: row.custom_thumbnail,
    }))
    
    return NextResponse.json({ slides })
  } catch (error) {
    console.error('Failed to get slides:', error)
    return NextResponse.json({ slides: [], error: '載入失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    const id = body.id || `S${Date.now()}`
    
    const { error } = await supabase
      .from('slides')
      .insert({
        id,
        title: body.title,
        category: body.category,
        sub_category: body.subCategory,
        region: body.region,
        client: body.client,
        slide_url: body.slideUrl,
        keywords: body.keywords,
        permitted_admins: body.permittedAdmins,
        custom_thumbnail: body.customThumbnail,
      })
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.SLIDE_CREATE,
      user,
      details: { id, title: body.title }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create slide:', error)
    return NextResponse.json({ success: false, error: '新增失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    const { error } = await supabase
      .from('slides')
      .update({
        title: body.title,
        category: body.category,
        sub_category: body.subCategory,
        region: body.region,
        client: body.client,
        slide_url: body.slideUrl,
        keywords: body.keywords,
        permitted_admins: body.permittedAdmins,
        custom_thumbnail: body.customThumbnail,
      })
      .eq('id', body.id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.SLIDE_UPDATE,
      user,
      details: { id: body.id, title: body.title }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update slide:', error)
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user = await getCurrentUser()
    
    const { error } = await supabase
      .from('slides')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.SLIDE_DELETE,
      user,
      details: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete slide:', error)
    return NextResponse.json({ success: false, error: '刪除失敗' }, { status: 500 })
  }
}
