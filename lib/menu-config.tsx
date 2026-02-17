// 統一的選單配置檔案
import React from 'react'

// 共用的 SVG Icon 元件
export const icons = {
  // Portal 首頁圖示
  pipeline: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="4" y="28" width="6" height="8" rx="1" fill="#93C5FD"/>
      <rect x="13" y="20" width="6" height="16" rx="1" fill="#60A5FA"/>
      <rect x="22" y="14" width="6" height="22" rx="1" fill="#3B82F6"/>
      <rect x="31" y="6" width="6" height="30" rx="1" fill="#1D4ED8"/>
      <path d="M7 26L16 18L25 12L34 5" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3"/>
    </svg>
  ),
  product: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="6" y="8" width="28" height="24" rx="3" stroke="#059669" strokeWidth="2"/>
      <circle cx="20" cy="18" r="5" stroke="#059669" strokeWidth="2"/>
      <line x1="14" y1="27" x2="26" y2="27" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 8V5a5 5 0 0110 0v3" stroke="#10B981" strokeWidth="2"/>
    </svg>
  ),
  quotation: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="8" y="4" width="24" height="32" rx="2" stroke="#EA580C" strokeWidth="2"/>
      <line x1="13" y1="12" x2="27" y2="12" stroke="#FB923C" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="18" x2="24" y2="18" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="22" x2="22" y2="22" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="13" y1="26" x2="20" y2="26" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 30l2 2 4-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  transcript: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <circle cx="20" cy="14" r="6" stroke="#4F46E5" strokeWidth="2"/>
      <path d="M20 20v6" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 26a6 6 0 0012 0" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="34" x2="14" y2="34" stroke="#818CF8" strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="34" x2="26" y2="34" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="29" y1="34" x2="33" y2="34" stroke="#C7D2FE" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  agent: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="10" y="8" width="20" height="16" rx="4" stroke="#0891B2" strokeWidth="2"/>
      <circle cx="16" cy="16" r="2" fill="#06B6D4"/>
      <circle cx="24" cy="16" r="2" fill="#06B6D4"/>
      <path d="M15 28h10" stroke="#0891B2" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 24v4" stroke="#0891B2" strokeWidth="1.5"/>
      <path d="M22 24v4" stroke="#0891B2" strokeWidth="1.5"/>
      <path d="M6 12h4M30 12h4" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="5" r="2" stroke="#0891B2" strokeWidth="1.5"/>
      <line x1="20" y1="7" x2="20" y2="8" stroke="#0891B2" strokeWidth="1.5"/>
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <circle cx="20" cy="20" r="7" stroke="#6B7280" strokeWidth="2"/>
      <circle cx="20" cy="20" r="2.5" fill="#9CA3AF"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 20 + 9 * Math.cos(rad)
        const y1 = 20 + 9 * Math.sin(rad)
        const x2 = 20 + 12 * Math.cos(rad)
        const y2 = 20 + 12 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round"/>
      })}
    </svg>
  ),
  marketing: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="6" y="10" width="18" height="20" rx="2" stroke="#7C3AED" strokeWidth="2"/>
      <circle cx="15" cy="18" r="3" stroke="#7C3AED" strokeWidth="1.5"/>
      <path d="M8 26l4-3 3 2 5-5" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="20" y="6" width="14" height="10" rx="2" stroke="#A78BFA" strokeWidth="1.5"/>
      <path d="M24 9h6M24 12h4" stroke="#C4B5FD" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  samples: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <path d="M8 12l12-6 12 6v16l-12 6-12-6V12z" stroke="#D97706" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 12l12 6 12-6" stroke="#D97706" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M20 18v14" stroke="#D97706" strokeWidth="2"/>
      <path d="M14 9l12 6" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
    </svg>
  ),
  knowledge: (
    <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
      <rect x="8" y="6" width="24" height="28" rx="2" stroke="#9333EA" strokeWidth="2"/>
      <path d="M14 14h12M14 18h12M14 22h8" stroke="#A855F7" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="20" cy="28" r="3" stroke="#9333EA" strokeWidth="2"/>
      <path d="M18.5 26.5l3 3" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="12" y="2" width="16" height="8" rx="1" stroke="#C084FC" strokeWidth="1.5" opacity="0.7"/>
    </svg>
  ),

  // Admin 後台圖示（較小尺寸）
  target: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="16" r="7" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
      <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
    </svg>
  ),
  team: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <circle cx="16" cy="11" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="25" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      <path d="M26 20c2 .8 3.5 2.8 3.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  dealer: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="4" y="14" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 18h24" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
      <path d="M10 6h12l4 8H6l4-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <rect x="13" y="22" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  video: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="3" y="7" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 13l6-3v12l-6-3v-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="13" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  slides: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="4" y="4" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 22v6M10 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 10h12M10 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <path d="M6 16a10 10 0 0117.3-6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M26 16a10 10 0 01-17.3 6.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M22 6l2 4-4 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 26l-2-4 4-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  logs: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <rect x="6" y="4" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M11 10h10M11 15h10M11 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <circle cx="11" cy="10" r="1" fill="currentColor"/>
      <circle cx="11" cy="15" r="1" fill="currentColor"/>
      <circle cx="11" cy="20" r="1" fill="currentColor"/>
    </svg>
  ),
  adminManage: (
    <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
      <path d="M16 4l2 5h5l-4 3 1.5 5L16 14l-4.5 3L13 12 9 9h5l2-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="16" cy="24" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 20v-3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),

  // Marketing 數位資源庫圖示（中尺寸）
  videoLarge: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="3" y="7" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M23 13l6-3v12l-6-3v-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="13" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  slidesLarge: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="4" y="4" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 22v6M10 28h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 10h12M10 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  robot: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
      <rect x="8" y="10" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="14" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="20" cy="17" r="2" fill="currentColor" opacity="0.6"/>
      <path d="M16 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="5" r="1.5" fill="currentColor"/>
      <path d="M5 16h3M24 16h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    </svg>
  ),
}

