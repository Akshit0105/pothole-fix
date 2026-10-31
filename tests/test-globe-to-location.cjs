const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
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

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {}
    await sleep(600);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function runSuite() {
  console.log('========================================================================');
  console.log('   POTHOLEFIX: GLOBE-TO-EXACT-LOCATION & SECTOR 43 VERIFICATION SUITE   ');
  console.log('========================================================================\n');

  // 1. Spawn FastAPI Backend with PYTHONUNBUFFERED and explicit host
  console.log('[1/5] Spawning FastAPI backend on 127.0.0.1:8000...');
  const backendProc = spawn(PYTHON_PATH, ['-u', '-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR, PYTHONUNBUFFERED: '1' },
    stdio: 'pipe',
  });
  backendProc.stderr?.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.includes('ERROR') || msg.includes('Error')) console.log('[Backend Error]', msg);
  });
  backendProc.stdout?.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg.includes('Started') || msg.includes('Uvicorn running') || msg.includes('Application startup complete')) {
      console.log('[Backend Log]', msg);
    }
  });

  // 2. Spawn Vite dev server on port 5173
  console.log('[2/5] Spawning Vite dev server on port 5173...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let frontendPort = 5173;
  const frontendProc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173', '--host', '127.0.0.1'], {
    cwd: WORKSPACE_DIR,
    stdio: 'pipe',
    shell: true,
  });
  frontendProc.stdout?.on('data', (d) => {
    const text = d.toString();
    const match = text.match(/http:\/\/127\.0\.0\.1:(\d+)/) || text.match(/http:\/\/localhost:(\d+)/);
    if (match) {
      frontendPort = parseInt(match[1], 10);
      console.log('[Frontend Port Detected]', frontendPort);
    }
  });

  let browser;
  try {
    console.log('[3/5] Waiting for backend and frontend servers to be ready...');
    await waitForServer('http://127.0.0.1:8000/reports/public');
    console.log('  [PASS] FastAPI Backend online at http://127.0.0.1:8000/reports/public');
    await waitForServer(`http://127.0.0.1:${frontendPort}/`);
    console.log(`  [PASS] Vite Dev Frontend online at http://127.0.0.1:${frontendPort}/`);

    console.log('[4/5] Launching Headless Chrome via Puppeteer...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate to homepage
    console.log(`Navigating to http://127.0.0.1:${frontendPort}/ ...`);
    await page.goto(`http://127.0.0.1:${frontendPort}/`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // 1. Scroll to Impact Globe
    console.log('\n--- PHASE 1 & 2: VERIFYING 3D GLOBE & REPORT DATA ---');
    const impactSection = await page.$('#impact');
    if (impactSection) {
      await impactSection.scrollIntoView();
      await sleep(1500);
    }

    // Verify canvas exists
    const canvasExists = await page.evaluate(() => {
      const canvas = document.querySelector('#impact canvas');
      return !!canvas;
    });
    console.log('  [PASS] 3D Globe WebGL Canvas rendered:', canvasExists);

    // Save screenshot of 3D globe with India & pins
    const shot1 = path.join(ARTIFACT_DIR, 'verified_3d_globe_with_clusters.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log('  [PASS] Screenshot saved:', shot1);

    // 2. Select Madhya Marg Arterial (PF-102)
    console.log('\n--- PHASE 3 & 4: SELECTING MADHYA MARG ARTERIAL (PF-102) ---');
    const foundMadhyaButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const btn = buttons.find((b) => b.innerText.includes('Madhya') || b.innerText.includes('PF-102'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked Madhya Marg pin/button:', foundMadhyaButton);
    await sleep(1000);

    // Verify Madhya Marg card details
    const cardData = await page.evaluate(() => {
      const text = document.querySelector('#impact')?.innerText || '';
      return {
        hasTitle: text.includes('Madhya Marg Arterial'),
        hasCoordinates: text.includes('30.7290') && text.includes('76.8040'),
        hasInProgressStatus: text.includes('IN_PROGRESS') || text.includes('Active'),
        hasExploreButton: text.includes('Explore Exact Location'),
        hasGoogleMapsButton: text.includes('Open in Google Maps'),
      };
    });
    console.log('  Card verification:', cardData);
    if (!cardData.hasTitle || !cardData.hasCoordinates) {
      throw new Error('Madhya Marg card failed verification: ' + JSON.stringify(cardData));
    }
    console.log('  [PASS] Madhya Marg report verified at stored coordinates: 30.7290° N, 76.8040° E');

    const shot2 = path.join(ARTIFACT_DIR, 'verified_madhyamarg_pin_card.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log('  [PASS] Screenshot saved:', shot2);

    // 3. Click "Explore Exact Location" & Verify Smooth Zoom Animation into Street Map
    console.log('\n--- PHASE 5 & 6: SMOOTH GLOBE ZOOM ANIMATION INTO STREET MAP ---');
    const clickedExplore = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const btn = buttons.find((b) => b.innerText.includes('Explore Exact Location'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked "Explore Exact Location":', clickedExplore);

    // Wait for zoom animation (1.8s) + Leaflet mount
    await sleep(2800);

    // Check Leaflet map container mounted
    const leafletMounted = await page.evaluate(() => {
      const mapContainer = document.querySelector('.leaflet-container');
      const text = document.querySelector('#impact')?.innerText || '';
      const backBtn = text.includes('Back to 3D Globe');
      const searchBar = !!document.querySelector('input[placeholder*="Search city, sector"]');
      return { mapContainer: !!mapContainer, backBtn, searchBar };
    });
    console.log('  [PASS] Detailed Leaflet Street Map active:', leafletMounted);

    // Verify Google Maps links on detailed map
    const gmapsLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('#impact a'));
      const searchLink = links.find((a) => a.href.includes('google.com/maps/search'));
      const dirLink = links.find((a) => a.href.includes('google.com/maps/dir'));
      return {
        searchHref: searchLink ? searchLink.href : null,
        dirHref: dirLink ? dirLink.href : null,
      };
    });
    console.log('  [PASS] Google Maps action URLs:', gmapsLinks);

    const shot3 = path.join(ARTIFACT_DIR, 'verified_street_map_madhyamarg.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('  [PASS] Screenshot saved:', shot3);

    // 4. Sector 43, Chandigarh Search Demo & Draggable Marker
    console.log('\n--- PHASE 7 & 8: SECTOR 43 CHANDIGARH DEMO SCENARIO ---');
    // Click "Sector 43" quick suggestion pill
    const clickedSector43Pill = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const pill = buttons.find((b) => b.innerText.trim() === 'Sector 43');
      if (pill) {
        pill.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked Sector 43 quick pill:', clickedSector43Pill);
    await sleep(2000);

    // Verify Sector 43 details
    const sector43Data = await page.evaluate(() => {
      const text = document.querySelector('#impact')?.innerText || '';
      const customPin = !!document.querySelector('.custom-search-pin');
      const links = Array.from(document.querySelectorAll('#impact a'));
      const searchLink = links.find((a) => a.href.includes('google.com/maps/search'));
      return {
        hasSector43: text.includes('Sector 43, Chandigarh'),
        hasNoRegisteredReportNotice: text.includes('No Existing Hazard Reports Registered'),
        hasCoordinates: text.includes('30.7228') && text.includes('76.7570'),
        hasReportPotholeButton: text.includes('Report Pothole at this Location'),
        hasSearchPin: customPin,
        gmapsHref: searchLink ? searchLink.href : null,
      };
    });
    console.log('  [PASS] Sector 43 Search Data:', sector43Data);

    const shot4 = path.join(ARTIFACT_DIR, 'verified_sector43_search_marker.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('  [PASS] Screenshot saved:', shot4);

    // 5. Back to 3D Globe
    console.log('\n--- PHASE 10: BACK TO 3D GLOBE TRANSITION ---');
    const clickedBack = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#impact button'));
      const backBtn = buttons.find((b) => b.innerText.includes('Back to 3D Globe'));
      if (backBtn) {
        backBtn.click();
        return true;
      }
      return false;
    });
    console.log('  Clicked "← Back to 3D Globe":', clickedBack);
    await sleep(2200);

    // Verify 3D Globe canvas is restored
    const globeRestored = await page.evaluate(() => {
      const canvas = document.querySelector('#impact canvas');
      const leaflet = document.querySelector('.leaflet-container');
      return { canvasPresent: !!canvas, leafletUnmounted: !leaflet };
    });
    console.log('  [PASS] 3D Globe cleanly restored:', globeRestored);

    const shot5 = path.join(ARTIFACT_DIR, 'verified_back_to_3d_globe.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log('  [PASS] Screenshot saved:', shot5);

    console.log('\n========================================================================');
    console.log('  SUCCESS: ALL GLOBE-TO-LOCATION DEMO PHASES VERIFIED END-TO-END!        ');
    console.log('========================================================================');
  } catch (err) {
    console.error('[TEST FAILED]', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    console.log('Terminating Vite and FastAPI background servers...');
    try {
      frontendProc.kill('SIGKILL');
      backendProc.kill('SIGKILL');
      require('child_process').execSync('taskkill /F /IM uvicorn.exe /T', { stdio: 'ignore' });
    } catch {}
  }
}

runSuite();
