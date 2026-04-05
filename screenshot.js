const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://192.168.44.106:3008/boxes/5');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot_mobile.png' });
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot_desktop.png' });
  await browser.close();
})();
