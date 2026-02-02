import { NextResponse } from 'next/server'

const SHEET_ID = '1tkLPKqFQld2bCythqNY0CX83w4y1cWZJvW6qErE8vek'
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || ''

export async function GET() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Presentations?key=${GOOGLE_API_KEY}`
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // 快取 5 分鐘
    })
    
    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const rows = data.values || []
    
    if (rows.length <= 1) {
      return NextResponse.json({ slides: [] })
    }
    
    const slides = rows.slice(1).map((row: string[]) => ({
      id: row[0] || '',
      category: row[1] || '',
      subCategory: row[2] || '',
      region: row[3] || '',
      client: row[4] || '',
      slideUrl: row[5] || '',
      keywords: row[6] || '',
      title: row[7] || '',
      permittedAdmins: row[8] || '',
      customThumbnail: row[9] || '',
    }))
    
    return NextResponse.json({ 
      slides,
      count: slides.length,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch slides:', error)
    return NextResponse.json({ 
      slides: [],
      error: 'Failed to fetch slides'
    }, { status: 500 })
  }
}
