import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { search, replace, addToDict } = await req.json()
    const transcriptId = params.id

    if (!search) {
      return NextResponse.json({ error: '搜尋字串不能為空' }, { status: 400 })
    }

    // 取得所有 segments
    const { data: segments, error: fetchError } = await supabase
      .from('transcript_segments')
      .select('*')
      .eq('transcript_id', transcriptId)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!segments || segments.length === 0) {
      return NextResponse.json({ replacedCount: 0 })
    }

    // 批量取代
    let replacedCount = 0
    const updates = []

    for (const seg of segments) {
      const originalText = seg.edited_text || seg.text
      const newText = originalText.replace(new RegExp(search, 'g'), replace)
      
      if (newText !== originalText) {
        updates.push({
          id: seg.id,
          edited_text: newText
        })
        replacedCount++
      }
    }

    // 批量更新
    if (updates.length > 0) {
      for (const update of updates) {
        await supabase
          .from('transcript_segments')
          .update({ edited_text: update.edited_text })
          .eq('id', update.id)
      }
    }

    // 加入辭典
    if (addToDict && replace) {
      await supabase
        .from('transcript_dictionary')
        .upsert(
          { wrong_text: search, correct_text: replace },
          { onConflict: 'wrong_text', ignoreDuplicates: true }
        )
    }

    return NextResponse.json({ 
      replacedCount,
      addedToDict: addToDict && replace ? true : false
    })
  } catch (error) {
    console.error('Replace error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
