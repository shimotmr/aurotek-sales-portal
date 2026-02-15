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
      .from('videos')
      .select('*')
      .order('category')
    
    if (error) throw error
    
    const videos = (data || []).map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      subCategory: row.sub_category,
      region: row.region,
      robotType: row.robot_type,
      client: row.client,
      videoUrl: row.video_url,
      keywords: row.keywords,
      rating: row.rating || 0,
      customThumbnail: row.custom_thumbnail,
    }))
    
    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Failed to get videos:', error)
    return NextResponse.json({ videos: [], error: '載入失敗' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    const id = body.id || `V${Date.now()}`
    
    const { error } = await supabase
      .from('videos')
      .insert({
        id,
        title: body.title,
        category: body.category,
        sub_category: body.subCategory,
        region: body.region,
        robot_type: body.robotType,
        client: body.client,
        video_url: body.videoUrl,
        keywords: body.keywords,
        rating: body.rating || 0,
        custom_thumbnail: body.customThumbnail,
      })
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.VIDEO_CREATE,
      user,
      details: { id, title: body.title }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create video:', error)
    return NextResponse.json({ success: false, error: '新增失敗' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const user = await getCurrentUser()
    
    const { error } = await supabase
      .from('videos')
      .update({
        title: body.title,
        category: body.category,
        sub_category: body.subCategory,
        region: body.region,
        robot_type: body.robotType,
        client: body.client,
        video_url: body.videoUrl,
        keywords: body.keywords,
        rating: body.rating || 0,
        custom_thumbnail: body.customThumbnail,
      })
      .eq('id', body.id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.VIDEO_UPDATE,
      user,
      details: { id: body.id, title: body.title }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update video:', error)
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const user = await getCurrentUser()
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    await logActivity({
      action: LogActions.VIDEO_DELETE,
      user,
      details: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json({ success: false, error: '刪除失敗' }, { status: 500 })
  }
}
