/**
 * Portal 資料庫連接層
 * 目前使用 Google Sheets 作為資料來源
 * 未來可切換到 Supabase
 */

// ===== 資料類型定義 =====

export interface TeamMember {
  id: string;
  name: string;
  englishName?: string;
  email: string;
  phone: string;
  region: string;
  status: 'active' | 'inactive';
  ytdTarget?: number;
}

export interface Dealer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  region: string;
  status: 'active' | 'inactive';
  address?: string;
  notes?: string;
}

export interface Target {
  id: string;
  year: number;
  month: number;
  repId: string;
  repName: string;
  targetAmount: number;
  actualAmount?: number;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  youtubeUrl: string;
  description?: string;
  keywords?: string;
  region?: string;
  robotType?: string;
  customThumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Slide {
  id: string;
  title: string;
  category: string;
  subCategory?: string;
  driveUrl: string;
  description?: string;
  keywords?: string;
  region?: string;
  permittedAdmins?: string;
  customThumbnail?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ===== Google Sheets 設定 =====

// Portal 專用資料表 (需要設定寫入權限)
const PORTAL_SHEET_ID = process.env.PORTAL_SHEET_ID || '';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// 原始資料來源 (Puducasesv2 - 只讀)
const SOURCE_SHEET_ID = '1tkLPKqFQld2bCythqNY0CX83w4y1cWZJvW6qErE8vek';

// ===== 共用函數 =====

async function fetchSheetData(sheetId: string, sheetName: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}?key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url, { 
    next: { revalidate: 60 },
    cache: 'no-store' 
  });
  
  if (!response.ok) {
    console.error(`Failed to fetch ${sheetName}:`, response.statusText);
    return [];
  }
  
  const data = await response.json();
  return data.values || [];
}

// ===== Team (業務團隊) =====

// 暫存資料 (在沒有 Supabase 前用)
let teamCache: TeamMember[] = [
  { id: 'u2625', name: '喬紹恆', englishName: 'Morris', email: 'morrischiao@aurotek.com', phone: '0978-906-185', region: '全區', status: 'active' },
  { id: 'TBH-1', name: '張哲銘', englishName: 'Martin', email: 'martinchang@aurotek.com', phone: '', region: '全區', status: 'active' },
  { id: 'TBH-2', name: '林奕丞', englishName: 'Eric', email: 'ericlin@aurotek.com', phone: '', region: '全區', status: 'active' },
];

export async function getTeamMembers(): Promise<TeamMember[]> {
  // 如果有 Portal Sheet，從那裡讀取
  if (PORTAL_SHEET_ID) {
    try {
      const rows = await fetchSheetData(PORTAL_SHEET_ID, 'team');
      if (rows.length > 1) {
        return rows.slice(1).map(row => ({
          id: row[0] || '',
          name: row[1] || '',
          englishName: row[2] || '',
          email: row[3] || '',
          phone: row[4] || '',
          region: row[5] || '',
          status: (row[6] as 'active' | 'inactive') || 'active',
        }));
      }
    } catch (e) {
      console.error('Failed to fetch team from sheet:', e);
    }
  }
  return teamCache;
}

export async function saveTeamMember(member: TeamMember): Promise<boolean> {
  // 更新快取
  const idx = teamCache.findIndex(m => m.id === member.id);
  if (idx >= 0) {
    teamCache[idx] = member;
  } else {
    teamCache.push(member);
  }
  
  // TODO: 寫入 Supabase 或 Google Sheets
  console.log('[DB] Saved team member:', member.id);
  return true;
}

export async function deleteTeamMember(id: string): Promise<boolean> {
  teamCache = teamCache.filter(m => m.id !== id);
  console.log('[DB] Deleted team member:', id);
  return true;
}

// ===== Dealers (經銷商) =====

