import { NextResponse } from 'next/server'

const SHEET_ID = '1tkLPKqFQld2bCythqNY0CX83w4y1cWZJvW6qErE8vek'
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''

export async function GET() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Videos?key=${GOOGLE_API_KEY}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // 快取 5 分鐘
    })
    
    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const rows = data.values || []
    
    if (rows.length <= 1) {
      return NextResponse.json({ videos: [] })
    }
    
    const videos = rows.slice(1).map((row: string[]) => ({
      id: row[0] || '',
      category: row[1] || '',
      subCategory: row[2] || '',
      region: row[3] || '',
      robotType: row[4] || '',
      client: row[5] || '',
      videoUrl: row[6] || '',
      keywords: row[7] || '',
      rating: parseInt(row[8]) || 0,
      title: row[9] || '',
      customThumbnail: row[10] || '',
    }))
    
    return NextResponse.json({ 
      videos,
      count: videos.length,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch videos:', error)
    return NextResponse.json({ 
      videos: [],
      error: 'Failed to fetch videos'
    }, { status: 500 })
  }
}