// Portal 首頁選單項目類型定義
export interface MenuItem {
  id: string
  title: string
  desc: string
  href: string
  icon: keyof typeof icons
  gradient: string
  textColor: string
  status: 'live' | 'beta' | 'soon'
  group: 'sales' | 'tools' | 'system'
}

// Portal 首頁選單配置
export const PORTAL_MENU_ITEMS: MenuItem[] = [
  // 營業核心
  { id: 'performance', title: '業績管理', desc: 'Pipeline 追蹤 · 目標達成率 · 團隊績效', href: '/performance', icon: 'pipeline', gradient: 'from-blue-500 to-blue-600', textColor: 'text-blue-100', status: 'live', group: 'sales' },
  { id: 'products', title: '產品目錄', desc: '搜尋產品 · 牌價經銷價 · 即時庫存', href: '/products', icon: 'product', gradient: 'from-emerald-500 to-emerald-600', textColor: 'text-emerald-100', status: 'live', group: 'sales' },
  { id: 'quotations', title: '報價單', desc: '快速開立報價 · PDF 匯出 · 歷史查詢', href: '/quotations', icon: 'quotation', gradient: 'from-orange-500 to-orange-600', textColor: 'text-orange-100', status: 'beta', group: 'sales' },
  // 效率工具
  { id: 'transcripts', title: '會議逐字稿', desc: 'AI 語音轉文字 · 講者辨識 · 智慧校正', href: '/transcripts', icon: 'transcript', gradient: 'from-indigo-500 to-indigo-600', textColor: 'text-indigo-100', status: 'live', group: 'tools' },
  { id: 'marketing', title: '數位資源庫', desc: '產品影片 · 簡報範本 · 技術文件', href: '/marketing', icon: 'marketing', gradient: 'from-violet-500 to-violet-600', textColor: 'text-violet-100', status: 'live', group: 'tools' },
  { id: 'knowledge', title: '知識庫', desc: '產品知識 · 銷售技巧 · 常見問題', href: '/knowledge', icon: 'knowledge', gradient: 'from-purple-500 to-purple-600', textColor: 'text-purple-100', status: 'beta', group: 'tools' },
  { id: 'samples', title: '樣品借用', desc: '借出歸還追蹤 · 庫位管理', href: '/samples', icon: 'samples', gradient: 'from-amber-500 to-amber-600', textColor: 'text-amber-100', status: 'soon', group: 'tools' },
  // 系統管理
  { id: 'agents', title: 'Agent 中控台', desc: '多 Agent 狀態 · 任務監控 · 執行紀錄', href: '/agents', icon: 'agent', gradient: 'from-cyan-500 to-cyan-600', textColor: 'text-cyan-100', status: 'live', group: 'system' },
  { id: 'admin', title: '後台管理', desc: '目標設定 · 團隊管理 · 經銷商維護', href: '/admin', icon: 'admin', gradient: 'from-gray-600 to-gray-700', textColor: 'text-gray-300', status: 'live', group: 'system' },
]

