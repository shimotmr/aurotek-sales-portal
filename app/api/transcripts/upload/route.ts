import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const transcriptId = formData.get('transcript_id') as string
    const audioUrl = formData.get('audio_url') as string
    const engine = (formData.get('engine') as string) || 'local-whisper'

    // Validate engine
    if (!['local-whisper', 'assemblyai'].includes(engine)) {
      return new NextResponse('Invalid engine. Must be "local-whisper" or "assemblyai"', { status: 400 })
    }

    if (!transcriptId || !audioUrl) {
      return new NextResponse('Missing transcript_id or audio_url', { status: 400 })
    }

    // 1. 從 transcript_dictionary 拉取 boost words
    const { data: dictData } = await supabase
      .from('transcript_dictionary')
      .select('correct_text')
    
    const boostWords = dictData?.map(d => d.correct_text).filter(Boolean) || []

    // 2. 根據 engine 選擇轉錄方式
    let transcriptData: { id: string } | null = null

    if (engine === 'assemblyai') {
      // AssemblyAI 轉錄
      const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          speech_model: 'best',
          language_code: 'zh',
          speaker_labels: true,
          word_boost: boostWords.length > 0 ? boostWords : undefined
        })
      })

      if (!transcriptRes.ok) {
        const error = await transcriptRes.text()
        throw new Error(`AssemblyAI error: ${error}`)
      }

      transcriptData = await transcriptRes.json()
    } else {
      // local-whisper - 這裡標記為 pending，由客戶端處理實際轉錄
      transcriptData = { id: `local-whisper-${transcriptId}` }
    }

    // 3. 取得 engine_id
    const { data: engineData } = await supabase
      .from('stt_engines')
      .select('id')
      .eq('id', engine)
      .single()
    
    const engineId = engineData?.id || engine

    // 4. 更新 transcript 記錄
    const { error: updateErr } = await supabase
      .from('transcripts')
      .update({
        assemblyai_id: engine === 'assemblyai' ? transcriptData?.id : null,
        status: engine === 'assemblyai' ? 'processing' : 'pending',
        engine_id: engineId
      })
      .eq('id', transcriptId)

    if (updateErr) throw updateErr

    return NextResponse.json({ 
      success: true, 
      transcript_id: transcriptId,
      assemblyai_id: engine === 'assemblyai' ? transcriptData?.id : null,
      engine
    })

  } catch (err) {
    console.error('Upload error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
