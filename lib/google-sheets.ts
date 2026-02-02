/**
 * Google Sheets API 封裝
 * 用於讀取數位資源庫資料
 */

const SHEET_ID = '1tkLPKqFQld2bCythqNY0CX83w4y1cWZJvW6qErE8vek'; // Puducasesv2

// 從環境變數讀取 Google API 金鑰（在 Vercel 設定）
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

export interface Video {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  region: string;
  robotType: string;
  client: string;
  videoUrl: string;
  keywords: string;
  rating: number;
  customThumbnail?: string;
}

export interface Slide {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  region: string;
  client: string;
  slideUrl: string;
  keywords: string;
  permittedAdmins?: string;
  customThumbnail?: string;
}

/**
 * 從 Google Sheets 讀取資料
 */
async function fetchSheetData(sheetName: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${sheetName}?key=${GOOGLE_API_KEY}`;
  
  const response = await fetch(url, {
    next: { revalidate: 300 } // 快取 5 分鐘
  });
  
  if (!response.ok) {
    console.error(`Failed to fetch ${sheetName}:`, response.statusText);
    return [];
  }
  
  const data = await response.json();
  return data.values || [];
}

/**
 * 取得所有影片
 */
export async function getVideos(): Promise<Video[]> {
  const rows = await fetchSheetData('Videos');
  if (rows.length <= 1) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => ({
    id: row[0] || '',
    category: row[1] || '',
    subCategory: row[2] || '',
    region: row[3] || '',
    robotType: row[4] || '',
    client: row[5] || '',
    videoUrl: row[6] || '',
    keywords: row[7] || '',
    rating: parseInt(row[8]) || 0,
    title: row[9] || '',
    customThumbnail: row[10] || '',
  }));
}

/**
 * 取得所有簡報
 */
export async function getSlides(): Promise<Slide[]> {
  const rows = await fetchSheetData('Presentations');
  if (rows.length <= 1) return [];
  
  return rows.slice(1).map(row => ({
    id: row[0] || '',
    category: row[1] || '',
    subCategory: row[2] || '',
    region: row[3] || '',
    client: row[4] || '',
    slideUrl: row[5] || '',
    keywords: row[6] || '',
    title: row[7] || '',
    permittedAdmins: row[8] || '',
    customThumbnail: row[9] || '',
  }));
}

/**
 * 取得機器人型號清單
 */
export async function getRobotModels(): Promise<string[]> {
  const rows = await fetchSheetData('pudu_models');
  return rows.flat().filter(Boolean);
}

/**
 * 取得 YouTube 縮圖
 */
export function getYouTubeThumbnail(url: string): string {
  const match = url?.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return '/placeholder.png';
}

/**
 * 取得 Google Slides 縮圖
 */
export function getSlideThumbnail(url: string): string {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  return '/placeholder.png';
}

/**
 * 取得 YouTube 嵌入 URL
 */
export function getYouTubeEmbedUrl(url: string): string {
  const match = url?.match(/(?:v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
  }
  return url;
}

/**
 * 取得 Google Slides 嵌入 URL
 */
export function getSlideEmbedUrl(url: string): string {
  const match = url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://docs.google.com/presentation/d/${match[1]}/embed?start=false&loop=false&delayms=3000`;
  }
  return url;
}
