#!/usr/bin/env node
/**
 * Screenshot Diff - Visual Regression Testing for Aurotek Portal
 * 使用 Playwright + Pixelmatch 進行精確的像素級比對
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

// 設定
const PROJECT = process.env.PROJECT || 'aurotek-portal';

// 如果在 CI 環境中，使用相對路徑，否則使用 clawd 目錄
const IS_CI = process.env.CI || process.env.GITHUB_ACTIONS;
const BASE_DIR = IS_CI ? '.visual-regression' : path.join(process.env.HOME, 'clawd', 'logs', 'visual-diff', PROJECT);
const SCREENSHOTS_DIR = IS_CI ? BASE_DIR : BASE_DIR;
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const DIFF_DIR = path.join(SCREENSHOTS_DIR, 'diff');

// 專案設定
const CONFIG = {
  'aurotek-portal': {
    port: 3000,
    pages: [
      { name: 'home', url: '/' },
      { name: 'transcripts', url: '/transcripts' },
      { name: 'products', url: '/products' },
      { name: 'marketing', url: '/marketing' },
      { name: 'login', url: '/login' },
    ],
  },
  'travis-daily': {
    port: 3000,
    pages: [
      { name: 'home', url: '/' },
      { name: 'about', url: '/about' },
      { name: 'blog', url: '/blog' },
    ],
  },
  'william-hub': {
    port: 3000,
    pages: [
      { name: 'home', url: '/' },
      { name: 'board', url: '/board' },
      { name: 'reports', url: '/reports' },
    ],
  },
};

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

// 建立目錄
[BASELINE_DIR, CURRENT_DIR, DIFF_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 截圖函數
async function takeScreenshots() {
  const config = CONFIG[PROJECT];
  if (!config) {
    throw new Error(`未知專案：${PROJECT}`);
  }

  const baseUrl = `http://localhost:${config.port}`;
  const browser = await chromium.launch();
  const screenshots = [];

  console.log(`開始截圖：${PROJECT}`);

  for (const viewport of VIEWPORTS) {
    console.log(`視窗：${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    for (const pageInfo of config.pages) {
      const filename = `${pageInfo.name}-${viewport.name}.png`;
      const filepath = path.join(CURRENT_DIR, filename);

      console.log(`  截圖：${filename}`);
      
      try {
        await page.goto(`${baseUrl}${pageInfo.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });
        
        // 等待頁面穩定
        await page.waitForTimeout(2000);
        
        await page.screenshot({
          path: filepath,
          fullPage: false,
        });

        screenshots.push({
          page: pageInfo.name,
          viewport: viewport.name,
          filename,
          filepath,
        });
      } catch (error) {
        console.error(`  錯誤：${filename} - ${error.message}`);
      }
    }

    await context.close();
  }

  await browser.close();
  return screenshots;
}

// 比對差異
function compareScreenshots(currentPath, baselinePath, diffPath) {
  if (!fs.existsSync(baselinePath)) {
    return { status: 'new', diff: null };
  }

  const img1 = PNG.sync.read(fs.readFileSync(currentPath));
  const img2 = PNG.sync.read(fs.readFileSync(baselinePath));

  const { width, height } = img1;
  
  // 檢查尺寸是否一致
  if (img2.width !== width || img2.height !== height) {
    return { status: 'size-mismatch', diff: null };
  }

  const diff = new PNG({ width, height });
  
  // pixelmatch 比對
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 }  // 容許度 0.1
  );

  // 計算差異百分比
  const totalPixels = width * height;
  const diffPercentage = (numDiffPixels / totalPixels) * 100;

  // 儲存差異圖
  if (numDiffPixels > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    status: numDiffPixels > 0 ? 'changed' : 'unchanged',
    diff: diffPercentage,
    pixels: numDiffPixels,
  };
}

// 主函數
async function main() {
  const startTime = Date.now();
  
  // 拍攝截圖
  const screenshots = await takeScreenshots();
  
  // 比對結果
  const results = [];
  let totalDiffs = 0;
  let hasBaseline = false;

  console.log('\n比對差異...');
  
  for (const screenshot of screenshots) {
    const currentPath = screenshot.filepath;
    const baselinePath = path.join(BASELINE_DIR, screenshot.filename);
    const diffPath = path.join(DIFF_DIR, screenshot.filename);

    const result = compareScreenshots(currentPath, baselinePath, diffPath);
    
    if (result.status === 'new') {
      console.log(`  新頁面：${screenshot.filename}`);
    } else {
      hasBaseline = true;
      
      if (result.status === 'changed') {
        console.log(`  發現差異：${screenshot.filename} (${result.diff.toFixed(3)}%)`);
        totalDiffs++;
      } else if (result.status === 'unchanged') {
        console.log(`  無差異：${screenshot.filename}`);
      } else if (result.status === 'size-mismatch') {
        console.log(`  尺寸不符：${screenshot.filename}`);
      }
    }

    results.push({
      page: screenshot.page,
      viewport: screenshot.viewport,
      filename: screenshot.filename,
      ...result,
    });
  }

  // 若無 baseline，複製當前為 baseline
  if (!hasBaseline) {
    console.log('\n首次執行，建立 baseline...');
    for (const screenshot of screenshots) {
      const src = screenshot.filepath;
      const dest = path.join(BASELINE_DIR, screenshot.filename);
      fs.copyFileSync(src, dest);
    }
  }

  // 產生報告
  const report = {
    project: PROJECT,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    total_screenshots: screenshots.length,
    total_diffs: totalDiffs,
    has_baseline: hasBaseline,
    results,
  };

  const reportFile = path.join(
    SCREENSHOTS_DIR,
    `report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  );
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  // 輸出摘要
  console.log('\n=========================================');
  console.log('視覺回歸測試完成');
  console.log('=========================================');
  console.log(`專案：${PROJECT}`);
  console.log(`截圖數量：${screenshots.length}`);
  console.log(`發現差異：${totalDiffs}`);
  console.log(`執行時間：${(report.duration_ms / 1000).toFixed(1)}s`);
  console.log(`報告位置：${reportFile}`);
  console.log('=========================================');

  // 退出碼
  process.exit(totalDiffs > 0 ? 1 : 0);
}

// 執行
main().catch(error => {
  console.error('執行失敗：', error);
  process.exit(1);
});