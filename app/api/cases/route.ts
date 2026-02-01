import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'data', 'cases.json')
    const fileContents = await fs.readFile(dataPath, 'utf8')
    const data = JSON.parse(fileContents)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json({
      cases: [],
      updatedAt: new Date().toISOString(),
      error: 'Data file not found'
    })
  }
}
