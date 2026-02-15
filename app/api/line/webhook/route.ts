import * as crypto from 'crypto'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || ''
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

function verifySignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64')
  return hash === signature
}

async function getUserProfile(userId: string, groupId?: string): Promise<string | null> {
  try {
    const url = groupId
      ? `https://api.line.me/v2/bot/group/${groupId}/member/${userId}`
      : `https://api.line.me/v2/bot/profile/${userId}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    })
    if (res.ok) {
      const data = await res.json()
      return data.displayName || null
    }
  } catch (e) {
    console.error('Failed to get user profile:', e)
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-line-signature') || ''

    if (!verifySignature(body, signature)) {
      console.error('Invalid LINE signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const parsed = JSON.parse(body)
    const events = parsed.events || []

    for (const event of events) {
      // Handle message events from groups
      if (event.type === 'message' && event.source?.type === 'group') {
        const groupId = event.source.groupId
        const userId = event.source.userId
        const userName = userId ? await getUserProfile(userId, groupId) : null

        const { error } = await supabase.from('line_group_messages').insert({
          group_id: groupId,
          message_id: event.message?.id || '',
          user_id: userId || null,
          user_name: userName,
          message_type: event.message?.type || 'unknown',
          text_content: event.message?.text || null,
          timestamp: new Date(event.timestamp).toISOString(),
          raw_event: event,
        })

        if (error) {
          console.error('Supabase insert error:', error)
        }
      }

      // Auto-register group on join event
      if (event.type === 'join' && event.source?.type === 'group') {
        const groupId = event.source.groupId
        await supabase.from('dealer_groups').upsert(
          { group_id: groupId, is_active: true },
          { onConflict: 'group_id' }
        )
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ status: 'ok' }) // Always return 200 to LINE
  }
}

// LINE webhook verification
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
