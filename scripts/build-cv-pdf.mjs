// Build the downloadable CV PDFs (EN + UK) from the site's dedicated print layout.
//
// Renders index.html with headless Google Chrome, once per language, emulating
// print media so the `.print-doc` / `@media print` styles produce the 2-page CV.
// Language is selected by pre-seeding localStorage('lang') before the page loads,
// exactly like a returning visitor — initLang() -> applyLang() fills the print
// block (incl. experience bullets) from the i18n data.
//
// Usage: npm run build:pdf   (requires Google Chrome installed; uses channel:'chrome')

import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pageUrl = 'file://' + path.join(root, 'index.html');

const targets = [
  { lang: 'en', out: 'assets/kolchyk-cv-en.pdf' },
  { lang: 'uk', out: 'assets/kolchyk-cv-uk.pdf' },
];

const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const { lang, out } of targets) {
    const ctx = await browser.newContext();
    // seed language before any page script runs
    await ctx.addInitScript((l) => localStorage.setItem('lang', l), lang);
    const page = await ctx.newPage();
    await page.goto(pageUrl, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready); // wait for Google Fonts
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: path.join(root, out),
      printBackground: true,
      preferCSSPageSize: true, // honour @page { margin: 11mm 13mm }
    });
    await ctx.close();
    console.log(`✓ ${out} (${lang})`);
  }
} finally {
  await browser.close();
}
