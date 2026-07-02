// End-to-end tests for the single-file CV site.
//
// Drives index.html with headless Google Chrome (same engine/channel as the PDF
// builder) and verifies every interactive feature from the README: themes, i18n,
// experience filters, count-up stats, language bars, the dedicated
// print CV, responsiveness and accessibility basics.
//
// Zero new dependencies: Node's built-in test runner + playwright-core + the
// Chrome that build:pdf already requires.
//
// Usage: npm test   (requires Google Chrome installed)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = 'file://' + path.join(root, 'index.html');

let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome' }); });
after(async () => { await browser?.close(); });

// Open a fresh isolated context (clean localStorage) and load the page.
// opts.context → Playwright context options (viewport, locale, reducedMotion…)
// opts.lang / opts.theme → seed localStorage before any page script runs.
async function open({ context = {}, lang, theme } = {}) {
  const ctx = await browser.newContext(context);
  if (lang) await ctx.addInitScript(l => localStorage.setItem('lang', l), lang);
  if (theme) await ctx.addInitScript(t => localStorage.setItem('theme', t), theme);
  const page = await ctx.newPage();
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  return { ctx, page };
}

// ----- static assets (no browser) -----

test('CV PDF assets exist and are valid PDFs', () => {
  for (const f of ['assets/kolchyk-cv-en.pdf', 'assets/kolchyk-cv-uk.pdf']) {
    const p = path.join(root, f);
    assert.ok(fs.existsSync(p), `${f} should exist`);
    const buf = fs.readFileSync(p);
    assert.ok(buf.length > 10_000, `${f} should be a non-trivial size`);
    assert.equal(buf.subarray(0, 5).toString('latin1'), '%PDF-', `${f} should start with the PDF magic header`);
  }
});

test('.nojekyll is present so GitHub Pages serves the file as-is', () => {
  assert.ok(fs.existsSync(path.join(root, '.nojekyll')));
});

// ----- page health -----

test('loads without uncaught JS errors or app console errors', async () => {
  const ctx = await browser.newContext();
  const pageErrors = [], consoleErrors = [];
  const page = await ctx.newPage();
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  // ignore noise from blocked/offline external resources (Google Fonts, favicon)
  const appErrors = consoleErrors.filter(t => !/Failed to load resource|net::|ERR_|fonts\.g|favicon/i.test(t));
  await ctx.close();
  assert.deepEqual(pageErrors, [], 'no uncaught JS exceptions');
  assert.deepEqual(appErrors, [], 'no application console errors');
});

// ----- theme -----

test('theme toggle switches, persists, and updates icon + meta', async () => {
  const { ctx, page } = await open();
  try {
    const start = await page.getAttribute('html', 'data-theme');
    assert.equal(start, 'light', 'defaults to light with no system dark preference');
    await page.click('#themeBtn');
    const next = await page.getAttribute('html', 'data-theme');
    assert.equal(next, 'dark');
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark', 'choice persisted');
    assert.equal(await page.getAttribute('meta[name="theme-color"]', 'content'), '#10171a', 'theme-color follows the theme');
    assert.ok(await page.locator('#themeBtn svg').count() >= 1, 'icon rendered');
    await page.click('#themeBtn');
    assert.equal(await page.getAttribute('html', 'data-theme'), 'light', 'toggles back');
  } finally { await ctx.close(); }
});

test('theme preference is restored from localStorage', async () => {
  const { ctx, page } = await open({ theme: 'dark' });
  try {
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  } finally { await ctx.close(); }
});

// ----- i18n -----

test('language toggle swaps strings, title, meta, lang attr and CV link', async () => {
  const { ctx, page } = await open();
  try {
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    const enRole = await page.locator('[data-i18n="hero.role"]').first().innerHTML();

    await page.click('#langBtn');
    assert.equal(await page.getAttribute('html', 'lang'), 'uk');
    assert.match(await page.title(), /Сергій Кольчик/, '<title> switched to UK');
    assert.match(await page.getAttribute('meta[name="description"]', 'content'), /Сергій Кольчик/, 'meta description switched');
    assert.match(await page.getAttribute('meta[property="og:title"]', 'content'), /Сергій/, 'OG title switched');
    assert.equal(await page.locator('a[data-cv-dl]').first().getAttribute('href'), 'assets/kolchyk-cv-uk.pdf', 'CV link points at UK PDF');
    assert.equal((await page.locator('#langBtn').textContent()).trim(), 'EN', 'toggle now offers EN');

    const ukRole = await page.locator('[data-i18n="hero.role"]').first().innerHTML();
    assert.notEqual(ukRole, enRole, 'visible string changed');
    assert.match(ukRole, /Нафтогаз/);

    // English is the source of truth: toggling back restores the captured DOM
    await page.click('#langBtn');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    assert.equal(await page.locator('[data-i18n="hero.role"]').first().innerHTML(), enRole, 'EN restored verbatim');
    assert.match(await page.title(), /Serhii Kolchyk/);
  } finally { await ctx.close(); }
});

