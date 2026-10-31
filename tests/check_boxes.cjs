const puppeteer = require('puppeteer-core');
const { spawn, execSync } = require('child_process');

(async () => {
  let server;
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 3000 });
  } catch {
    server = spawn('cmd.exe', ['/c', 'npm run dev -- --port 5173 --host 127.0.0.1'], {
      cwd: 'C:\\Users\\DELL\\.gemini\\antigravity\\scratch\\potholefix',
      stdio: 'ignore',
    });
    await new Promise((r) => setTimeout(r, 3000));
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  }

  await new Promise((r) => setTimeout(r, 1500));
  const el = await page.$('#impact');
  if (el) await el.scrollIntoView();
  await new Promise((r) => setTimeout(r, 1000));

  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#impact button')).map((b) => {
      const rect = b.getBoundingClientRect();
      return {
        title: b.title,
        text: b.innerText.trim(),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    });
  });
  console.log('Buttons:', JSON.stringify(buttons, null, 2));

  // Now test hovering each button and see what pops up
  for (const b of buttons) {
    if (b.title.includes('Cluster')) {
      console.log('Hovering Cluster button at:', b.rect);
      await page.mouse.move(b.rect.x + b.rect.width / 2, b.rect.y + b.rect.height / 2);
      await new Promise((r) => setTimeout(r, 600));
      const popups = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#impact [class*="shadow-2xl"]')).map((el) => el.innerText.slice(0, 100));
      });
      console.log('Popups when hovering cluster:', popups);
    }
  }

  await browser.close();
  if (server && server.pid) {
    try {
      execSync(`taskkill /F /PID ${server.pid} /T`, { stdio: 'ignore' });
    } catch {}
  }
  process.exit(0);
})();
