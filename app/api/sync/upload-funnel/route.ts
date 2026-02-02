import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: '未收到檔案' 
      }, { status: 400 })
    }

    // 檢查檔案類型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ 
        success: false, 
        message: '請上傳 Excel 檔案 (.xlsx 或 .xls)' 
      }, { status: 400 })
    }

    // 建立暫存目錄
    const uploadDir = '/tmp/funnel-upload'
    await mkdir(uploadDir, { recursive: true })

    // 儲存檔案
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(uploadDir, file.name)
    await writeFile(filePath, buffer)

    // 執行 Python 腳本處理
    const scriptPath = '/home/ubuntu/clawd/scripts/sync_excel_to_cases.py'
    
    try {
      const { stdout, stderr } = await execAsync(
        `python3 ${scriptPath} "${filePath}"`,
        { timeout: 60000 } // 60 秒超時
      )

      // 解析結果
      const output = stdout + stderr
      
      return NextResponse.json({
        success: true,
        message: '資料更新成功！',
        details: output || '處理完成'
      })
    } catch (execError: any) {
      console.error('Script execution error:', execError)
      return NextResponse.json({
        success: false,
        message: '腳本執行失敗',
        details: execError.stderr || execError.message
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      message: '上傳處理失敗',
      details: error.message
    }, { status: 500 })
  }
}