test('auto-detects Ukrainian from navigator.language', async () => {
  const { ctx, page } = await open({ context: { locale: 'uk-UA' } });
  try {
    assert.equal(await page.getAttribute('html', 'lang'), 'uk');
    assert.equal((await page.locator('#langBtn').textContent()).trim(), 'EN');
  } finally { await ctx.close(); }
});

test('language preference is restored from localStorage', async () => {
  const { ctx, page } = await open({ lang: 'uk' });
  try {
    assert.equal(await page.getAttribute('html', 'lang'), 'uk');
  } finally { await ctx.close(); }
});

// ----- experience filters -----

test('experience filters show/hide roles by category', async () => {
  const { ctx, page } = await open();
  try {
    const total = await page.locator('.job').count();
    assert.ok(total >= 7, 'all roles present');

    await page.click('.chip[data-f="leadership"]');
    assert.equal(await page.locator('.chip[data-f="leadership"].active').count(), 1, 'active chip moved');
    const visible = await page.locator('.job:not(.hide)').count();
    const expected = await page.locator('.job[data-tags~="leadership"]').count();
    assert.equal(visible, expected, 'only matching roles visible');
    assert.ok(visible > 0 && visible < total, 'filter actually narrows the list');

    await page.click('.chip[data-f="all"]');
    assert.equal(await page.locator('.job:not(.hide)').count(), total, '"All" restores every role');
  } finally { await ctx.close(); }
});

// ----- animated numbers & bars -----

test('stat counters animate to their final values when scrolled into view', async () => {
  const { ctx, page } = await open();
  try {
    await page.locator('.stats').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const els = [...document.querySelectorAll('.stat .n[data-to]')];
      return els.length > 0 && els.every(e => e.textContent === e.dataset.to + (e.dataset.suffix || ''));
    }, { timeout: 6000 });
    assert.equal(await page.locator('.stat .n[data-to]').first().textContent(), '12+');
  } finally { await ctx.close(); }
});

test('language proficiency bars fill to their target width', async () => {
  const { ctx, page } = await open();
  try {
    await page.locator('.langbar').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const els = [...document.querySelectorAll('.track i')];
      return els.length > 0 && els.every(e => e.style.width === e.dataset.w + '%');
    }, { timeout: 6000 });
    const widths = await page.$$eval('.track i', els => els.map(e => e.style.width));
    assert.ok(widths.includes('100%') && widths.includes('75%'), `bars filled (${widths.join(', ')})`);
  } finally { await ctx.close(); }
});

test('respects prefers-reduced-motion (stats snap to final, not zero)', async () => {
  const { ctx, page } = await open({ context: { reducedMotion: 'reduce' } });
  try {
    await page.locator('.stats').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const e = document.querySelector('.stat .n[data-to]');
      return e && e.textContent === e.dataset.to + (e.dataset.suffix || '');
    }, { timeout: 4000 });
    assert.equal(await page.locator('.stat .n[data-to]').first().textContent(), '12+');
  } finally { await ctx.close(); }
});

// ----- dedicated print / PDF CV -----

test('dedicated print CV is hidden on screen, revealed in print, and populated', async () => {
  const { ctx, page } = await open();
  try {
    // bullets are filled from the i18n data at init (shared data-i18n keys)
    assert.ok(await page.locator('.pjob ul[data-i18n="j1.ul"] li').count() > 0, 'print job bullets populated');
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.querySelector('.print-doc')).display),
      'none', 'hidden on screen');

    await page.emulateMedia({ media: 'print' });
    assert.notEqual(
      await page.evaluate(() => getComputedStyle(document.querySelector('.print-doc')).display),
      'none', 'revealed in print media');

    // beforeprint locks animated counters to their final values
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    assert.equal(await page.locator('.stat .n[data-to]').first().textContent(), '12+', 'counters locked for print');
  } finally { await ctx.close(); }
});

test('CV download links resolve to existing files', async () => {
  const { ctx, page } = await open();
  try {
    const hrefs = await page.$$eval('a[data-cv-dl]', els => els.map(e => e.getAttribute('href')));
    assert.ok(hrefs.length >= 1, 'has download links');
    for (const h of hrefs) assert.ok(fs.existsSync(path.join(root, h)), `${h} exists on disk`);
  } finally { await ctx.close(); }
});

// ----- responsiveness & accessibility -----

test('no horizontal overflow at 360px', async () => {
  const { ctx, page } = await open({ context: { viewport: { width: 360, height: 780 } } });
  try {
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `content should not overflow horizontally (was ${overflow}px)`);
  } finally { await ctx.close(); }
});

test('accessibility basics: one h1, every image has alt, favicon + OG image set', async () => {
  const { ctx, page } = await open();
  try {
    assert.equal(await page.locator('h1').count(), 1, 'exactly one h1');
    const imgsWithoutAlt = await page.$$eval('img', els => els.filter(e => !e.getAttribute('alt')).length);
    assert.equal(imgsWithoutAlt, 0, 'all images have alt text');
    assert.equal(await page.locator('link[rel="icon"]').count(), 1, 'favicon present');
    assert.match(await page.getAttribute('meta[property="og:image"]', 'content'), /^https?:\/\//, 'OG image set');
  } finally { await ctx.close(); }
});
