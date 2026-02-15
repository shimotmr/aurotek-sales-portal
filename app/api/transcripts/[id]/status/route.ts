import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. 取得 transcript
    const { data: transcript, error: fetchErr } = await supabase
      .from('transcripts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !transcript) {
      return new NextResponse('Transcript not found', { status: 404 })
    }

    if (!transcript.assemblyai_id) {
      return NextResponse.json({ status: transcript.status })
    }

    // 2. 查詢 AssemblyAI 狀態
    const statusRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcript.assemblyai_id}`, {
      headers: {
        'Authorization': ASSEMBLYAI_API_KEY
      }
    })

    if (!statusRes.ok) {
      throw new Error('Failed to fetch AssemblyAI status')
    }

    const statusData = await statusRes.json()

    // 3. 如果完成，解析並寫入 segments
    if (statusData.status === 'completed' && transcript.status !== 'ready') {
      const utterances = statusData.utterances || []
      
      // 建立 speakers 對應表
      const speakers: Record<string, string> = {}
      utterances.forEach((u: any) => {
        if (u.speaker && !speakers[u.speaker]) {
          speakers[u.speaker] = u.speaker
        }
      })

      // 寫入 segments
      const segments = utterances.map((u: any) => ({
        transcript_id: id,
        speaker: u.speaker || 'Unknown',
        text: u.text,
        start_ms: u.start,
        end_ms: u.end,
        confidence: u.confidence || null,
        is_reviewed: false
      }))

      if (segments.length > 0) {
        await supabase.from('transcript_segments').insert(segments)
      }

      // 更新 transcript
      await supabase
        .from('transcripts')
        .update({
          status: 'ready',
          duration_seconds: Math.floor(statusData.audio_duration || 0),
          speakers: speakers
        })
        .eq('id', id)

      return NextResponse.json({ status: 'ready', segments_count: segments.length })
    }

    // 4. 如果錯誤
    if (statusData.status === 'error') {
      await supabase
        .from('transcripts')
        .update({ status: 'error' })
        .eq('id', id)

      return NextResponse.json({ status: 'error', error: statusData.error })
    }

    // 5. 仍在處理中
    return NextResponse.json({ status: statusData.status })

  } catch (err) {
    console.error('Status check error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