// Portal 首頁群組標籤
export const PORTAL_GROUP_LABELS: Record<string, { label: string; desc: string }> = {
  sales: { label: '營業核心', desc: '日常業務必備功能' },
  tools: { label: '效率工具', desc: '提升工作效率的輔助工具' },
  system: { label: '系統管理', desc: '管理員專用' },
}

// Portal 首頁狀態徽章
export const PORTAL_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  live: { label: '', cls: '' },
  beta: { label: 'BETA', cls: 'bg-amber-400/90 text-amber-900' },
  soon: { label: '開發中', cls: 'bg-white/20 text-white/80' },
}

// Admin 後台選單項目類型定義
export interface AdminItem {
  title: string
  desc: string
  href: string
  icon: keyof typeof icons
  color: string
  group: 'core' | 'content' | 'system'
  superOnly?: boolean
}

// Admin 後台選單配置
export const ADMIN_MENU_ITEMS: AdminItem[] = [
  { title: '目標管理', desc: '年度 · 月度 · 個人目標設定', href: '/admin/targets', icon: 'target', color: '#3B82F6', group: 'core' },
  { title: '業務團隊', desc: '業務員資料 · 職責分配', href: '/admin/team', icon: 'team', color: '#10B981', group: 'core' },
  { title: '經銷商管理', desc: '經銷商資料 · 聯絡人 · 區域', href: '/admin/dealers', icon: 'dealer', color: '#8B5CF6', group: 'core' },
  { title: '影片管理', desc: '案例影片 · 分類 · 連結', href: '/admin/videos', icon: 'video', color: '#EF4444', group: 'content' },
  { title: '簡報管理', desc: '簡報範本 · 分類 · 權限', href: '/admin/slides', icon: 'slides', color: '#F59E0B', group: 'content' },
  { title: '資料同步', desc: 'Funnel 報表上傳 · 資料匯入', href: '/admin/sync', icon: 'sync', color: '#F97316', group: 'system' },
  { title: '系統日誌', desc: '登入紀錄 · 操作紀錄 · 錯誤', href: '/admin/logs', icon: 'logs', color: '#06B6D4', group: 'system' },
  { title: '管理員管理', desc: '新增 · 移除管理員帳號', href: '/admin/admins', icon: 'adminManage', color: '#EC4899', group: 'system', superOnly: true },
]

// Admin 後台群組標籤
export const ADMIN_GROUP_LABELS: Record<string, string> = {
  core: '營業管理',
  content: '內容管理',
  system: '系統設定',
}

// Marketing 數位資源庫選單項目類型定義
export interface MarketingItem {
  title: string
  desc: string
  sub: string
  href: string
  icon: keyof typeof icons
  color: string
}

// Marketing 數位資源庫選單配置
export const MARKETING_MENU_ITEMS: MarketingItem[] = [
  {
    title: '影片案例',
    desc: '產品演示 · 客戶案例 · 官方宣傳',
    sub: 'YouTube 影片 · 分類瀏覽 · 關鍵字搜尋',
    href: '/marketing/videos',
    icon: 'videoLarge',
    color: '#EF4444',
  },
  {
    title: '簡報案例',
    desc: '產品簡報 · 方案提案 · 技術文件',
    sub: 'Google Slides · 播放清單 · 依序播放',
    href: '/marketing/slides',
    icon: 'slidesLarge',
    color: '#F59E0B',
  },
  {
    title: 'Walker 天工文檔',
    desc: 'Walker 機器人技術文檔 · SDK',
    sub: 'UBTECH · 用戶手冊 · SDK 文檔',
    href: '/marketing/walker-docs',
    icon: 'robot',
    color: '#8B5CF6',
  },
]