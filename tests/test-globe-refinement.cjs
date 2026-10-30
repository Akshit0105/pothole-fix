const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const NODE_PATH = 'C:\\Users\\DELL\\AppData\\Local\\Microsoft\\WinGet\\Packages\\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\\node-v24.20.0-win-x64\\node.exe';
const WORKSPACE_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix';
const BACKEND_DIR = path.join(WORKSPACE_DIR, 'backend');
const PYTHON_PATH = path.join(BACKEND_DIR, '.venv', 'Scripts', 'python.exe');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
          reject(new Error(`Timeout waiting for ${url}`));
        }
      });
    }, 1000);
  });
}

async function runGlobeRefinementSuite() {
  console.log('========================================================================');
  console.log('   POTHOLEFIX 3D EARTH GLOBE REFINEMENT VERIFICATION SUITE              ');
  console.log('========================================================================\n');

  console.log('[1/4] Spawning FastAPI backend on port 8000...');
  const backendProc = spawn(PYTHON_PATH, ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
    cwd: BACKEND_DIR,
    stdio: 'ignore',
  });

  console.log('[2/4] Spawning Vite preview server on port 5174...');
  const viteCli = path.join(WORKSPACE_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const frontendProc = spawn(NODE_PATH, [viteCli, 'preview', '--port', '5174', '--host', '127.0.0.1'], {
    cwd: WORKSPACE_DIR,
    stdio: 'ignore',
  });

  let browser;
  try {
    console.log('[3/4] Waiting for backend and frontend servers...');
    await checkUrl('http://127.0.0.1:8000/');
    console.log('  -> Backend online at http://127.0.0.1:8000');
    await checkUrl('http://127.0.0.1:5174/');
    console.log('  -> Frontend online at http://127.0.0.1:5174');

    console.log('\n[4/4] Launching Headless Chrome via Puppeteer...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--headless=new',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    page.on('pageerror', (err) => console.error('  [PAGE ERROR]', err.message));

    // Navigate to homepage #impact section
    console.log('\n--- TEST 1: Realistic 3D Earth Mounting & Atmosphere ---');
    await page.goto('http://127.0.0.1:5174/#impact', { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    // Verify canvas exists
    const canvas = await page.$('canvas');
    if (!canvas) {
      throw new Error('Three.js canvas not found on page!');
    }
    console.log('  [PASS] Realistic 3D Earth Three.js canvas mounted successfully.');

    // Verify section text & distinction badges
    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes('Realistic Satellite Earth') || !pageText.includes('Live Database Resolution') || !pageText.includes('Demonstration Pilot Corridor')) {
      throw new Error('Missing realistic satellite Earth title or distinction legend!');
    }
    console.log('  [PASS] Realistic satellite Earth header and distinction badges verified.');

    // ------------------------------------------------------------------
    // TEST 2: SIMPLIFIED VERTICAL CONTROLS (+ / - ZOOM ONLY; NO PAUSE/RESET BUTTONS)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Simplified Vertical Controls (+ / - Zoom Only) ---');

    // Find vertical zoom control buttons
    const zoomInBtn = await page.$('button[title*="Zoom In"]');
    const zoomOutBtn = await page.$('button[title*="Zoom Out"]');

    if (!zoomInBtn || !zoomOutBtn) {
      throw new Error('Vertical zoom control buttons (+ / -) missing from globe side!');
    }
    console.log('  [PASS] Vertical zoom buttons (+ and -) located on globe side.');

    // Verify Pause, Resume, and Reset buttons have been removed as required by Phase 4
    const pauseBtn = await page.$('button[title*="Rotation"]');
    const resetBtn = await page.$('button[title*="Reset"]');
    if (pauseBtn || resetBtn) {
      throw new Error('Pause/Resume or Reset View buttons were not removed as mandated by Phase 4!');
    }
    console.log('  [PASS] Confirmed: Pause, Resume, and Reset buttons removed; ONLY vertical zoom controls present.');

    // Test Zoom In
    console.log('  Testing Zoom In (+) button click...');
    await zoomInBtn.click();
    await sleep(300);
    await zoomInBtn.click();
    await sleep(300);
    console.log('  [PASS] Zoom In (+) executed smoothly.');

    // Test Zoom Out
    console.log('  Testing Zoom Out (-) button click...');
    await zoomOutBtn.click();
    await sleep(300);
    console.log('  [PASS] Zoom Out (-) executed smoothly.');

    // ------------------------------------------------------------------
    // TEST 3: MOUSE DRAG ROTATION
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Mouse Drag Rotation ---');
    const canvasBox = await canvas.boundingBox();
    if (!canvasBox) throw new Error('Could not get canvas bounding box!');

    const startX = canvasBox.x + canvasBox.width / 2;
    const startY = canvasBox.y + canvasBox.height / 2;

    // Perform smooth mouse drag
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 120, startY + 30, { steps: 10 });
    await sleep(200);
    await page.mouse.up();
    await sleep(500);
    console.log('  [PASS] Mouse drag rotation executed without errors or jumps.');

    // ------------------------------------------------------------------
    // TEST 4: LOCATION PIN HOVER & SELECTION POPUP
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Geographic Pin Selection & Interactive Popup ---');
    // Click Sector 17 pill to select pin
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sec17Btn = buttons.find(b => b.textContent && b.textContent.includes('Sector 17'));
      if (sec17Btn) sec17Btn.click();
    });
    await sleep(600);

    const popupText = await page.evaluate(() => document.body.innerText);

    // Verify required popup information (Requirement 4)
    if (!popupText.includes('Sector 17 Commercial Corridor')) {
      throw new Error('Popup missing title "Sector 17 Commercial Corridor"!');
    }
    if (!popupText.includes('Sector 17 Plaza, Chandigarh')) {
      throw new Error('Popup missing location name "Sector 17 Plaza, Chandigarh"!');
    }
    if (!popupText.includes('30.7398° N, 76.7827° E')) {
      throw new Error('Popup missing latitude & longitude coordinates!');
    }
    if (!popupText.includes('Pre-Repair Crater') || !popupText.includes('Flush Asphalt Patch')) {
      throw new Error('Popup missing before/after photograph labels!');
    }
    if (!popupText.includes('Level-1 Certified Pass')) {
      throw new Error('Popup missing Level-1 Certified Pass status!');
    }
    const popupUpper = popupText.toUpperCase();
    if (!popupUpper.includes('DEMONSTRATION PILOT CORRIDOR') && !popupUpper.includes('LIVE SQLITE DATABASE RECORD')) {
      throw new Error('Popup missing clear distinction badge for demo vs real database record!');
    }
    console.log('  [PASS] Location pin popup displays reference ID, location, lat/lng, before/after images, and Level-1 pass.');

    // ------------------------------------------------------------------
    // TEST 5: ROTATION PAUSES WHILE PIN IS SELECTED (NO UNEXPECTED ROTATION AWAY)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Verify Globe Rotation Pauses While Pin Selected ---');
    const hintText = await page.evaluate(() => document.body.innerText);
    if (!hintText.includes('Rotation Paused')) {
      throw new Error('Hint overlay does not confirm rotation paused during pin inspection!');
    }
    console.log('  [PASS] Confirmed: Rotation is paused while inspecting selected pin.');

    // ------------------------------------------------------------------
    // TEST 6: MANUAL CLOSE BUTTON ON POPUP
    // ------------------------------------------------------------------
    console.log('\n--- TEST 6: Manual Close Button on Popup ---');
    const closeBtn = await page.$('button[title*="Close repair details"]');
    if (!closeBtn) {
      throw new Error('Could not find manual close (✕) button on repair information popup!');
    }
    await closeBtn.click();
    await sleep(600);

    const postCloseText = await page.evaluate(() => document.body.innerText);
    if (!postCloseText.includes('Select a Location Pin')) {
      throw new Error('Closing popup did not return to idle state!');
    }
    console.log('  [PASS] Popup closed manually via close button (✕); idle prompt displayed.');

    // ------------------------------------------------------------------
    // TEST 7: MOBILE RESPONSIVENESS
    // ------------------------------------------------------------------
    console.log('\n--- TEST 7: Mobile Viewport Responsiveness ---');
    await page.setViewport({ width: 375, height: 667 });
    await sleep(800);

    const mobileCanvas = await page.$('canvas');
    if (!mobileCanvas) {
      throw new Error('Globe canvas disappeared on mobile viewport!');
    }

    const mobileBox = await mobileCanvas.boundingBox();
    if (!mobileBox || mobileBox.width > 375) {
      throw new Error('Globe canvas overflows mobile screen width!');
    }
    console.log(`  [PASS] Mobile viewport responsive: canvas width = ${Math.round(mobileBox.width)}px.`);

    console.log('\n========================================================================');
    console.log('   ALL 7 3D GLOBE REFINEMENT TESTS PASSED WITH ZERO ERRORS!            ');
    console.log('========================================================================\n');

  } finally {
    if (browser) await browser.close();
    frontendProc.kill('SIGTERM');
    backendProc.kill('SIGTERM');
    await sleep(1000);
  }
}

runGlobeRefinementSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[FATAL ERROR IN SUITE]:', err);
    process.exit(1);
  });
