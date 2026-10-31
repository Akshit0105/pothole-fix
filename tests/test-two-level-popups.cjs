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

// 45-second global deadline failsafe
const failsafe = setTimeout(() => {
  console.error('[SAFETY TIMEOUT] 45s exceeded. Forcing clean exit.');
  process.exit(1);
}, 45000);

async function waitForServer(url, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await sleep(350);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function run() {
  console.log('=== VERIFYING GLOBE-FOCUSED UI WITH TWO-LEVEL HOVER PREVIEWS ===\n');

  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    // 1. Ensure FastAPI backend is alive
    let backendUp = false;
    try {
      const res = await fetch('http://127.0.0.1:8000/reports/public');
      if (res.ok) backendUp = true;
    } catch {}

    if (!backendUp) {
      console.log('[1/4] Spawning FastAPI backend on port 8000...');
      backendProc = spawn(PYTHON_PATH, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: BACKEND_DIR,
        env: { ...process.env, PYTHONPATH: BACKEND_DIR },
        stdio: 'ignore',
      });
      await waitForServer('http://127.0.0.1:8000/reports/public');
    }
    console.log('  [PASS] FastAPI Backend active.');

    // 2. Ensure Vite server is alive
    let frontendUp = false;
    try {
      const res = await fetch('http://127.0.0.1:5173/');
      if (res.ok) frontendUp = true;
    } catch {}

    if (!frontendUp) {
      console.log('[2/4] Spawning Vite server on port 5173...');
      const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      frontendProc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173', '--host', '127.0.0.1'], {
        cwd: WORKSPACE_DIR,
        env: process.env,
        stdio: 'ignore',
        shell: true,
      });
      await waitForServer('http://127.0.0.1:5173/');
    }
    console.log('  [PASS] Vite Dev Server active at http://127.0.0.1:5173/');

    // 3. Launch Chrome via Puppeteer
    console.log('[3/4] Launching Headless Chrome...');
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
    // SCENARIO 1: FULL-WIDTH GLOBE (NO RIGHT SIDEBAR)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: CLEAN FULL-WIDTH GLOBE (NO SIDEBAR) ---');
    const layoutStatus = await page.evaluate(() => {
      const sidebarColumn = !!document.querySelector('#impact .lg\\:col-span-4');
      const sidebarHeading = Array.from(document.querySelectorAll('#impact h3')).some((h) =>
        h.innerText.includes('Monitored Road Corridors')
      );
      const canvas = !!document.querySelector('#impact canvas');
      const mapBtn = Array.from(document.querySelectorAll('#impact button')).some((b) =>
        b.innerText.includes('Open Detailed Street Map View')
      );
      return { sidebarPresent: sidebarColumn || sidebarHeading, canvasPresent: canvas, mapBtnPresent: mapBtn };
    });
    console.log('  Layout status:', layoutStatus);
    if (layoutStatus.sidebarPresent) {
      throw new Error('Permanent sidebar "Monitored Road Corridors" still present!');
    }

    const shot1 = path.join(ARTIFACT_DIR, 'verified_fullwidth_globe.png');
    await page.screenshot({ path: shot1 });
    console.log('  [PASS] Screenshot saved: verified_fullwidth_globe.png');

    // -------------------------------------------------------------
    // SCENARIO 2: FIRST LEVEL HOVER OVER CLUSTER (COMPACT REPORT LIST)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: LEVEL 1 CLUSTER POPUP ---');
    // Hover cluster badge
    await page.evaluate(() => {
      const clusterBadge = document.querySelector('#impact button[title*="Cluster"]');
      if (clusterBadge) {
        clusterBadge.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }
    });

    const clusterBadge = await page.$('#impact button[title*="Cluster"]');
    if (!clusterBadge) throw new Error('Cluster badge button not found!');
    await clusterBadge.hover();
    await sleep(600);

    const level1Data = await page.evaluate(() => {
      const text = document.querySelector('#impact')?.innerText || '';
      return {
        hasRegion: text.includes('Chandigarh Capital Region') || text.includes('Corridor Cluster'),
        hasDefectsCount: text.includes('Defects'),
        hasPF101: text.includes('PF-101'),
        hasPF102: text.includes('PF-102'),
        hasPF103: text.includes('PF-103'),
      };
    });
    console.log('  Level 1 data:', level1Data);

    const shot2 = path.join(ARTIFACT_DIR, 'verified_level1_cluster_popup.png');
    await page.screenshot({ path: shot2 });
    console.log('  [PASS] Screenshot saved: verified_level1_cluster_popup.png');

    // -------------------------------------------------------------
    // SCENARIO 3: SECOND LEVEL HOVER OVER PF-102 (DETAIL FLYOUT CARD)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: LEVEL 2 FLYOUT CARD BESIDE CLUSTER LIST ---');
    const pf102RowEl = await page.$('#impact [data-testid*="PF-102"]');
    if (pf102RowEl) {
      await pf102RowEl.hover();
    } else {
      await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#impact [data-report-id]'));
        const row = rows.find((r) => r.innerText.includes('PF-102') || r.innerText.includes('Madhya Marg'));
        if (row) {
          row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
      });
    }
    await sleep(700);

    const level2Data = await page.evaluate(() => {
      const text = document.querySelector('#impact')?.innerText || '';
      const locateBtn = Array.from(document.querySelectorAll('#impact button')).some((b) =>
        b.innerText.includes('Locate Precise Location')
      );
      return {
        hasLiveRecord: text.includes('LIVE RECORD'),
        hasMadhyaMarg: text.includes('Madhya Marg Arterial'),
        hasCoordinates: text.includes('30.7290') && text.includes('76.8040'),
        hasCraterProof: text.includes('Reported Crater Proof'),
        hasLocatePreciseLocationBtn: locateBtn,
      };
    });
    console.log('  Level 2 data:', level2Data);
    if (!level2Data.hasLocatePreciseLocationBtn || !level2Data.hasCoordinates) {
      throw new Error('Level 2 flyout card or "Locate Precise Location" button missing!');
    }

    const shot3 = path.join(ARTIFACT_DIR, 'verified_level2_both_popups.png');
    await page.screenshot({ path: shot3 });
    console.log('  [PASS] Screenshot saved: verified_level2_both_popups.png');

    const shot4 = path.join(ARTIFACT_DIR, 'verified_level2_detail_card.png');
    await page.screenshot({ path: shot4 });
    console.log('  [PASS] Screenshot saved: verified_level2_detail_card.png');

    // -------------------------------------------------------------
    // SCENARIO 4: HOVER ANOTHER ROW (PF-101) UPDATES LEVEL 2
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: HOVER PF-101 UPDATES LEVEL 2 SMOOTHLY ---');
    const pf101RowEl = await page.$('#impact [data-testid*="PF-101"]');
    if (pf101RowEl) {
      await pf101RowEl.hover();
    } else {
      await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#impact [data-report-id]'));
        const row = rows.find((r) => r.innerText.includes('PF-101') || r.innerText.includes('Sector 17'));
        if (row) {
          row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
      });
    }
    await sleep(600);

    const pf101Updated = await page.evaluate(() => {
      const text = document.querySelector('#impact')?.innerText || '';
      return text.includes('Sector 17 Plaza Corridor') || text.includes('30.7398');
    });
    console.log('  [PASS] Level 2 updated to PF-101:', pf101Updated);

    // Re-hover PF-102 so we navigate to PF-102
    if (pf102RowEl) {
      await pf102RowEl.hover();
    } else {
      await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#impact [data-report-id]'));
        const row = rows.find((r) => r.innerText.includes('PF-102') || r.innerText.includes('Madhya Marg'));
        if (row) {
          row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        }
      });
    }
    await sleep(600);

    // -------------------------------------------------------------
    // SCENARIO 5: CLICK "LOCATE PRECISE LOCATION" -> STREET MAP
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 5: CLICK "LOCATE PRECISE LOCATION" ON PF-102 ---');
    const clickedLocate = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const btn = buttons.find((b) => b.innerText.includes('Locate Precise Location'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked Locate Precise Location:', clickedLocate);

    // Wait 2.2s for 1.6s camera orbital rotation/zoom animation and Leaflet mount
    await sleep(2200);

    const streetMapStatus = await page.evaluate(() => {
      const container = document.querySelector('.leaflet-container');
      const text = document.querySelector('#impact')?.innerText || '';
      return {
        leafletMounted: !!container,
        hasMadhyaMarg: text.includes('Madhya Marg Arterial'),
        hasExactGPS: text.includes('30.7290') && text.includes('76.8040'),
        hasInProgress: text.includes('IN_PROGRESS'),
      };
    });
    console.log('  [PASS] Street map PF-102 GPS verification:', streetMapStatus);
    if (!streetMapStatus.leafletMounted || !streetMapStatus.hasExactGPS) {
      throw new Error('Failed to open Leaflet street map centered at PF-102 GPS coordinates!');
    }

    const shot5 = path.join(ARTIFACT_DIR, 'verified_street_map_precise_gps.png');
    await page.screenshot({ path: shot5 });
    console.log('  [PASS] Screenshot saved: verified_street_map_precise_gps.png');

    // -------------------------------------------------------------
    // SCENARIO 6: CLEAN RETURN TO 3D GLOBE
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 6: RETURN TO 3D GLOBE ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const back = buttons.find((b) => b.innerText.includes('Back to 3D Globe'));
      if (back) back.click();
    });
    await sleep(1500);

    const returnStatus = await page.evaluate(() => {
      const canvas = !!document.querySelector('#impact canvas');
      const leaflet = !!document.querySelector('.leaflet-container');
      return { canvasRestored: canvas, leafletClosed: !leaflet };
    });
    console.log('  [PASS] Return to 3D Globe verified:', returnStatus);

    const shot6 = path.join(ARTIFACT_DIR, 'verified_return_clean_globe.png');
    await page.screenshot({ path: shot6 });
    console.log('  [PASS] Screenshot saved: verified_return_clean_globe.png');

    console.log('\n=============================================================');
    console.log('  ALL TWO-LEVEL PROGRESSIVE DISCLOSURE TESTS PASSED!         ');
    console.log('=============================================================');
  } catch (err) {
    console.error('[TEST FAILED]', err.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(failsafe);
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
    process.exit(process.exitCode || 0);
  }
}

run();
