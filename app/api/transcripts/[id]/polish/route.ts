import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || ''

interface Segment {
  id: string
  text: string
  edited_text: string | null
}

async function polishBatch(segments: Segment[]): Promise<Map<string, string>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

  const prompt = `你是逐字稿校對專家。請修正以下中文逐字稿：
1) 去除多餘空格
2) 加上正確標點符號
3) 修正語句使其通順自然
4) 保留原意不改變內容

每行格式：\`編號|修正後文字\`。只輸出修正後的內容，不要加其他說明。

${segments.map((seg, idx) => `${idx}|${seg.edited_text || seg.text}`).join('\n')}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  const resultMap = new Map<string, string>()
  const lines = resultText.split('\n').filter((line: string) => line.trim())
  
  for (const line of lines) {
    const match = line.match(/^(\d+)\|(.+)$/)
    if (match) {
      const idx = parseInt(match[1])
      const polishedText = match[2].trim()
      if (segments[idx]) {
        resultMap.set(segments[idx].id, polishedText)
      }
    }
  }

  return resultMap
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transcriptId = params.id

    const { data: segments, error: fetchError } = await supabase
      .from('transcript_segments')
      .select('id, text, edited_text')
      .eq('transcript_id', transcriptId)
      .order('start_ms', { ascending: true })

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!segments || segments.length === 0) {
      return NextResponse.json({ processedCount: 0 })
    }

    const BATCH_SIZE = 10
    let processedCount = 0
    const allResults = new Map<string, string>()

    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      const batch = segments.slice(i, i + BATCH_SIZE)
      const batchResults = await polishBatch(batch)
      
      for (const [id, text] of batchResults) {
        allResults.set(id, text)
      }
      processedCount += batch.length
    }

    for (const [segmentId, polishedText] of allResults) {
      await supabase
        .from('transcript_segments')
        .update({ edited_text: polishedText })
        .eq('id', segmentId)
    }

    return NextResponse.json({ 
      processedCount,
      polishedCount: allResults.size
    })
  } catch (error) {
    console.error('Polish error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
