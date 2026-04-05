const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'http://192.168.44.106:3008';
const ROUTES = [
  { name: 'search', path: '/' },
  { name: 'boxes', path: '/boxes' },
  { name: 'box_detail', path: '/boxes/5' },
  { name: 'boxes_add', path: '/boxes/add' },
  { name: 'scan', path: '/scan' },
  { name: 'settings', path: '/settings' }
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 }
];

(async () => {
  const browser = await chromium.launch();
  
  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      try {
        await page.goto(BASE_URL + route.path, { waitUntil: 'load', timeout: 5000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${route.name}_${vp.name}.png`, fullPage: true });
        console.log(`Captured ${route.name} on ${vp.name}`);
      } catch (err) {
        console.log(`Failed for ${route.name} on ${vp.name}: ${err.message}`);
      }
      await context.close();
    }
  }
  
  await browser.close();
})();
