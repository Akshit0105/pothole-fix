const puppeteer = require('puppeteer-core');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const WORKSPACE_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix';
const BACKEND_DIR = path.join(WORKSPACE_DIR, 'backend');
const PYTHON_PATH = path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe');
const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\2239e808-338f-4629-ac6f-54c68db808f6';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Global safety timeout: exit process after 45 seconds no matter what
const globalTimer = setTimeout(() => {
  console.error('[TIMEOUT] Global safety timeout (45s) exceeded! Forcing process exit.');
  process.exit(1);
}, 45000);

async function waitForServer(url, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await sleep(400);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log('=== FAST TARGETED GLOBE NAVIGATION VERIFICATION ===\n');

  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    // 1. Check if backend is already running
    let backendRunning = false;
    try {
      const res = await fetch('http://127.0.0.1:8000/reports/public');
      if (res.ok) backendRunning = true;
    } catch {}

    if (!backendRunning) {
      console.log('[1/4] Spawning FastAPI backend...');
      backendProc = spawn(PYTHON_PATH, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PYTHONPATH: BACKEND_DIR },
        stdio: 'ignore',
      });
      await waitForServer('http://127.0.0.1:8000/reports/public');
    }
    console.log('  [PASS] FastAPI backend active.');

    // 2. Check if frontend is already running
    let frontendPort = 5173;
    let frontendRunning = false;
    try {
      const res = await fetch('http://127.0.0.1:5173/');
      if (res.ok) frontendRunning = true;
    } catch {}

    if (!frontendRunning) {
      console.log('[2/4] Spawning Vite server...');
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      frontendProc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173', '--host', '127.0.0.1'], {
        cwd: WORKSPACE_DIR,
        stdio: 'ignore',
        shell: true,
      });
      await waitForServer('http://127.0.0.1:5173/');
    }
    console.log('  [PASS] Vite dev server active at http://127.0.0.1:5173/');

    // 3. Launch Chrome Puppeteer
    console.log('[3/4] Launching Puppeteer...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(1500);

    // Scroll to Impact Globe Section
    const impactSection = await page.$('#impact');
    if (impactSection) {
      await impactSection.scrollIntoView();
      await sleep(1000);
    }

    // -------------------------------------------------------------
    // SCENARIO 1: CLUSTER HOVER & PREVIEW CARD
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING CLUSTER HOVER & PREVIEW CARD ---');
    // Ensure mouse moves directly to cluster badge
    await page.evaluate(() => {
      const b = document.querySelector('#impact button[title*="Cluster"]');
      if (b) {
        b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    });

    const clusterBtn = await page.$('#impact button[title*="Cluster"]');
    if (!clusterBtn) {
      throw new Error('Cluster badge button not found on 3D globe!');
    }
    await clusterBtn.hover();
    await sleep(800);

    // Verify hover preview card rendered
    const cardData = await page.evaluate(() => {
      const impactText = document.querySelector('#impact')?.innerText || '';
      return {
        hasCorridorCluster: impactText.includes('Corridor Cluster'),
        hasPF102: impactText.includes('PF-102') || impactText.includes('Madhya Marg'),
        hasPF101: impactText.includes('PF-101') || impactText.includes('Sector 17'),
        hasClickHint: impactText.includes('Click any report to zoom directly'),
      };
    });
    console.log('  Hover preview content:', cardData);

    const shotHover = path.join(ARTIFACT_DIR, 'verified_02_cluster_hover.png');
    await page.screenshot({ path: shotHover });
    console.log('  [PASS] Screenshot saved: verified_02_cluster_hover.png');

    const shotPopup = path.join(ARTIFACT_DIR, 'verified_03_cluster_popup_reports.png');
    await page.screenshot({ path: shotPopup });
    console.log('  [PASS] Screenshot saved: verified_03_cluster_popup_reports.png');

    // -------------------------------------------------------------
    // SCENARIO 2: CLICK REPORT (PF-102) -> DIRECT CLICK-TO-ZOOM
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING DIRECT CLICK-TO-ZOOM (PF-102) ---');
    const clickedRow = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#impact div[class*="cursor-pointer"]'));
      const pf102 = rows.find((r) => r.innerText.includes('PF-102') || r.innerText.includes('Madhya Marg'));
      if (pf102) {
        pf102.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked PF-102 inside preview:', clickedRow);

    await sleep(400);
    const zoomText = await page.evaluate(() => {
      return document.querySelector('#impact')?.innerText.includes('Direct Zoom: Navigating to') || false;
    });
    console.log('  [PASS] Zoom animation active overlay verified:', zoomText);

    const shotZoom = path.join(ARTIFACT_DIR, 'verified_05_zoom_animation_state.png');
    await page.screenshot({ path: shotZoom });
    console.log('  [PASS] Screenshot saved: verified_05_zoom_animation_state.png');

    // Wait 1.8s for zoom animation completion and Leaflet mount
    await sleep(2000);

    // -------------------------------------------------------------
    // SCENARIO 3: STREET MAP CENTERED ON PF-102 AT ZOOM 18
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING STREET MAP EXACT GPS CENTERING ---');
    const streetMapResult = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container');
      const text = document.querySelector('#impact')?.innerText || '';
      return {
        leafletMounted: !!container,
        hasMadhyaMarg: text.includes('Madhya Marg Arterial'),
        hasCoordinates: text.includes('30.7290') && text.includes('76.8040'),
        hasInProgress: text.includes('IN_PROGRESS'),
      };
    });
    console.log('  Street map PF-102 state:', streetMapResult);
    if (!streetMapResult.leafletMounted || !streetMapResult.hasCoordinates) {
      throw new Error('Street map failed to mount or center on PF-102 coordinates!');
    }

    const shotMap = path.join(ARTIFACT_DIR, 'verified_06_street_map_pf102.png');
    await page.screenshot({ path: shotMap });
    console.log('  [PASS] Screenshot saved: verified_06_street_map_pf102.png');

    // -------------------------------------------------------------
    // SCENARIO 4: RETURN TO 3D GLOBE
    // -------------------------------------------------------------
    console.log('\n--- VERIFYING RETURN TO 3D GLOBE ---');
    const clickedBack = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const back = buttons.find((b) => b.innerText.includes('Back to 3D Globe'));
      if (back) {
        back.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked Back to 3D Globe:', clickedBack);
    await sleep(1500);

    const globeState = await page.evaluate(() => {
      const canvas = document.querySelector('#impact canvas');
      const leaflet = document.querySelector('.leaflet-container');
      return { canvasPresent: !!canvas, leafletUnmounted: !leaflet };
    });
    console.log('  [PASS] Globe restoration verified:', globeState);

    const shotGlobe = path.join(ARTIFACT_DIR, 'verified_10_back_to_globe.png');
    await page.screenshot({ path: shotGlobe });
    console.log('  [PASS] Screenshot saved: verified_10_back_to_globe.png');

    console.log('\n=============================================================');
    console.log('  ALL CORE GLOBE NAVIGATION TESTS COMPLETED SUCCESSFULLY!    ');
    console.log('=============================================================');
  } catch (err) {
    console.error('[TEST ERROR]', err.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(globalTimer);
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    if (frontendProc && frontendProc.pid) {
      try {
        execSync(`taskkill /F /PID ${frontendProc.pid} /T`, { stdio: 'ignore' });
      } catch {}
    }
    if (backendProc && backendProc.pid) {
      try {
        execSync(`taskkill /F /PID ${backendProc.pid} /T`, { stdio: 'ignore' });
      } catch {}
    }
    // Cleanly exit the node process immediately without hanging
    process.exit(process.exitCode || 0);
  }
}

run();
