import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || ''

interface Segment {
  id: string
  text: string
  edited_text: string | null
}

async function polishBatch(segments: Segment[]): Promise<Map<string, string>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

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
    const match = line.match(/^`?(\d+)\|(.+?)`?$/)
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
  const transcriptId = params.id

  const { data: segments, error: fetchError } = await supabase
    .from('transcript_segments')
    .select('id, text, edited_text')
    .eq('transcript_id', transcriptId)
    .order('start_ms', { ascending: true })

  if (fetchError || !segments || segments.length === 0) {
    return new Response(JSON.stringify({ error: fetchError?.message || 'No segments' }), { 
      status: 500, headers: { 'Content-Type': 'application/json' } 
    })
  }

  // Stream progress back to client
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const BATCH_SIZE = 5
      const totalBatches = Math.ceil(segments.length / BATCH_SIZE)
      let completedBatches = 0
      let polishedTotal = 0

      for (let i = 0; i < segments.length; i += BATCH_SIZE) {
        const batch = segments.slice(i, i + BATCH_SIZE)
        
        try {
          const batchResults = await polishBatch(batch)
          
          // Write results to DB immediately
          for (const [segmentId, polishedText] of batchResults) {
            await supabase
              .from('transcript_segments')
              .update({ edited_text: polishedText })
              .eq('id', segmentId)
          }
          polishedTotal += batchResults.size
        } catch (e: any) {
          if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            // Send wait message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'waiting', message: 'API 限流，等待中...' })}\n\n`))
            await new Promise(r => setTimeout(r, 8000))
            // Retry
            try {
              const batchResults = await polishBatch(batch)
              for (const [segmentId, polishedText] of batchResults) {
                await supabase
                  .from('transcript_segments')
                  .update({ edited_text: polishedText })
                  .eq('id', segmentId)
              }
              polishedTotal += batchResults.size
            } catch { /* skip */ }
          }
        }

        completedBatches++
        const progress = Math.round((completedBatches / totalBatches) * 100)
        
        // Send progress
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'progress', 
          progress, 
          completed: completedBatches, 
          total: totalBatches,
          polished: polishedTotal 
        })}\n\n`))

        // Delay between batches
        if (i + BATCH_SIZE < segments.length) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }

      // Done
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
        type: 'done', 
        processedCount: segments.length, 
        polishedCount: polishedTotal 
      })}\n\n`))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
