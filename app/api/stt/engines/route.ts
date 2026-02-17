import { NextRequest, NextResponse } from 'next/server'

// Default STT engine configurations
const defaultEngines = [
  {
    id: 'local-whisper',
    name: 'Local Whisper',
    type: 'local',
    status: 'active',
    config: {
      model: 'medium',
      language: 'zh',
      device: 'cuda',
      computeType: 'float16'
    },
    stats: {
      totalMinutes: 0,
      avgSpeed: 0
    }
  },
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    type: 'cloud',
    status: 'active',
    config: {
      apiKey: process.env.ASSEMBLYAI_API_KEY ? 'configured' : 'missing',
      speechModel: 'best',
      languageCode: 'zh',
      speakerLabels: true
    },
    stats: {
      totalMinutes: 0,
      avgSpeed: 0
    }
  }
]

// In-memory store (would be replaced with database in production)
const engines = [...defaultEngines]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      engines
    })
  } catch (err) {
    console.error('Get engines error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, type, status, config } = body

    if (!id || !name || !type) {
      return new NextResponse('Missing required fields: id, name, type', { status: 400 })
    }

    if (!['local', 'cloud'].includes(type)) {
      return new NextResponse('Invalid type. Must be "local" or "cloud"', { status: 400 })
    }

    // Check if engine already exists
    const existingIndex = engines.findIndex(e => e.id === id)
    if (existingIndex >= 0) {
      return new NextResponse('Engine already exists', { status: 409 })
    }

    const newEngine = {
      id,
      name,
      type,
      status: status || 'inactive',
      config: config || {},
      stats: {
        totalMinutes: 0,
        avgSpeed: 0
      }
    }

    engines.push(newEngine)

    return NextResponse.json({
      success: true,
      engine: newEngine
    })
  } catch (err) {
    console.error('Create engine error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
