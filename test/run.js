// uso: node run.js <script-de-teste.js> <saida.png> [largura] [altura]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [, , script, out, w = 1600, h = 900] = process.argv;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  await page.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:')) r.continue(); else r.abort(); });
  await page.goto('file:///home/claude/game/test/' + (process.env.NAME || 'main') + '/test.html');
  await page.waitForTimeout(300);
  const code = fs.readFileSync(script, 'utf8');
  const res = await page.evaluate(code);
  if (res !== undefined) console.log('RESULT', JSON.stringify(res));
  await page.waitForTimeout(200);
  await page.screenshot({ path: out });
  if (errs.length) console.log(errs.slice(0, 20).join('\n'));
  await browser.close();
})();
