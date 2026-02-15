import { NextRequest } from 'next/server'

import { supabase } from '@/lib/supabase'

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || ''

interface Segment {
  id: string
  text: string
  edited_text: string | null
}

// Remove spaces between CJK characters (AssemblyAI artifact)
function stripCJKSpaces(text: string): string {
  // Remove spaces between CJK chars, but keep spaces around English/numbers
  return text
    .replace(/([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])\s+([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g, '$1$2')
    .replace(/([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])\s+([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff])/g, '$1$2') // Run twice for overlapping matches
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function polishBatch(segments: Segment[]): Promise<Map<string, string>> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

  // Pre-process: strip CJK spaces first
  const cleaned = segments.map(seg => ({
    ...seg,
    cleanText: stripCJKSpaces(seg.edited_text || seg.text)
  }))

  const prompt = `你是專業的中文逐字稿校對編輯。以下是會議逐字稿，請進行以下修正：

1. 加上正確的標點符號（句號、逗號、問號、頓號等）
2. 修正語句使其通順自然、符合書面中文
3. 保留原意，不改變內容含義
4. 不要翻譯，保持原語言

嚴格按照格式輸出，每行：編號|修正後文字
不要加 markdown 格式、不要加說明文字。

${cleaned.map((seg, idx) => `${idx}|${seg.cleanText}`).join('\n')}`

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
