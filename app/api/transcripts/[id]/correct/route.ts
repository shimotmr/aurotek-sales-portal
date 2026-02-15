import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. 從 transcript_dictionary 拉取辭典
    const { data: dictData } = await supabase
      .from('transcript_dictionary')
      .select('wrong_text, correct_text')
    
    if (!dictData || dictData.length === 0) {
      return NextResponse.json({ success: true, corrected: 0 })
    }

    // 2. 拉取所有 segments
    const { data: segments } = await supabase
      .from('transcript_segments')
      .select('id, text, edited_text')
      .eq('transcript_id', id)

    if (!segments || segments.length === 0) {
      return NextResponse.json({ success: true, corrected: 0 })
    }

    // 3. 對每個 segment 做文字替換
    let correctedCount = 0
    for (const seg of segments) {
      let text = seg.edited_text || seg.text
      let hasChange = false

      for (const dict of dictData) {
        if (text.includes(dict.wrong_text)) {
          text = text.replaceAll(dict.wrong_text, dict.correct_text)
          hasChange = true
        }
      }

      if (hasChange) {
        await supabase
          .from('transcript_segments')
          .update({ edited_text: text })
          .eq('id', seg.id)
        correctedCount++
      }
    }

    return NextResponse.json({ success: true, corrected: correctedCount })

  } catch (err) {
    console.error('Correct error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
