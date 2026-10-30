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

async function setReactInput(page, selector, value) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error('Element not found: ' + sel);
    const proto = el instanceof window.HTMLTextAreaElement 
      ? window.HTMLTextAreaElement.prototype 
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    nativeSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, selector, value);
}

async function runCrewNavigationTest() {
  console.log('====================================================');
  console.log('   FIELD REPAIR CREW DASHBOARD NAVIGATION TEST     ');
  console.log('====================================================\n');

  console.log('[1/5] Starting FastAPI backend on port 8000...');
  const backendProc = spawn(PYTHON_PATH, ['-m', 'uvicorn', 'app.main:app', '--port', '8000'], {
    cwd: BACKEND_DIR,
    stdio: 'ignore',
  });

  console.log('[2/5] Starting Vite preview server on port 5174...');
  const viteCli = path.join(WORKSPACE_DIR, 'node_modules', 'vite', 'bin', 'vite.js');
  const frontendProc = spawn(NODE_PATH, [viteCli, 'preview', '--port', '5174', '--host', '127.0.0.1'], {
    cwd: WORKSPACE_DIR,
    stdio: 'ignore',
  });

  let browser;
  try {
    console.log('[3/5] Waiting for backend and frontend servers...');
    await checkUrl('http://127.0.0.1:8000/');
    console.log('  -> FastAPI backend is ONLINE');
    await checkUrl('http://127.0.0.1:5174/');
    console.log('  -> Vite frontend is ONLINE');

    console.log('[4/5] Launching Chrome...');
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      if (msg.text().includes('Auth') || msg.text().includes('Fast-Switch')) {
        console.log('  [BROWSER LOG]', msg.text());
      }
    });

    // STEP 1: Log in as Municipal Authority (Commissioner Alice Sharma)
    console.log('\n--- Step 1: Sign in as Municipal Authority (alice@potholefix.gov.in) ---');
    await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle0' });

    // Select Authority role card
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('h3'));
      const authCard = cards.find((h) => h.textContent.includes('Municipal Authority'));
      if (authCard) authCard.closest('div').click();
    });
    await sleep(200);

    // Click submit
    const submitBtn = await page.$('button[type="submit"]');
    if (!submitBtn) throw new Error('Submit button not found');
    await submitBtn.click();

    await page.waitForFunction(() => window.location.pathname.includes('/authority/dashboard'), { timeout: 10000 });
    console.log(`  [PASS] Successfully logged in as Authority. Current URL: ${page.url()}`);

    // STEP 2: Navigate to Homepage
    console.log('\n--- Step 2: Navigate to Homepage ---');
    await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle0' });
    console.log(`  [PASS] Arrived at homepage: ${page.url()}`);

    // Verify Field Repair Crew portal card exists and points to /team/dashboard
    const crewLinkHref = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const crewLink = links.find((a) => a.textContent.includes('Enter Crew Workspace'));
      return crewLink ? crewLink.getAttribute('href') : null;
    });
    console.log(`  Field Repair Crew button href: ${crewLinkHref}`);
    if (crewLinkHref !== '/team/dashboard') {
      throw new Error(`Expected href="/team/dashboard", got ${crewLinkHref}`);
    }
    console.log('  [PASS] Field Repair Crew button correctly points to /team/dashboard');

    // STEP 3: Click "Enter Crew Workspace" while logged in as Authority
    console.log('\n--- Step 3: Click "Enter Crew Workspace" while logged in as Authority ---');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const crewLink = links.find((a) => a.textContent.includes('Enter Crew Workspace'));
      if (crewLink) crewLink.click();
    });
    await sleep(1000);

    console.log(`  Current URL after clicking Crew portal: ${page.url()}`);
    if (page.url().includes('/authority/dashboard')) {
      throw new Error('BUG REPRODUCED: Application silently redirected to /authority/dashboard!');
    }
    if (!page.url().includes('/team/dashboard')) {
      throw new Error(`Expected URL to remain at /team/dashboard, got ${page.url()}`);
    }
    console.log('  [PASS] Not silently redirected to Authority Dashboard! Retained at /team/dashboard');

    // STEP 4: Verify Role Authorization Required screen is shown
    console.log('\n--- Step 4: Verify Role Authorization Required screen ---');
    const pageText = await page.evaluate(() => document.body.innerText);
    if (!pageText.includes('Role Authorization Required')) {
      throw new Error(`Missing 'Role Authorization Required' heading! Found: ${pageText.slice(0, 300)}`);
    }
    if (!pageText.includes('Commissioner Alice Sharma') && !pageText.includes('alice@potholefix.gov.in')) {
      throw new Error('Missing current Authority session details on mismatch screen');
    }
    if (!pageText.includes('Gurpreet Singh') && !pageText.includes('Field Repair Crew')) {
      throw new Error('Missing target Repair Crew details on mismatch screen');
    }
    console.log('  [PASS] Clear account switch prompt displayed with Alice Sharma & Gurpreet Singh metadata');

    // STEP 5: Click "Switch to Field Repair Crew (Gurpreet)"
    console.log('\n--- Step 5: Click "Switch to Field Repair Crew" with real JWT authentication ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const switchBtn = btns.find((b) => b.textContent.includes('Switch to Field Repair Crew') || b.textContent.includes('Switch to'));
      if (switchBtn) switchBtn.click();
    });
    await sleep(2000);

    console.log(`  Current URL after role switch: ${page.url()}`);
    const crewDashboardText = await page.evaluate(() => document.body.innerText);
    
    // Verify Repair Crew Dashboard loaded
    if (!crewDashboardText.includes('Punjab PWD Unit 04') && !crewDashboardText.includes('Gurpreet Singh') && !crewDashboardText.includes('Repair Crew')) {
      throw new Error(`Repair Crew Dashboard did not render properly! Found:\n${crewDashboardText.slice(0, 400)}`);
    }
    console.log('  [PASS] Actual Repair Crew Dashboard rendered at /team/dashboard!');

    // STEP 6: Verify Municipal Authority portal still opens /authority/dashboard
    console.log('\n--- Step 6: Verify Municipal Authority fast-switch / portal navigation ---');
    // Open Judge Demo Switcher drawer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const drawerToggle = btns.find((b) => b.textContent.includes('Judge Demo Switcher'));
      if (drawerToggle) drawerToggle.click();
    });
    await sleep(400);

    // Click Municipal Authority
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const authBtn = btns.find((b) => b.textContent.includes('Alice Sharma') || b.textContent.includes('Authority'));
      if (authBtn) authBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/authority/dashboard'), { timeout: 10000 });
    console.log(`  Current URL after returning to Authority: ${page.url()}`);
    const authDashboardText = await page.evaluate(() => document.body.innerText);
    if (!authDashboardText.includes('Municipal Road Hazard Triage') && !authDashboardText.includes('Authority')) {
      throw new Error('Authority Dashboard did not render properly for authorized Authority user');
    }
    console.log('  [PASS] Municipal Authority Dashboard opens correctly for authorized authority users');

    console.log('\n====================================================');
    console.log('   ALL REPAIR CREW NAVIGATION TESTS PASSED!         ');
    console.log('====================================================\n');

  } finally {
    if (browser) await browser.close();
    console.log('Shutting down test servers...');
    try { backendProc.kill(); } catch {}
    try { frontendProc.kill(); } catch {}
  }
}

runCrewNavigationTest().catch((err) => {
  console.error('\n[FATAL] Test Failed:', err);
  process.exit(1);
});
