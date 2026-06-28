// Build the social-share OG cover (assets/og-cover.jpg, 1200×630).
//
// Renders a self-contained HTML card with headless Google Chrome and screenshots
// it to JPEG. The card mirrors the site's hero: serif name, italic role, and the
// blue accent (--accent #1f6aa8) used across index.html.
//
// Usage: npm run build:og   (requires Google Chrome installed; uses channel:'chrome')

import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets/og-cover.jpg');

// Embed the portrait as a data URI so the card renders without network/file deps.
const fotoB64 = readFileSync(path.join(root, 'assets/foto.jpg')).toString('base64');
const foto = `data:image/jpeg;base64,${fotoB64}`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1200px;height:630px}
  body{
    font-family:'Inter',sans-serif;color:#f4f8f6;overflow:hidden;
    background:linear-gradient(135deg,#1f6aa8 0%,#185889 48%,#103a5e 100%);
    position:relative;
  }
  /* subtle radial glow, echoing the site hero */
  body::before{content:'';position:absolute;inset:0;
    background:radial-gradient(60% 70% at 80% 18%,rgba(255,255,255,.10),transparent 70%)}
  .wrap{position:relative;display:flex;align-items:center;height:100%;padding:0 84px;gap:60px}
  .left{flex:1;min-width:0}
  .eyebrow{font-weight:700;font-size:22px;letter-spacing:.18em;text-transform:uppercase;
    color:rgba(244,248,246,.78)}
  .name{font-family:'Fraunces',serif;font-weight:600;font-size:96px;line-height:.98;
    letter-spacing:-.02em;margin:18px 0 10px}
  .role{font-family:'Fraunces',serif;font-style:italic;font-weight:500;font-size:40px;
    color:rgba(244,248,246,.92)}
  .org{font-weight:700;font-size:26px;margin-top:14px;color:rgba(244,248,246,.95)}
  .rule{width:170px;height:3px;background:rgba(244,248,246,.55);margin:34px 0;border-radius:2px}
  .facts{font-size:25px;color:rgba(244,248,246,.9)}
  .url{position:absolute;left:84px;bottom:48px;font-size:24px;letter-spacing:.01em;
    color:rgba(244,248,246,.82)}
  .photo{width:340px;height:430px;border-radius:20px;object-fit:cover;flex-shrink:0;
    box-shadow:0 24px 60px rgba(0,0,0,.35);outline:1px solid rgba(255,255,255,.12)}
</style></head><body>
  <div class="wrap">
    <div class="left">
      <div class="eyebrow">Data · BI · AI · Governance</div>
      <div class="name">Serhii Kolchyk</div>
      <div class="role">Chief Data &amp; Innovation Officer</div>
      <div class="org">Naftogaz of Ukraine</div>
      <div class="rule"></div>
      <div class="facts">12+ years · single source of truth · BI platforms · AI</div>
    </div>
    <img class="photo" src="${foto}" alt="">
  </div>
  <div class="url">kolchyk.github.io</div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
try {
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready); // wait for Google Fonts
  await page.screenshot({ path: out, type: 'jpeg', quality: 90 });
  await ctx.close();
  console.log(`✓ ${path.relative(root, out)}`);
} finally {
  await browser.close();
}
