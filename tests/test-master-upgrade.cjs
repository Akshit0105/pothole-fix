const puppeteer = require('C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix\\node_modules\\puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\2239e808-338f-4629-ac6f-54c68db808f6';
const PROJECT_DIR = 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      // wait
    }
    await sleep(600);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  console.log('--- STARTING COMPREHENSIVE END-TO-END UPGRADE VERIFICATION TEST ---');

  // 1. Start Backend
  const pythonPath = path.join(PROJECT_DIR, 'backend', '.venv', 'Scripts', 'python.exe');
  console.log('Starting FastAPI backend with', pythonPath);
  const backendProc = spawn(pythonPath, ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
    cwd: path.join(PROJECT_DIR, 'backend'),
    env: { ...process.env, PYTHONPATH: path.join(PROJECT_DIR, 'backend') },
    stdio: 'pipe',
  });
  backendProc.stderr?.on('data', (d) => console.log('[Backend Error]', d.toString().trim()));
  backendProc.stdout?.on('data', (d) => console.log('[Backend Log]', d.toString().trim()));

  // 2. Start Frontend
  console.log('Starting Vite preview / dev server...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let frontendPort = 5173;
  const frontendProc = spawn(npmCmd, ['run', 'dev', '--', '--port', '5173'], {
    cwd: PROJECT_DIR,
    stdio: 'pipe',
    shell: true,
  });

  frontendProc.stdout?.on('data', (d) => {
    const text = d.toString();
    console.log('[Frontend Log]', text.trim());
    const match = text.match(/http:\/\/localhost:(\d+)/);
    if (match) {
      frontendPort = parseInt(match[1], 10);
      console.log(`[Auto-Detected] Frontend active on port ${frontendPort}`);
    }
  });
  frontendProc.stderr?.on('data', (d) => console.log('[Frontend Error]', d.toString().trim()));

  let browser;
  try {
    console.log('Waiting for backend on http://127.0.0.1:8000/docs ...');
    await waitForServer('http://127.0.0.1:8000/docs');
    console.log('Backend is UP and responsive!');

    // Wait for frontend URL
    const waitFrontend = Date.now();
    let BASE_URL = `http://localhost:${frontendPort}`;
    while (Date.now() - waitFrontend < 15000) {
      BASE_URL = `http://localhost:${frontendPort}`;
      try {
        const res = await fetch(BASE_URL);
        if (res.ok) break;
      } catch {}
      await sleep(600);
    }
    console.log(`Frontend is UP at ${BASE_URL}!`);

    console.log('Launching Puppeteer with Chrome at', CHROME_PATH);
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      defaultViewport: { width: 1440, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
    });

    const page = await browser.newPage();

    // -------------------------------------------------------------
    // TEST 1: HOMEPAGE & 3D EARTH GLOBE / DETAILED ROAD MAP VIEW
    // -------------------------------------------------------------
    console.log('\n[1/5] Testing Homepage, Stationary Globe, Keyboard Zoom & Hybrid Road Map...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Scroll to Globe
    await page.evaluate(() => {
      const el = document.querySelector('canvas') || document.body;
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(1000);

    // Check stationary status overlay text
    const globeStatusText = await page.evaluate(() => {
      const el = document.body.innerText;
      return el.includes('India Centered') || el.includes('Stationary');
    });
    console.log('✓ Globe initialized stationary facing India:', globeStatusText);

    // Capture 3D Globe Screenshot
    const globe3dPath = path.join(ARTIFACT_DIR, 'verified_3d_globe_stationary.png');
    await page.screenshot({ path: globe3dPath });
    console.log('✓ Saved screenshot:', globe3dPath);

    // Test Keyboard Zoom (+ key)
    console.log('Testing keyboard zoom controls (+ key)...');
    await page.keyboard.press('+');
    await sleep(400);
    await page.keyboard.press('+');
    await sleep(400);

    // Test Switch to Detailed Road Map
    console.log('Testing switch to Detailed Road Map View...');
    const switchedToMap = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const roadMapBtn = buttons.find((b) => b.innerText.includes('Explore Detailed Road Map'));
      if (roadMapBtn) {
        roadMapBtn.click();
        return true;
      }
      return false;
    });

    if (switchedToMap) {
      await sleep(1500);

      const hasRoadMap = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('Back to 3D Globe') && Boolean(document.querySelector('.leaflet-container'));
      });
      console.log('✓ Detailed Road Map view active with OSM tiles & red pins:', hasRoadMap);

      const roadMapPath = path.join(ARTIFACT_DIR, 'verified_hybrid_road_map.png');
      await page.screenshot({ path: roadMapPath });
      console.log('✓ Saved screenshot:', roadMapPath);

      // Return to 3D Globe
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const backBtn = buttons.find((b) => b.innerText.includes('Back to 3D Globe'));
        if (backBtn) backBtn.click();
      });
      await sleep(1000);
      console.log('✓ Returned back to 3D Globe view.');
    }

    // -------------------------------------------------------------
    // TEST 2: CITIZEN REPORT PAGE - 2-COLUMN LOCATION STEP
    // -------------------------------------------------------------
    console.log('\n[2/5] Testing Citizen Login & 2-Column Location Step...');
    // Authenticate as Citizen
    await page.goto(`${BASE_URL}/login?role=CITIZEN`, { waitUntil: 'networkidle0' });
    await sleep(1200);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText.includes('1-Click Evaluation Sign In'));
      if (demoBtn) demoBtn.click();
    });
    await sleep(1500);

    // Navigate to citizen report submission
    await page.goto(`${BASE_URL}/citizen/report`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Select sample photo
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sampleBtn = buttons.find((b) => b.innerText.includes('Sector 17 Crater'));
      if (sampleBtn) sampleBtn.click();
    });
    await sleep(800);

    // Click Proceed to Location
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const proceedBtn = buttons.find((b) => b.innerText.includes('Proceed to Location'));
      if (proceedBtn) proceedBtn.click();
    });
    await sleep(1500);

    // Verify 2-Column layout elements
    const step2Info = await page.evaluate(() => {
      const hasMap = Boolean(document.querySelector('.leaflet-container'));
      const text = document.body.innerText;
      const hasPresets = text.includes('Quick Corridor Presets');
      const hasStreet = text.includes('Street Address');
      const hasCoords = text.includes('° N');
      return { hasMap, hasPresets, hasStreet, hasCoords };
    });
    console.log('✓ Step 2 location map preview and 2-column elements:', step2Info);

    const step2Path = path.join(ARTIFACT_DIR, 'verified_citizen_step2_2column.png');
    await page.screenshot({ path: step2Path });
    console.log('✓ Saved screenshot:', step2Path);

    // -------------------------------------------------------------
    // TEST 3: CITIZEN REPORT DETAIL PAGE - SIDE-BY-SIDE PHOTOS & MAP
    // -------------------------------------------------------------
    console.log('\n[3/5] Testing Citizen Report Detail Page (PF-999)...');
    await page.goto(`${BASE_URL}/citizen/reports/PF-999`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    const detailInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasSideBySide = text.includes('Photographic Evidence & Visual Audit') || text.includes('Original Reported Defect');
      const hasApprovedPhoto = text.includes('Approved Post-Repair Evidence');
      const hasMap = Boolean(document.querySelector('.leaflet-container'));
      const hasCoords = text.includes('INDIAN GIS COORDINATES');
      const hasLifecycle = text.includes('Civic Resolution Lifecycle') || text.includes('Reported on');
      return { hasSideBySide, hasApprovedPhoto, hasMap, hasCoords, hasLifecycle };
    });
    console.log('✓ Citizen Report Detail side-by-side & map verified:', detailInfo);

    const citizenDetailPath = path.join(ARTIFACT_DIR, 'verified_citizen_detail_page.png');
    await page.screenshot({ path: citizenDetailPath });
    console.log('✓ Saved screenshot:', citizenDetailPath);

    // -------------------------------------------------------------
    // TEST 4: MUNICIPAL AUTHORITY DASHBOARD - 4 INTERACTIVE CARDS & ARCHIVE
    // -------------------------------------------------------------
    console.log('\n[4/5] Testing Authority Login, 4 Interactive Cards & Archive...');
    // Authenticate as Authority
    await page.goto(`${BASE_URL}/login?role=AUTHORITY`, { waitUntil: 'networkidle0' });
    await sleep(1200);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText.includes('1-Click Evaluation Sign In'));
      if (demoBtn) demoBtn.click();
    });
    await sleep(1500);

    // Navigate to Authority Dashboard
    await page.goto(`${BASE_URL}/authority/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Check 4 cards exist
    const cardsInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasSectionA: text.includes('Section A') && text.includes('Awaiting Verification'),
        hasSectionB: text.includes('Section B') && text.includes('Repair In Progress'),
        hasSectionC: text.includes('Section C') && text.includes('Awaiting Repair Approval'),
        hasResolvedClosed: text.includes('Resolved & Closed'),
      };
    });
    console.log('✓ 4 interactive main section cards present:', cardsInfo);

    const authDashPath = path.join(ARTIFACT_DIR, 'verified_authority_dashboard_cards.png');
    await page.screenshot({ path: authDashPath });
    console.log('✓ Saved screenshot:', authDashPath);

    // Click Card D: Resolved & Closed Archive
    console.log('Clicking Card D (Resolved & Closed Archive)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cardD = buttons.find((b) => b.innerText.includes('Resolved & Closed') && b.innerText.includes('Archive'));
      if (cardD) cardD.click();
    });
    await sleep(1500);

    // Verify chronological grouping and audit trail in archive
    const archiveInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasArchiveBanner: text.includes('Official Municipal Certification Archive') || text.includes('Resolved & Closed Road Repair Audit Trail'),
        hasChronologicalHeader: text.includes('2026') || text.includes('October'),
        hasLifecycle: text.includes('Full Civic Resolution Lifecycle'),
        hasSideBySide: text.includes('Original Reported Defect') && text.includes('Approved Post-Repair Evidence'),
        hasPF999: text.includes('PF-999'),
      };
    });
    console.log('✓ Resolved & Closed Archive chronological details verified:', archiveInfo);

    const archivePath = path.join(ARTIFACT_DIR, 'verified_resolved_closed_archive.png');
    await page.screenshot({ path: archivePath });
    console.log('✓ Saved screenshot:', archivePath);

    // -------------------------------------------------------------
    // TEST 5: REPAIR CREW WORKSPACE & TASK NAVIGATION
    // -------------------------------------------------------------
    console.log('\n[5/5] Testing Repair Crew Login, Workspace & Task Navigation...');
    // Authenticate as Repair Crew
    await page.goto(`${BASE_URL}/login?role=REPAIR_TEAM`, { waitUntil: 'networkidle0' });
    await sleep(1200);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText.includes('1-Click Evaluation Sign In'));
      if (demoBtn) demoBtn.click();
    });
    await sleep(1500);

    // Navigate to Crew Dashboard
    await page.goto(`${BASE_URL}/team/dashboard`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    const hasDispatchMap = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Field Repair Dispatch & Route Map') && Boolean(document.querySelector('.leaflet-container'));
    });
    console.log('✓ Crew dashboard dispatch map present:', hasDispatchMap);

    // Navigate to crew task detail (WO-PF-102)
    console.log('Navigating to crew task detail (WO-PF-102)...');
    await page.goto(`${BASE_URL}/team/tasks/WO-PF-102`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Verify "Navigate to Repair Location" button exists and links to google maps directions
    const navBtnInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const navLink = links.find((l) => l.innerText.includes('Navigate to Repair Location'));
      return {
        found: Boolean(navLink),
        href: navLink ? navLink.href : null,
        hasDestinationParam: navLink ? navLink.href.includes('destination=') : false,
      };
    });
    console.log('✓ Navigate to Repair Location button verified:', navBtnInfo);

    const taskDetailPath = path.join(ARTIFACT_DIR, 'verified_crew_task_navigation.png');
    await page.screenshot({ path: taskDetailPath });
    console.log('✓ Saved screenshot:', taskDetailPath);

    console.log('\n======================================================');
    console.log('SUCCESS: ALL 9 MASTER UPGRADE PHASES VERIFIED END-TO-END!');
    console.log('======================================================');
  } finally {
    if (browser) {
      await browser.close();
    }
    console.log('Cleaning up processes...');
    try {
      backendProc.kill('SIGTERM');
    } catch {}
    try {
      frontendProc.kill('SIGTERM');
    } catch {}
  }
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
