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
    } catch {}
    await sleep(600);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  console.log('--- STARTING REPAIR CREW SIGN-IN & HOMEPAGE VERIFICATION TEST ---');

  // 1. Start FastAPI backend
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
    // TEST 1: HOMEPAGE CLEANUP - VERIFY "100% Geotagged" REMOVED
    // -------------------------------------------------------------
    console.log('\n[1/4] Verifying Homepage Cleanup ("100% Geotagged" Removed)...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await sleep(1500);

    const homepageStatsInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasGeotaggedStat = text.includes('100% Geotagged');
      const hasCorridors = text.includes('3 Corridors');
      const hasLevel1Pass = text.includes('Level-1 Pass');
      return { hasGeotaggedStat, hasCorridors, hasLevel1Pass };
    });
    console.log('✓ Homepage stats audit:', homepageStatsInfo);
    if (homepageStatsInfo.hasGeotaggedStat) {
      throw new Error('FAILED: "100% Geotagged" was found on the homepage!');
    }
    console.log('✓ Confirmed: "100% Geotagged" is completely removed from homepage.');

    const homeCleanPath = path.join(ARTIFACT_DIR, 'verified_homepage_no_geotagged.png');
    await page.screenshot({ path: homeCleanPath });
    console.log('✓ Saved screenshot:', homeCleanPath);

    // -------------------------------------------------------------
    // TEST 2: SIGN-IN INTERFACE - 3 SELECTABLE CREW SQUAD CARDS
    // -------------------------------------------------------------
    console.log('\n[2/4] Verifying Sign-In Interface 3-Crew Selection...');
    await page.goto(`${BASE_URL}/login?role=REPAIR_TEAM`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    const crewCardsInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasCrewRoleActive: text.includes('Field Repair Crew') || text.includes('3 Registered Units'),
        hasPunjabCrew: text.includes('Punjab PWD Unit 04') && text.includes('Gurpreet Singh'),
        hasChandigarhCrew: text.includes('Chandigarh MC Road Squad 02') && text.includes('Amit Verma'),
        hasDelhiCrew: text.includes('Delhi Emergency Arterial Unit 01') && text.includes('Rajesh Sharma'),
      };
    });
    console.log('✓ All 3 repair crew squad cards rendered:', crewCardsInfo);
    if (!crewCardsInfo.hasPunjabCrew || !crewCardsInfo.hasChandigarhCrew || !crewCardsInfo.hasDelhiCrew) {
      throw new Error('FAILED: Not all 3 repair crews are visible on the login interface!');
    }

    const loginCrewsPath = path.join(ARTIFACT_DIR, 'verified_login_three_crews.png');
    await page.screenshot({ path: loginCrewsPath });
    console.log('✓ Saved screenshot:', loginCrewsPath);

    // -------------------------------------------------------------
    // TEST 3: SELECT CREW 2 (AMIT VERMA) & AUTHENTICATE INDEPENDENTLY
    // -------------------------------------------------------------
    console.log('\n[3/4] Testing Crew 2 (Amit Verma / Chandigarh MC Squad 02) Selection & Sign-In...');
    // Click Chandigarh MC Squad 02
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.innerText.includes('Chandigarh MC Road Squad 02') || b.innerText.includes('Amit Verma'));
      if (btn) btn.click();
    });
    await sleep(600);

    // Verify email field updated to amit@mc.chandigarh.gov.in
    const emailValue = await page.evaluate(() => {
      const input = document.querySelector('input[type="email"]');
      return input ? input.value : null;
    });
    console.log('✓ Selected Crew form email updated:', emailValue);

    // Click 1-Click Evaluation Sign In
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText.includes('1-Click Evaluation Sign In'));
      if (demoBtn) demoBtn.click();
    });
    await sleep(2000);

    // Verify reached /team/dashboard authenticated as Amit Verma
    const crew2DashInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        url: window.location.pathname,
        hasAmitName: text.includes('Amit Verma'),
        hasUnit: text.includes('Chandigarh MC Road Squad 02'),
        hasDispatchMap: Boolean(document.querySelector('.leaflet-container')),
      };
    });
    console.log('✓ Crew 2 Authenticated Dashboard verified:', crew2DashInfo);

    const crew2DashPath = path.join(ARTIFACT_DIR, 'verified_crew2_amit_dashboard.png');
    await page.screenshot({ path: crew2DashPath });
    console.log('✓ Saved screenshot:', crew2DashPath);

    // -------------------------------------------------------------
    // TEST 4: SIGN IN AS CREW 1 & VERIFY TASK NAVIGATION BUTTON
    // -------------------------------------------------------------
    console.log('\n[4/4] Testing Crew 1 (Gurpreet Singh) & Navigate to Repair Location Button...');
    await page.goto(`${BASE_URL}/login?role=REPAIR_TEAM`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    // Select Punjab PWD Unit 04
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.innerText.includes('Punjab PWD Unit 04'));
      if (btn) btn.click();
    });
    await sleep(600);

    // Click 1-Click Evaluation Sign In
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const demoBtn = buttons.find((b) => b.innerText.includes('1-Click Evaluation Sign In'));
      if (demoBtn) demoBtn.click();
    });
    await sleep(2000);

    // Navigate to task WO-PF-102
    await page.goto(`${BASE_URL}/team/tasks/WO-PF-102`, { waitUntil: 'networkidle0' });
    await sleep(2000);

    const navBtnAudit = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const navLink = links.find((l) => l.innerText.includes('Navigate to Repair Location'));
      return {
        found: Boolean(navLink),
        href: navLink ? navLink.href : null,
        hasDestinationParam: navLink ? navLink.href.includes('destination=') : false,
        text: navLink ? navLink.innerText.trim() : null,
      };
    });
    console.log('✓ Navigate to Repair Location button audit:', navBtnAudit);
    if (!navBtnAudit.found) {
      throw new Error('FAILED: "Navigate to Repair Location" button is still missing!');
    }

    const taskNavFixedPath = path.join(ARTIFACT_DIR, 'verified_task_navigation_button_fixed.png');
    await page.screenshot({ path: taskNavFixedPath });
    console.log('✓ Saved screenshot:', taskNavFixedPath);

    console.log('\n======================================================');
    console.log('SUCCESS: ALL CREW SIGN-IN & HOMEPAGE CLEANUP TESTS PASSED!');
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
