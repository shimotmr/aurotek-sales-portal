#!/usr/bin/env node
/**
 * Upload Visual Regression Results to Supabase for Aurotek Portal
 * 將視覺回歸測試結果上傳到 Supabase screenshot_diffs 表
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PROJECT = process.env.PROJECT || 'aurotek-portal';
const COMMIT_SHA = process.env.GITHUB_SHA || 'local';
const BRANCH = process.env.GITHUB_REF_NAME || 'main';

// 檢查環境變數
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('警告：Supabase 環境變數未設定，跳過上傳');
  process.exit(0);
}

// 讀取最新的報告檔案
const reportsDir = '.visual-regression';
const reportFiles = fs.readdirSync(reportsDir)
  .filter(f => f.startsWith('report-') && f.endsWith('.json'))
  .sort()
  .reverse();

if (reportFiles.length === 0) {
  console.log('無報告檔案');
  process.exit(0);
}

const reportPath = path.join(reportsDir, reportFiles[0]);
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

console.log(`上傳報告：${reportPath}`);
console.log(`專案：${PROJECT}`);
console.log(`Commit：${COMMIT_SHA}`);

// 準備上傳資料
const records = report.results.map(result => ({
  project: PROJECT,
  page_name: result.page,
  viewport: result.viewport,
  deployment_url: 'local',  // TODO: 從環境變數取得實際部署 URL
  commit_sha: COMMIT_SHA,
  branch: BRANCH,
  diff_percentage: result.diff,
  has_changes: result.status === 'changed',
  review_status: result.status === 'new' ? 'auto-approved' : 
                  result.status === 'unchanged' ? 'auto-approved' :
                  result.diff > 5 ? 'pending' : 'auto-approved',
  raw_data: result,
}));

// 批次上傳到 Supabase
async function uploadToSupabase() {
  const url = `${SUPABASE_URL}/rest/v1/screenshot_diffs`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase 上傳失敗：${response.status} - ${error}`);
  }

  console.log(`成功上傳 ${records.length} 筆記錄到 Supabase`);
}

uploadToSupabase()
  .then(() => {
    console.log('上傳完成');
    process.exit(0);
  })
  .catch(error => {
    console.error('上傳失敗：', error.message);
    process.exit(1);
  });