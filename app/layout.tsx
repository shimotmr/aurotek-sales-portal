import './globals.css'
import type { Metadata } from 'next'

import LayoutWrapper from './components/LayoutWrapper'
import { TrackingProvider } from './components/TrackingProvider'

export const metadata: Metadata = {
  title: '和椿通路營業管理系統',
  description: '樣品借用、報價單、庫存查詢',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body>
        <TrackingProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </TrackingProvider>
      </body>
    </html>
  )
}
