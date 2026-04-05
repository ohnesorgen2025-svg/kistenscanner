const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto('file://' + __dirname + '/test-aspect.html');
  await page.screenshot({ path: 'test-aspect.png' });
  await browser.close();
})();
