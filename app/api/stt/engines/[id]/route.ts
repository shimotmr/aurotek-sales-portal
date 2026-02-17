import { NextRequest, NextResponse } from 'next/server'

// Default STT engine configurations (mirrored from parent route)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const engine = engines.find(e => e.id === id)

    if (!engine) {
      return new NextResponse('Engine not found', { status: 404 })
    }

    return NextResponse.json({
      success: true,
      engine
    })
  } catch (err) {
    console.error('Get engine error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, status, config } = body

    const engineIndex = engines.findIndex(e => e.id === id)

    if (engineIndex < 0) {
      return new NextResponse('Engine not found', { status: 404 })
    }

    // Update allowed fields
    if (name) engines[engineIndex].name = name
    if (status) {
      if (!['active', 'inactive'].includes(status)) {
        return new NextResponse('Invalid status. Must be "active" or "inactive"', { status: 400 })
      }
      engines[engineIndex].status = status
    }
    if (config) {
      engines[engineIndex].config = { ...engines[engineIndex].config, ...config }
    }

    return NextResponse.json({
      success: true,
      engine: engines[engineIndex]
    })
  } catch (err) {
    console.error('Update engine error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const engineIndex = engines.findIndex(e => e.id === id)

    if (engineIndex < 0) {
      return new NextResponse('Engine not found', { status: 404 })
    }

    // Prevent deletion of default engines
    if (['local-whisper', 'assemblyai'].includes(id)) {
      return new NextResponse('Cannot delete default engines', { status: 403 })
    }

    const deleted = engines.splice(engineIndex, 1)[0]

    return NextResponse.json({
      success: true,
      message: `Engine "${deleted.name}" deleted`,
      engine: deleted
    })
  } catch (err) {
    console.error('Delete engine error:', err)
    return new NextResponse((err as Error).message, { status: 500 })
  }
}
