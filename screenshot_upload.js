const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://192.168.44.106:3008/boxes/5');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_mobile.png' });
  await browser.close();
  // We can convert to ascii art or just read it clearly? No, we will just use the view_image tool again and I will observe carefully.
})();
