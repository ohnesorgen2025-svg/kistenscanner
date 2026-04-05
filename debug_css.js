const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://192.168.44.106:3008/boxes/5');
  await page.waitForTimeout(1000);
  const layout = await page.evaluate(() => {
    const summary = document.querySelector('.box-detail-header__summary');
    const location = document.querySelector('.box-detail-header__location');
    const kids = Array.from(summary.children).map(c => ({
      tag: c.tagName,
      className: c.className,
      rect: c.getBoundingClientRect(),
      gridArea: getComputedStyle(c).gridArea,
      gridRow: getComputedStyle(c).gridRow,
      position: getComputedStyle(c).position,
    }));
    return { summary: summary.getBoundingClientRect(), childs: kids };
  });
  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();
