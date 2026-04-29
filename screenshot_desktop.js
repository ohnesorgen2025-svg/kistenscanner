const { chromium } = require('playwright');

const PAGES = [
  { name: 'search',     path: '/' },
  { name: 'boxes',      path: '/boxes' },
  { name: 'box-detail', path: '/boxes/3' },
  { name: 'add-box',    path: '/boxes/add' },
  { name: 'scan',       path: '/scan' },
  { name: 'settings',   path: '/settings' },
  { name: 'help',       path: '/help' },
];

(async () => {
  const base = process.env.BASE_URL || 'http://localhost:5175';
  const out = process.env.OUT_DIR || 'screenshots/desktop';
  const fs = require('fs');
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const p of PAGES) {
    const url = base + p.path;
    process.stdout.write(`→ ${p.name.padEnd(10)} ${url} ... `);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (e) {
      console.log('NAV_TIMEOUT (continuing)');
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${out}/${p.name}.png`, fullPage: true });
    console.log('ok');
  }

  await browser.close();
})();
