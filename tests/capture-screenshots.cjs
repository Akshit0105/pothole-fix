const puppeteer = require('puppeteer-core');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const NODE_PATH = 'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\\node-v24.20.0-win-x64\\node.exe';
const WORKSPACE_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function checkUrl(url, maxRetries = 30) {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      const req = http.get(url, (res) => {
        if (res.statusCode < 500) {
          clearInterval(interval);
          resolve(true);
        }
      });
      req.on('error', () => {
        if (retries >= maxRetries) {
          clearInterval(interval);
          reject(new Error('Timeout waiting for ' + url));
        }
      });
    }, 1000);
  });
}

async function takeScreenshots() {
  const viteCli = path.join(WORKSPACE_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const frontendProc = spawn(NODE_PATH, [viteCli, 'preview', '--port', '5175', '--host', '127.0.0.1'], {
    cwd: WORKSPACE_DIR,
    stdio: 'ignore',
  });

  let browser;
  try {
    await checkUrl('http://127.0.0.1:5175/');

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--headless=new'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto('http://127.0.0.1:5175/#impact', { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    const artifactDir = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\2239e808-338f-4629-ac6f-54c68db808f6';
    const screenshot1 = path.join(artifactDir, 'globe_india_highlighted.png');

    const impactEl = await page.$('#impact');
    if (impactEl) {
      await impactEl.screenshot({ path: screenshot1 });
      console.log('Saved screenshot 1 to:', screenshot1);
    }

    // Select Sector 17 pin to show inspection card
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sec17Btn = buttons.find(b => b.textContent && b.textContent.includes('Sector 17'));
      if (sec17Btn) sec17Btn.click();
    });
    await sleep(1000);

    const screenshot2 = path.join(artifactDir, 'globe_pin_inspection_card.png');
    if (impactEl) {
      await impactEl.screenshot({ path: screenshot2 });
      console.log('Saved screenshot 2 to:', screenshot2);
    }

  } finally {
    if (browser) await browser.close();
    frontendProc.kill('SIGTERM');
  }
}

takeScreenshots()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
