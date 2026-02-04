import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('category')
    
    if (error) throw error
    
    // 轉換欄位名稱 (snake_case -> camelCase)
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

// POST - 新增影片
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { error } = await supabase
      .from('videos')
      .insert({
        id: body.id || `V${Date.now()}`,
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
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to create video:', error)
    return NextResponse.json({ success: false, error: '新增失敗' }, { status: 500 })
  }
}

// PUT - 更新影片
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
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
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update video:', error)
    return NextResponse.json({ success: false, error: '更新失敗' }, { status: 500 })
  }
}

// DELETE - 刪除影片
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json({ success: false, error: '刪除失敗' }, { status: 500 })
  }
}
