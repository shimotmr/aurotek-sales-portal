import { NextResponse } from 'next/server'
import { getDealers, saveDealer, deleteDealer, Dealer } from '@/lib/db'

// GET - 取得所有經銷商
export async function GET() {
  try {
    const dealers = await getDealers()
    return NextResponse.json({ success: true, data: dealers })
  } catch (error) {
    console.error('Failed to get dealers:', error)
    return NextResponse.json({ success: false, message: '載入失敗' }, { status: 500 })
  }
}

// POST - 新增經銷商
export async function POST(request: Request) {
  try {
    const dealer: Dealer = await request.json()
    
    if (!dealer.name) {
      return NextResponse.json({ success: false, message: '經銷商名稱為必填' }, { status: 400 })
    }
    
    // 自動產生 ID
    if (!dealer.id) {
      dealer.id = `D${Date.now()}`
    }
    
    const success = await saveDealer(dealer)
    
    if (success) {
      return NextResponse.json({ success: true, message: '儲存成功', data: dealer })
    } else {
      return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to save dealer:', error)
    return NextResponse.json({ success: false, message: '儲存失敗' }, { status: 500 })
  }
}

// PUT - 更新經銷商
export async function PUT(request: Request) {
  try {
    const dealer: Dealer = await request.json()
    
    if (!dealer.id) {
      return NextResponse.json({ success: false, message: '缺少經銷商 ID' }, { status: 400 })
    }
    
    const success = await saveDealer(dealer)
    
    if (success) {
      return NextResponse.json({ success: true, message: '更新成功' })
    } else {
      return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to update dealer:', error)
    return NextResponse.json({ success: false, message: '更新失敗' }, { status: 500 })
  }
}

// DELETE - 刪除經銷商
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ success: false, message: '缺少經銷商 ID' }, { status: 400 })
    }
    
    const success = await deleteDealer(id)
    
    if (success) {
      return NextResponse.json({ success: true, message: '刪除成功' })
    } else {
      return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
    }
  } catch (error) {
    console.error('Failed to delete dealer:', error)
    return NextResponse.json({ success: false, message: '刪除失敗' }, { status: 500 })
  }
}