let dealersCache: Dealer[] = [
  { id: 'D001', name: '範例經銷商', contact: '王小明', phone: '02-1234-5678', email: 'demo@example.com', region: '北區', status: 'active' },
];

export async function getDealers(): Promise<Dealer[]> {
  if (PORTAL_SHEET_ID) {
    try {
      const rows = await fetchSheetData(PORTAL_SHEET_ID, 'dealers');
      if (rows.length > 1) {
        return rows.slice(1).map(row => ({
          id: row[0] || '',
          name: row[1] || '',
          contact: row[2] || '',
          phone: row[3] || '',
          email: row[4] || '',
          region: row[5] || '',
          status: (row[6] as 'active' | 'inactive') || 'active',
          address: row[7] || '',
          notes: row[8] || '',
        }));
      }
    } catch (e) {
      console.error('Failed to fetch dealers from sheet:', e);
    }
  }
  return dealersCache;
}

export async function saveDealer(dealer: Dealer): Promise<boolean> {
  const idx = dealersCache.findIndex(d => d.id === dealer.id);
  if (idx >= 0) {
    dealersCache[idx] = dealer;
  } else {
    dealersCache.push(dealer);
  }
  console.log('[DB] Saved dealer:', dealer.id);
  return true;
}

export async function deleteDealer(id: string): Promise<boolean> {
  dealersCache = dealersCache.filter(d => d.id !== id);
  console.log('[DB] Deleted dealer:', id);
  return true;
}

// ===== Targets (目標設定) =====

const targetsCache: Target[] = [];

export async function getTargets(year?: number): Promise<Target[]> {
  if (PORTAL_SHEET_ID) {
    try {
      const rows = await fetchSheetData(PORTAL_SHEET_ID, 'targets');
      if (rows.length > 1) {
        let targets = rows.slice(1).map(row => ({
          id: row[0] || '',
          year: parseInt(row[1]) || new Date().getFullYear(),
          month: parseInt(row[2]) || 1,
          repId: row[3] || '',
          repName: row[4] || '',
          targetAmount: parseFloat(row[5]) || 0,
          actualAmount: parseFloat(row[6]) || 0,
        }));
        if (year) {
          targets = targets.filter(t => t.year === year);
        }
        return targets;
      }
    } catch (e) {
      console.error('Failed to fetch targets from sheet:', e);
    }
  }
  return year ? targetsCache.filter(t => t.year === year) : targetsCache;
}

export async function saveTarget(target: Target): Promise<boolean> {
  const idx = targetsCache.findIndex(t => t.id === target.id);
  if (idx >= 0) {
    targetsCache[idx] = target;
  } else {
    targetsCache.push(target);
  }
  console.log('[DB] Saved target:', target.id);
  return true;
}

// ===== Videos & Slides (從原資料庫複製) =====

export async function getVideosFromSource(): Promise<Video[]> {
  const rows = await fetchSheetData(SOURCE_SHEET_ID, 'Videos');
  if (rows.length <= 1) return [];
  
  return rows.slice(1).map((row, idx) => ({
    id: row[0] || `V${idx + 1}`,
    title: row[9] || '',
    category: row[1] || '',
    subCategory: row[2] || '',
    youtubeUrl: row[6] || '',
    keywords: row[7] || '',
    region: row[3] || '',
    robotType: row[4] || '',
    customThumbnail: row[10] || '',
  }));
}

export async function getSlidesFromSource(): Promise<Slide[]> {
  const rows = await fetchSheetData(SOURCE_SHEET_ID, 'Presentations');
  if (rows.length <= 1) return [];
  
  return rows.slice(1).map((row, idx) => ({
    id: row[0] || `S${idx + 1}`,
    title: row[7] || '',
    category: row[1] || '',
    subCategory: row[2] || '',
    driveUrl: row[5] || '',
    keywords: row[6] || '',
    region: row[3] || '',
    permittedAdmins: row[8] || '',
    customThumbnail: row[9] || '',
  }));
}
