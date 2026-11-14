// Génère les icônes de l'application à partir de la tête de Bobinette.
// Usage : node tools/make-icons.mjs  (nécessite Playwright)
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
import { mascotHeadSVG } from '../js/svg/mascot.js';

const head = (size) => mascotHeadSVG(size).replace('<svg ', '<svg x="SIZE_X" y="SIZE_Y" ');
function iconSVG(pad) {
  const inner = 512 - 2 * pad;
  const h = head(inner).replace('SIZE_X', pad).replace('SIZE_Y', pad + inner * 0.06);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${pad ? 0 : 112}" fill="#F3E4CF"/>
  ${h}
</svg>`;
}
writeFileSync(new URL('../icons/icon.svg', import.meta.url), iconSVG(56));

const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, pad] of [['icon-192.png', 192, 56], ['icon-512.png', 512, 56], ['icon-maskable-512.png', 512, 110]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${iconSVG(pad)}`);
  await page.screenshot({ path: new URL(`../icons/${file}`, import.meta.url).pathname, omitBackground: true });
}
await browser.close();
console.log('icônes générées');
