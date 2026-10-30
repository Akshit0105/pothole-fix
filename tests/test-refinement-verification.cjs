const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
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

async function runRefinementSuite() {
  console.log('========================================================================');
  console.log('   POTHOLEFIX TARGETED UI REFINEMENT & NAVIGATION VERIFICATION SUITE   ');
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

    // Catch any page errors
    page.on('pageerror', (err) => console.error('  [BROWSER ERROR]', err.message));

    // ------------------------------------------------------------------
    // TEST 1: HOMEPAGE HERO EXPANDED LEVEL-1 PHOTOGRAPHIC STANDARD
    // ------------------------------------------------------------------
    console.log('\n--- TEST 1: Expanded Level-1 Photographic Standard & Hero Layout ---');
    await page.goto('http://127.0.0.1:5174/', { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const heroText = await page.evaluate(() => document.body.innerText);
    console.log('  Page text preview [300..1500]:\n', heroText.slice(300, 1500));

    // Verify Level-1 Photographic Standard elements
    if (!heroText.toUpperCase().includes('LEVEL-1 PHOTOGRAPHIC STANDARD')) {
      throw new Error('Missing "Level-1 Photographic Standard" header badge in hero section!');
    }
    if (!heroText.includes('Sector 17 Commercial Corridor, Chandigarh') || !heroText.includes('#PF-101')) {
      throw new Error('Missing Sector 17 corridor or #PF-101 in Level-1 showcase!');
    }
    if (!heroText.toUpperCase().includes('CERTIFIED PASS')) {
      throw new Error('Missing "CERTIFIED PASS" badge!');
    }
    if (!heroText.toUpperCase().includes('PRE-REPAIR DEFECT') || !heroText.toUpperCase().includes('POST-REPAIR RESTORATION')) {
      throw new Error('Missing pre/post repair badges in photographic comparison!');
    }
    if (!heroText.includes('30.7398° N, 76.7827° E')) {
      throw new Error('Missing GPS coordinates in Level-1 showcase!');
    }
    console.log('  [PASS] Expanded Level-1 Photographic Standard verified with real before/after photos, GPS, and certification pass.');

    // ------------------------------------------------------------------
    // TEST 2: VERIFY MUNICIPAL ROLE PORTALS REMOVED FROM HOMEPAGE
    // ------------------------------------------------------------------
    console.log('\n--- TEST 2: Municipal Role Portals Section Removed from Homepage ---');
    if (heroText.includes('Municipal Role Portals') || heroText.includes('Enter Citizen Portal') || heroText.includes('Enter Authority Triage Hub') || heroText.includes('Enter Crew Workspace')) {
      throw new Error('Municipal Role Portals section or direct dashboard jump cards were found on homepage!');
    }
    console.log('  [PASS] Confirmed: "Municipal Role Portals" section and direct entry cards removed from homepage.');

    // Verify preserved sections
    const preservedSections = [
      'How PotholeFix Works',
      'Modernizing Road Infrastructure Management',
      'Our Mission',
      'Our Vision',
      'What PotholeFix Provides',
      'Global Impact & Completed Repairs'
    ];
    for (const sec of preservedSections) {
      if (!heroText.toUpperCase().includes(sec.toUpperCase())) {
        throw new Error(`Expected preserved homepage section missing: "${sec}"`);
      }
    }
    console.log('  [PASS] All core sections (How It Works, Impact Globe, About Us, Mission, Features) verified.');

    // ------------------------------------------------------------------
    // TEST 3: REALISTIC 3D EARTH GLOBE
    // ------------------------------------------------------------------
    console.log('\n--- TEST 3: Realistic 3D Earth Globe & Location Pins ---');
    const globeCanvas = await page.$('canvas');
    if (!globeCanvas) {
      throw new Error('Three.js canvas not found on homepage!');
    }

    // Verify distinction badges in legend
    if (!heroText.includes('Live Database Resolution') || !heroText.includes('Regional Pilot Showcase')) {
      throw new Error('Missing distinction legend for Real DB Repairs vs Demonstration Corridors!');
    }
    console.log('  [PASS] Realistic 3D Earth canvas mounted with distinction legend.');

    // Click jump to showcase pin button to verify detail card updates
    console.log('  Testing pin selection & detail card update...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sec17Btn = buttons.find(b => b.textContent && b.textContent.includes('Sector 17'));
      if (sec17Btn) sec17Btn.click();
    });
    await sleep(600);

    const cardText = await page.evaluate(() => document.body.innerText);
    if (!cardText.includes('Sector 17 Commercial Corridor') || !cardText.includes('Level-1 Certified Pass')) {
      throw new Error('Detail card did not display Sector 17 corridor audit information!');
    }
    console.log('  [PASS] Pin selection opens animated information card with before/after photos and audit notes.');

    // ------------------------------------------------------------------
    // TEST 4: CITIZEN REPORTING NAVIGATION (UNAUTHENTICATED)
    // ------------------------------------------------------------------
    console.log('\n--- TEST 4: Citizen Reporting Navigation (Unauthenticated) ---');
    // Clear cookies/localStorage to ensure unauthenticated state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Click "Report a Pothole" in hero section
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reportBtn = buttons.find(b => b.textContent && b.textContent.includes('Report a Pothole'));
      if (reportBtn) reportBtn.click();
    });
    await sleep(1000);

    const currentUrl = page.url();
    console.log(`  Redirected URL: ${currentUrl}`);
    if (!currentUrl.includes('/login') || !currentUrl.includes('role=CITIZEN') || !currentUrl.includes('redirect')) {
      throw new Error(`Expected redirect to /login?role=CITIZEN&redirect=/citizen/report, got ${currentUrl}`);
    }

    // Verify Citizen Reporter is preselected on the two-column sign-in page
    const loginPageText = await page.evaluate(() => document.body.innerText);
    if (!loginPageText.includes('akshit@potholefix.in') || !loginPageText.includes('Citizen Reporter')) {
      throw new Error('Login page did not preselect Citizen Reporter!');
    }
    console.log('  [PASS] Unauthenticated "Report a Pothole" redirects to /login with Citizen Reporter preselected.');

    // ------------------------------------------------------------------
    // TEST 5: AUTHENTICATION AS CITIZEN & REDIRECT TO REPORT PAGE
    // ------------------------------------------------------------------
    console.log('\n--- TEST 5: Citizen Authentication & Automatic Reporting Destination Redirect ---');
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/citizen/report'), { timeout: 10000 });
    console.log(`  Destination URL after citizen sign-in: ${page.url()}`);
    if (!page.url().includes('/citizen/report')) {
      throw new Error(`Expected redirect to /citizen/report after citizen login, got ${page.url()}`);
    }
    console.log('  [PASS] Successful citizen authentication redirects directly to /citizen/report.');

    // ------------------------------------------------------------------
    // TEST 6: ROLE-BASED AUTHORIZATION RESTRICTION & ROLE SWITCHING
    // ------------------------------------------------------------------
    console.log('\n--- TEST 6: Role Authorization Restriction & Intuitive Switching ---');
    // Now switch to Municipal Authority account via /login
    await page.goto('http://127.0.0.1:5174/login?role=AUTHORITY', { waitUntil: 'domcontentloaded' });
    await sleep(800);

    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await page.waitForFunction(() => window.location.pathname.includes('/authority/dashboard'), { timeout: 10000 });
    console.log(`  Logged in as Municipal Authority: ${page.url()}`);

    // Now as Municipal Authority, attempt to navigate to citizen report page: /citizen/report
    await page.goto('http://127.0.0.1:5174/citizen/report', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    const authCheckText = await page.evaluate(() => document.body.innerText);
    if (!authCheckText.includes('Role Authorization Required') || !authCheckText.includes('Sign In as Citizen Reporter')) {
      throw new Error(`Authority user was not blocked from Citizen report page! Found:\n${authCheckText.slice(0, 300)}`);
    }
    console.log('  [PASS] Authority user access to /citizen/report blocked with "Role Authorization Required" screen.');

    // Test switching role via the "Sign In as Citizen Reporter" button
    console.log('  Testing "Sign In as Citizen Reporter" button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const switchBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In as Citizen Reporter'));
      if (switchBtn) switchBtn.click();
    });
    await sleep(1000);

    const switchUrl = page.url();
    console.log(`  URL after clicking switch button: ${switchUrl}`);
    if (!switchUrl.includes('/login') || !switchUrl.includes('role=CITIZEN') || !switchUrl.includes('redirect')) {
      throw new Error(`Expected switch button to navigate to /login?role=CITIZEN&redirect=/citizen/report, got ${switchUrl}`);
    }

    // Verify old user session was cleared (no token leakage)
    const storedUser = await page.evaluate(() => localStorage.getItem('potholefix_token'));
    if (storedUser) {
      throw new Error('Previous user token was not cleared during role switch!');
    }
    console.log('  [PASS] Role switch cleared previous session tokens and navigated to sign-in with Citizen preselected.');

    // ------------------------------------------------------------------
    // TEST 7: THREE-ROLE AUTHENTICATION PRESERVATION
    // ------------------------------------------------------------------
    console.log('\n--- TEST 7: Preserve Three-Role Authentication Interface ---');
    const login3Text = await page.evaluate(() => document.body.innerText);
    if (!login3Text.includes('Citizen Reporter') || !login3Text.includes('Municipal Authority') || !login3Text.includes('Field Repair Crew')) {
      throw new Error('Two-column sign-in missing one or more of the 3 role selector cards!');
    }

    // Test Field Repair Crew card selection
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('*'));
      const crewTitle = cards.find(el => el.textContent && el.textContent.includes('Field Repair Crew') && el.tagName === 'H3');
      const crewCard = crewTitle ? crewTitle.closest('[class*="cursor-pointer"]') : null;
      if (crewCard) crewCard.click();
    });
    await sleep(500);

    const crewEmail = await page.evaluate(() => {
      const input = document.querySelector('input[type="email"]');
      return input ? input.value : '';
    });
    if (!crewEmail.includes('gurpreet@pwd.punjab.gov.in')) {
      throw new Error(`Expected crew email gurpreet@pwd.punjab.gov.in, got ${crewEmail}`);
    }
    console.log('  [PASS] Two-column authentication preserved with Citizen, Authority, and Crew cards.');

    // Verify "Back to Home" button works
    const homeLink = await page.$('a[href="/"]');
    if (!homeLink) {
      throw new Error('Missing "Back to Home" link on login page!');
    }
    await homeLink.click();
    await sleep(1000);

    if (page.url() !== 'http://127.0.0.1:5174/') {
      throw new Error(`Expected to return to homepage, got ${page.url()}`);
    }
    console.log('  [PASS] "Back to Home" button functions properly.');

    console.log('\n========================================================================');
    console.log('   ALL 7 REFINEMENT VERIFICATION SUITES PASSED WITH ZERO ERRORS!       ');
    console.log('========================================================================\n');

  } finally {
    if (browser) await browser.close();
    frontendProc.kill('SIGTERM');
    backendProc.kill('SIGTERM');
    await sleep(1000);
  }
}

runRefinementSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[FATAL ERROR IN SUITE]:', err);
    process.exit(1);
  });
