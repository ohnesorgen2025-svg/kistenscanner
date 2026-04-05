const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://192.168.44.106:3008/boxes/5');
  await page.waitForTimeout(2000);
  const layout = await page.evaluate(() => {
    const identity = document.querySelector('.box-detail-header__identity');
    const kids = Array.from(identity.children).map(c => ({
      className: c.className,
      gridArea: getComputedStyle(c).gridArea,
      gridRow: getComputedStyle(c).gridRow,
      gridColumn: getComputedStyle(c).gridColumn,
      x: c.getBoundingClientRect().x,
      y: c.getBoundingClientRect().y,
      width: c.getBoundingClientRect().width,
      height: c.getBoundingClientRect().height
    }));
    return kids;
  });
  console.log(JSON.stringify(layout, null, 2));
  await browser.close();
})();
