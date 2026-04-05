const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('http://localhost:5175/boxes/5');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_local.png' });
  await browser.close();
})();
