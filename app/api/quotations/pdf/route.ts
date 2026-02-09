import { NextRequest, NextResponse } from 'next/server'

interface QuotationData {
  quotation: {
    quotation_no: string
    quotation_date: string
    valid_days: number
    customer_name: string
    customer_address?: string
    customer_contact?: string
    customer_phone?: string
    delivery_address?: string
    sales_rep_id?: string
    sales_rep_name: string
    sales_rep_ext?: string
    sales_rep_email?: string
    payment_terms: string
    currency: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total_amount: number
    notes?: string
    created_at: string
  }
  items: {
    aurotek_pn?: string
    item_name: string
    unit: string
    quantity: number
    unit_price: number
    amount: number
  }[]
}

function fmt(n: number): string {
  return new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function formatDate(d: string): string {
  const date = new Date(d)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function generateHTML(data: QuotationData): string {
  const { quotation: q, items } = data
  const createdDate = formatDate(q.created_at)
  const quoteDate = formatDate(q.quotation_date)

  const itemRows = items.map(item => `
    <tr>
      <td class="pn">${item.aurotek_pn || ''}</td>
      <td class="name">${item.item_name}</td>
      <td class="center">${item.unit}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${fmt(item.unit_price)}</td>
      <td class="right">${fmt(item.amount)}</td>
    </tr>
  `).join('')

  // Pad empty rows to fill the table (min 8 rows like ERP)
  const padCount = Math.max(0, 8 - items.length)
  const padRows = Array(padCount).fill('<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>').join('')

  const notesHtml = (q.notes || '').split('\n').map(line => `<div>${line}</div>`).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 15mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif; font-size: 10pt; color: #222; }
  
  .page { width: 100%; max-width: 720px; margin: 0 auto; }
  
  /* Header */
  .header { text-align: center; margin-bottom: 8px; position: relative; }
  .company-name { font-size: 16pt; font-weight: bold; letter-spacing: 2px; }
  .doc-title { font-size: 14pt; font-weight: bold; margin-top: 2px; letter-spacing: 4px; }
  .page-info { position: absolute; right: 0; top: 0; font-size: 8pt; color: #666; text-align: right; line-height: 1.6; }
  
  /* Info section */
  .info-grid { display: flex; justify-content: space-between; margin: 12px 0; font-size: 9.5pt; }
  .info-left, .info-right { width: 48%; }
  .info-row { display: flex; margin-bottom: 3px; }
  .info-label { width: 72px; color: #555; flex-shrink: 0; }
  .info-value { flex: 1; }
  .info-value.bold { font-weight: bold; }
  
  .quote-no { font-size: 11pt; font-weight: bold; }
  
  /* Table */
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th { background: #f0f0f0; border: 1px solid #999; padding: 5px 6px; font-size: 9pt; font-weight: bold; text-align: center; }
  td { border: 1px solid #999; padding: 4px 6px; font-size: 9pt; vertical-align: middle; }
  td.pn { font-family: monospace; font-size: 8.5pt; color: #444; }
  td.name { }
  td.center { text-align: center; }
  td.right { text-align: right; font-family: monospace; }
  
  /* Totals */
  .totals { display: flex; justify-content: flex-end; margin: 4px 0; }
  .totals-box { width: 280px; font-size: 9.5pt; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .total-row.grand { font-weight: bold; font-size: 11pt; border-top: 2px solid #333; padding-top: 4px; margin-top: 4px; }
  .total-label { }
  .total-value { font-family: monospace; }
  
  /* Notes */
  .notes { margin-top: 12px; font-size: 8.5pt; color: #444; line-height: 1.6; }
  .notes-title { font-weight: bold; color: #222; margin-bottom: 2px; }
  
  /* Footer */
  .footer { margin-top: 20px; display: flex; justify-content: space-between; font-size: 9pt; }
  .footer-section { }
  .footer-label { color: #555; }
  
  .signature-area { margin-top: 24px; display: flex; justify-content: space-between; }
  .sig-box { width: 45%; }
  .sig-label { font-size: 9pt; color: #555; border-top: 1px solid #999; padding-top: 4px; text-align: center; }
  
  .doc-id { text-align: right; font-size: 7.5pt; color: #999; margin-top: 12px; }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="page-info">
      <div>頁次: 1/1</div>
      <div>${createdDate}</div>
    </div>
    <div class="company-name">和椿科技股份有限公司</div>
    <div class="doc-title">報 價 單</div>
  </div>

  <!-- Info Grid -->
  <div class="info-grid">
    <div class="info-left">
      <div class="info-row">
        <span class="info-label">報價單號:</span>
        <span class="info-value quote-no">${q.quotation_no}</span>
      </div>
      <div class="info-row">
        <span class="info-label">客戶資料:</span>
        <span class="info-value bold">${q.customer_name}</span>
      </div>
      ${q.customer_address ? `<div class="info-row"><span class="info-label"></span><span class="info-value">${q.customer_address}</span></div>` : ''}
      ${q.delivery_address ? `<div class="info-row"><span class="info-label">交貨地點:</span><span class="info-value">${q.delivery_address}</span></div>` : ''}
      <div class="info-row">
        <span class="info-label">交易條件:</span>
        <span class="info-value">${q.payment_terms}</span>
      </div>
    </div>
    <div class="info-right">
      <div class="info-row">
        <span class="info-label">報價日期:</span>
        <span class="info-value">${quoteDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">客戶單號:</span>
        <span class="info-value">${q.customer_contact ? q.customer_contact : '新客戶'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">業務代表:</span>
        <span class="info-value">${q.sales_rep_name}${q.sales_rep_ext ? ` 分機(${q.sales_rep_ext})` : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">公司電話:</span>
        <span class="info-value">886-2-8752-3311</span>
      </div>
      ${q.sales_rep_email ? `<div class="info-row"><span class="info-label"></span><span class="info-value">${q.sales_rep_email}</span></div>` : ''}
      <div class="info-row">
        <span class="info-label">公司傳真:</span>
        <span class="info-value">886-2-8752-3065</span>
      </div>
      <div class="info-row">
        <span class="info-label">公司地址:</span>
        <span class="info-value">114台北市內湖區洲子街60號2樓</span>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table>
    <thead>
      <tr>
        <th style="width:15%">料號</th>
        <th style="width:35%">品名/規格</th>
        <th style="width:8%">單位</th>
        <th style="width:8%">數量</th>
        <th style="width:17%">單價</th>
        <th style="width:17%">總價</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${padRows}
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <div class="total-row">
        <span class="total-label">銷售金額(未稅):</span>
        <span class="total-value">${fmt(q.subtotal)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">營業稅 (${q.tax_rate}%):</span>
        <span class="total-value">${fmt(q.tax_amount)}</span>
      </div>
      <div class="total-row grand">
        <span class="total-label">銷售金額 合計:</span>
        <span class="total-value">${q.currency} ${fmt(q.total_amount)}</span>
      </div>
    </div>
  </div>

  <!-- Notes -->
  <div class="notes">
    <div class="notes-title">備註:</div>
    ${notesHtml}
  </div>

  <!-- Signature -->
  <div class="signature-area">
    <div class="sig-box">
      <div style="height:48px"></div>
      <div class="sig-label">訂購人:</div>
    </div>
    <div class="sig-box">
      <div style="height:48px"></div>
      <div class="sig-label">貴公司簽章:</div>
    </div>
  </div>

  <div class="doc-id">QS4-01-000-01 V1.1</div>
</div>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const data: QuotationData = await request.json()
    const html = generateHTML(data)

    // Return HTML for client-side printing (window.print)
    // Browser's print-to-PDF gives the best result with Chinese fonts
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
