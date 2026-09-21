import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

const root = path.resolve('dist');
async function walk(dir) {
  return (await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name)))).flat();
}
const files = await walk(root);
const htmlFiles = files.filter(f => f.endsWith('.html'));
assert(htmlFiles.length > 15, 'Expected portfolio and article pages');
const site = 'https://palash.dev';
for (const file of htmlFiles) {
  const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
  const $ = load(await readFile(file, 'utf8'));
  const label = message => `${route}: ${message}`;
  assert.equal($('head title').length, 1, label('one title'));
  assert.equal($('head meta[name=description]').length, 1, label('one description'));
  assert.equal($('html').attr('lang'), 'en', label('page language'));
  assert.equal($('head meta[charset]').attr('charset')?.toLowerCase(), 'utf-8', label('UTF-8 charset'));
  assert.match($('head meta[name=viewport]').attr('content') ?? '', /width=device-width/, label('responsive viewport'));
  assert.equal($('head meta[name=theme-color]').attr('content'), '#111722', label('theme color'));
  assert.equal($('head link[rel=manifest]').attr('href'), '/site.webmanifest', label('web manifest'));
  const title = $('head title').text().trim();
  const description = $('head meta[name=description]').attr('content')?.trim() ?? '';
  assert(title.length >= 10 && title.length <= 70, label(`useful title length (${title.length})`));
  assert(description.length >= 40 && description.length <= 170, label(`useful description length (${description.length})`));
  assert.equal($('head link[rel=canonical]').length, 1, label('one canonical'));
  assert.equal($('h1').length, 1, label('one primary heading'));
  assert($('link[rel=stylesheet]').toArray().every(node => $(node).attr('href')?.startsWith('/_astro/')), label('stylesheets are local build assets'));
  assert.equal($('[style]').length, 0, label('no inline styles'));
  assert.equal($('header.arcade-header').length, 1, label('arcade header'));
  assert.equal($('footer.arcade-footer').length, 1, label('arcade footer'));
  assert.equal($('nav[aria-label="Products"] a').length, 6, label('six product links'));
  assert.equal($('head meta[property="og:url"]').attr('content'), $('link[rel=canonical]').attr('href'), label('canonical agrees with OG'));
  assert.equal($('head meta[property="og:title"]').attr('content'), title, label('Open Graph title agrees'));
  assert.equal($('head meta[property="og:description"]').attr('content'), description, label('Open Graph description agrees'));
  assert.equal($('head meta[property="og:image:width"]').attr('content'), '1200', label('Open Graph image width'));
  assert.equal($('head meta[property="og:image:height"]').attr('content'), '630', label('Open Graph image height'));
  assert.equal($('head meta[name="twitter:card"]').attr('content'), 'summary_large_image');
  assert.equal($('head script[type="application/ld+json"]').length, 1, label('one schema graph'));
  const graph = JSON.parse($('head script[type="application/ld+json"]').text());
  assert.equal(graph['@context'], 'https://schema.org');
  assert(graph['@graph'].some(n => n['@type'] === 'Person'));
  if (route.startsWith('/blog/') && route !== '/blog/') {
    assert(graph['@graph'].some(n => n['@type'] === 'BlogPosting' && n.datePublished && n.author));
    assert($('link[rel=alternate][type="text/markdown"]').length >= 1);
  }
  if (['/preview/', '/search/', '/404.html'].includes(route)) assert.match($('meta[name=robots]').attr('content'), /noindex/);
  else assert.equal($('link[rel=canonical]').attr('href'), site + route);
  const og = new URL($('meta[property="og:image"]').attr('content'));
  const png = await readFile(path.join(root, og.pathname));
  assert.equal(png.readUInt32BE(16), 1200, label('OG width'));
  assert.equal(png.readUInt32BE(20), 630, label('OG height'));
  for (const el of $('a[href], img[src], script[src], link[href]').toArray()) {
    const target = $(el).attr('href') ?? $(el).attr('src');
    const url = new URL(target, site + route);
    if (url.origin !== site) continue;
    let local = path.join(root, decodeURIComponent(url.pathname));
    try { if ((await stat(local)).isDirectory()) local = path.join(local, 'index.html'); await stat(local); }
    catch { assert.fail(label(`missing local asset/link: ${target}`)); }
    if (url.hash && local.endsWith('.html')) {
      const other = load(await readFile(local, 'utf8'));
      assert(other('[id]').toArray().some(n => other(n).attr('id') === decodeURIComponent(url.hash.slice(1))), label(`missing anchor ${target}`));
    }
  }
  const interactiveRoutes = ['/search/', '/preview/', '/media/', '/bootable/', '/friday/', '/memxt/', '/omnivoice/', '/opal/', '/opengtm/'];
  if (!interactiveRoutes.includes(route)) assert.equal($('astro-island').length, 0, label('no framework hydration on static reading pages'));
}
const sitemap = await readFile(path.join(root, 'sitemap-0.xml'), 'utf8');
assert(!sitemap.includes('/preview/') && !sitemap.includes('/search/'));
for (const match of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) await stat(path.join(root, new URL(match[1]).pathname, 'index.html'));
assert((await readFile(path.join(root, 'resume.pdf'))).subarray(0, 5).equals(Buffer.from('%PDF-')));
assert((await readFile(path.join(root, 'llms.txt'), 'utf8')).includes('Bootable'));
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${site}/sitemap.xml`), 'robots.txt advertises the sitemap');
assert(await stat(path.join(root, 'site.webmanifest')), 'web manifest is built');
const css = (await Promise.all(files.filter(file => file.endsWith('.css')).map(file => readFile(file, 'utf8')))).join('\n');
assert(css.includes('arcade-header') && css.includes('arcade-footer'), 'Arcade shell CSS is built');
assert(css.includes('Bungee') && css.includes('IBM Plex Mono') && css.includes('Instrument Sans Variable'), 'Fontsource fonts are built');
assert(files.some(file => file.endsWith('.woff2')), 'Self-hosted fonts are built');
console.log(`OpenSEO-style audit passed for ${htmlFiles.length} pages: metadata, social cards, schema, crawl paths, arcade shell, local fonts, links, sitemap, and résumé.`);
