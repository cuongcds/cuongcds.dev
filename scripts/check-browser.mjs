import assert from 'node:assert/strict';
import { preview } from 'astro';
import { chromium } from '@playwright/test';

// Use the API so agent-mode CLI daemonization cannot leak a test server.
const server = await preview({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
const origin = `http://127.0.0.1:${server.port}`;
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const sitemap = await (await fetch(origin + '/sitemap-0.xml')).text();
  const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]).pathname);
  for (const route of routes) {
    await page.goto(origin + route);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('nav[aria-label="Products"] a').count(), 6);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${route} overflows the mobile viewport`);
  }
  await page.goto(origin + '/search/?q=bootable&kind=project');
  await page.getByRole('status').filter({ hasText: '1 results' }).waitFor();
  assert.equal(await page.locator('#query').inputValue(), 'bootable');
  await page.locator('#query').fill('no-match-zzzzz');
  await page.getByText('No matches. Try another term.').waitFor();
  await page.locator('#query').fill('memory');
  await page.locator('#kind').selectOption('article');
  await page.getByRole('link', { name: /memxt/i }).first().waitFor();
  assert(new URL(page.url()).searchParams.get('kind') === 'article');
  await page.route('**/search-index.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto(origin + '/search/');
  await page.getByRole('alert').waitFor();
  await page.unroute('**/search-index.json');
  await page.getByRole('button', { name: 'Retry' }).click();
  await page.getByRole('status').filter({ hasText: /\d+ results/ }).waitFor();
  await page.goto(origin + '/preview/');
  await page.locator('astro-island:not([ssr])').waitFor();
  await page.getByRole('tab', { name: 'Search', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  assert.equal(await page.getByRole('tab', { name: 'Social card', exact: true }).getAttribute('aria-selected'), 'true');
  await page.locator('#preview-page').selectOption('/bootable/');
  await page.waitForFunction(() => { const img = document.querySelector('[role=tabpanel] img'); return img?.complete && img.naturalWidth === 1200; });
  await page.getByRole('tab', { name: 'Schema', exact: true }).click();
  assert((await page.getByRole('tabpanel', { name: 'Schema', exact: true }).innerText()).includes('SoftwareApplication'));
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const reading = await noJs.newPage();
  await reading.goto(origin + '/blog/local-first-trust-boundaries/');
  assert((await reading.locator('article').innerText()).length > 1000);
  assert.equal(await reading.locator('head title').count(), 1);
  await noJs.close();
  assert.deepEqual(errors, [], 'Browser errors');
  console.log('Browser checks passed: mobile pages, search states, preview tabs, social image, and JavaScript-free reading.');
} finally {
  await browser?.close();
  await server.stop();
}
