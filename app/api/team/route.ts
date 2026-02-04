import { NextResponse } from 'next/server'
import { getTeamMembers, saveTeamMember, deleteTeamMember, TeamMember } from '@/lib/db'

// GET - 取得所有業務員
export async function GET() {
  try {
    const members = await getTeamMembers()
    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    console.error('Failed to get team:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

// POST - 新增業務員
export async function POST(request: Request) {
  try {
    const member: TeamMember = await request.json()
    
    if (!member.id || !member.name) {
      return NextResponse.json({ success: false, message: '工號和姓名為必填' }, { status: 400 })
    }
    
    const success = await saveTeamMember(member)
    
    if (success) {
      return NextResponse.json({ success: true, message: '儲存成功' })
    } else {
      return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to save team member:', error)
    return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
  }
}

// PUT - 更新業務員
export async function PUT(request: Request) {
  try {
    const member: TeamMember = await request.json()
    
    if (!member.id) {
      return NextResponse.json({ success: false, message: '缺少工號' }, { status: 400 })
    }
    
    const success = await saveTeamMember(member)
    
    if (success) {
      return NextResponse.json({ success: true, message: '更新成功' })
    } else {
      return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
  }
}

// DELETE - 刪除業務員
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少工號' }, { status: 400 })
    }
    
    const success = await deleteTeamMember(id)
    
    if (success) {
      return NextResponse.json({ success: true, message: '刪除成功' })
    } else {
      return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to delete team member:', error)
    return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
  }
}
