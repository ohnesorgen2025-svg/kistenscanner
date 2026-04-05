const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://192.168.44.106:3008/boxes/5');
  await page.waitForTimeout(2000);
  const layout = await page.evaluate(() => {
    const summary = document.querySelector('.box-detail-header__summary');
    const kids = Array.from(summary.children).map(c => ({
      tag: c.tagName,
      className: c.className,
      rect: c.getBoundingClientRect()
    }));
    const facts = document.querySelector('.box-detail-header__facts');
    const factKids = Array.from(facts.children).map(c => ({
      className: c.className,
      rect: c.getBoundingClientRect()
    }));
    return {
      summaryKids: kids,
      factKids: factKids
    };
  });
  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();
