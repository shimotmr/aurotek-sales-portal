import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const headerStore = await headers()

    const userName = body.user_name || cookieStore.get('user_name')?.value || cookieStore.get('user_email')?.value || 'unknown'
    const userId = cookieStore.get('user_id')?.value || null
    const ip = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim()
      || headerStore.get('x-real-ip')
      || 'unknown'

    const { error } = await supabase.from('audit_logs').insert({
      action: body.action,
      user_id: userId,
      user_name: userName,
      ip,
      details: body.details || null,
      page: body.page || null,
    })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Audit API error:', e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
