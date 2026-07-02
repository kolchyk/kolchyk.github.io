# Редакторське резюме — сайт в одному файлі

Сайт-резюме в редакторському стилі: **увесь сайт в одному `index.html`**, без збірки, фреймворків і залежностей у рантаймі. Світла й темна теми, дві мови, інтерактивний таймлайн досвіду, анімована статистика та готове до друку **резюме-PDF на 2 сторінки**, що генерується з того самого контенту.

> Спочатку зроблений для [Serhii Kolchyk](https://www.linkedin.com/in/serhii-kolchyk/) (Chief Data & Innovation Officer, НАК «Нафтогаз України»). Нижче — опис можливостей і **готовий промпт, щоб зробити власну версію**.

`Без збірки` · `Нуль залежностей` · `Один файл` · `GitHub Pages`

---

## Можливості

**Архітектура.** Увесь сайт — один файл `index.html` (HTML + CSS + JS). Єдиний зовнішній ресурс — шрифти Google Fonts. Сучасний CSS (CSS-змінні, `clamp()`, `color-mix()`, `oklch()`, grid), інтерактивність на чистому JS з `IntersectionObserver`. npm потрібен лише для офлайн-генерації PDF.

```text
index.html               ← увесь сайт: HTML + CSS + JS
assets/foto.jpg          ← портрет (необовʼязково — є монограма-заміна)
assets/kolchyk-cv-*.pdf  ← готові резюме-PDF (EN/UK) для кнопки завантаження
scripts/build-cv-pdf.mjs ← генератор PDF (npm run build:pdf)
.nojekyll                ← GitHub Pages віддає файл без обробки Jekyll
```

- **Теми** — світла/темна, вибір у `localStorage`, за замовчуванням системна (`prefers-color-scheme`). Уся палітра на CSS-змінних.
- **Дві мови** — миттєвий перемикач EN ⇄ друга мова (зараз українська). Англійська — джерело правди з розмітки; переклади лежать в одному JS-обʼєкті за ключами `data-i18n`. Перемикач також змінює `<title>`, meta, Open Graph і `<html lang>`. Вибір запамʼятовується, перша мова — з `navigator.language`.
- **Навігація** — липка шапка з якорями, scrollspy, смужка прогресу прокрутки.
- **Контент** — герой-секція з фактами і портретом (або монограмою), анімована статистика, картки «як я працюю», таймлайн досвіду з фільтрами за категоріями, навички, освіта, шкали мов, контакти.
- **Анімації** — reveal при прокрутці, лічильники, шкали мов; усі вимикаються за `prefers-reduced-motion`.
- **Резюме-PDF** — окремий друкований макет (`@media print`, не скриншот). Кнопка одразу завантажує готовий PDF із `assets/` активною мовою (`kolchyk-cv-en.pdf` / `kolchyk-cv-uk.pdf`). PDF генеруються з тієї ж верстки через `npm run build:pdf` — **після зміни контенту їх треба перегенерувати**. Тримаються в межах 2 сторінок (3 пункти на роль, 5 — для `flagship`).
- **Доступність і SEO** — семантична розмітка, порядок заголовків, alt-тексти, фокус, контраст; адаптив від 360px; локалізовані meta й Open Graph; інлайн-SVG фавікон.

---

## Як зробити власну версію

Віддай промпт нижче в [Claude Code](https://claude.com/claude-code) (або інший кодовий агент), заповни блок `YOUR DETAILS` своїми даними — на виході отримаєш єдиний `index.html`, готовий до деплою.

> Промпт навмисно англійською — так агент дає точніший результат.

````text
Build me a personal résumé / CV website as a SINGLE self-contained `index.html` file.

HOW TO PROCEED
First, scan the YOUR DETAILS block below. If anything important is blank, ask me for it before writing any code. Then build the complete file. Finally, self-check it against the QUALITY BAR and tell me how it did.

NON-NEGOTIABLE CONSTRAINTS
- One file only: HTML + CSS + JS inline. No build step, no framework, no npm, no external JS libraries. Web fonts from Google Fonts are the only allowed external resource.
- Must open correctly by double-clicking the file (works on file://) and deploy as-is to GitHub Pages.
- Semantic, accessible HTML: landmarks, real headings in order, alt text, focus states, sufficient contrast. Respect `prefers-reduced-motion`. Fully responsive from 360px phones to wide desktops.
- Clean, readable code with short comments separating the major sections.

DESIGN LANGUAGE
- Editorial / magazine feel: confident typography, generous whitespace, a quiet refined palette with ONE accent color, subtle depth (soft shadows, hairline borders).
- Type system of three families via CSS variables: a display serif for headings, a readable serif for body, and a clean sans for UI/labels.
- Define the ENTIRE palette as CSS custom properties under `:root`, with a `[data-theme='dark']` override block. Every color used must come from a variable so themes stay consistent.
- Motion is tasteful and purposeful, never distracting: reveal-on-scroll, a thin scroll-progress bar, count-up stats.

REQUIRED SECTIONS (in this order)
1. Sticky top bar: name/monogram, in-page nav links, a language toggle, and a dark-mode toggle.
2. Hero: name, role/title, a one-paragraph summary with key phrases bolded, a few "fact" chips (location, languages, years of experience), primary "Get in touch" + "Download CV" buttons, and a portrait (with a styled monogram as the fallback if no photo).
3. Stats strip: 4–6 headline numbers that animate (count up) when scrolled into view.
4. "How I work": 3–4 short principle cards.
5. Experience: a vertical timeline of roles. Each role shows company, title, dates, 3–6 achievement bullets (impact in bold), and skill tags. Add filter chips above the timeline that show/hide roles by category.
6. Skills: grouped tag cloud (e.g. by domain/tooling/leadership), each group an icon + a list of tags.
7. Education + sidebar: degrees, animated language-proficiency bars, certifications.
8. Contact: a closing headline, sub-text, and contact links (email, LinkedIn, etc.).
9. Footer: copyright with the current year filled in by JS.

KEY FEATURES (implement all)
- Dark/light theme toggle persisted in localStorage, defaulting to the system preference.
- Internationalization with NO duplicated source language: mark translatable elements with `data-i18n="key"`, read the default language straight from the DOM, and keep ONLY the second language's strings in a small JS object keyed by the same keys. The toggle also swaps `<title>` and meta/Open Graph tags and updates `<html lang>`. Persist the choice and auto-detect from `navigator.language`.
- A DEDICATED print/PDF résumé that is hidden on screen and revealed only in `@media print`: a compact, typeset 1–2 page CV (NOT a screenshot of the live page). The "Download CV" button just calls `window.print()`. The print layout should reuse the same i18n keys so it prints in the active language, and it must force the light palette and exact-color printing. Before printing, lock any animated numbers to their final values.
- Vanilla-JS interactions only, using IntersectionObserver where possible: reveal-on-scroll, count-up stats, filling language bars, scroll-progress bar, scrollspy that highlights the active nav link, the experience filters, and the theme/language toggles.
- A favicon as an inline SVG data-URI showing my initials in the accent color.
- Helpful `<title>`, meta description, and Open Graph tags.

YOUR DETAILS  (fill these in — if something is missing, ask me; otherwise use sensible placeholders and clearly mark them)
- Name:
- Role / headline:
- One-paragraph summary:
- Location & languages:
- Key stats (number → label), e.g. "12+ → years of experience":
- Working principles (3–4):
- Experience (for each: company, title, location, dates, 3–6 achievements with metrics, skill tags, and a category for filtering):
- Skills (grouped):
- Education (school, degree, years):
- Certifications:
- Contact links (email, LinkedIn, Telegram/X/site):
- Second language for the toggle (e.g. Ukrainian) — or say "English only":
- Brand accent color and vibe (e.g. "deep teal, calm and editorial"):
- Photo: yes/no (if no, use a monogram of my initials):

QUALITY BAR (verify before you hand it over)
- Every control works with no console errors: theme toggle, language toggle, filter chips, and the Download CV button.
- Switching language swaps every visible string AND the `<title>` / meta tags — nothing snaps back to the source language.
- Print preview shows a clean 1–2 page CV in the active language, forced to the light palette, with the stat numbers at their final values (not 0).
- At 360px wide nothing overflows horizontally.
- With `prefers-reduced-motion` enabled, animations are disabled rather than broken.
- No leftover lorem/placeholder text except where I deliberately left a field blank.

DELIVERABLE
Output the complete `index.html`. After it, give me a 5-line summary of where to edit my content, colors, and translations, and how to deploy to GitHub Pages.
````

> Порада: якщо подобається саме цей дизайн — додай `index.html` у контекст і напиши агенту «match the style of the attached file».

---

## Запуск і деплой

```bash
open index.html                 # macOS (Windows — "start", Linux — "xdg-open")
python3 -m http.server 8000     # або: http://localhost:8000
```

Перегенерувати резюме-PDF після зміни контенту (потрібен Google Chrome):

```bash
npm install        # одноразово (playwright-core)
npm run build:pdf  # оновлює assets/kolchyk-cv-en.pdf та kolchyk-cv-uk.pdf
npm test           # E2E-тести в headless Chrome
```

Деплой на **GitHub Pages**:

1. Заpush-ни файли в гілку **`main`**.
2. **Settings → Pages** → **Source: *Deploy from a branch*** → **Branch: `main` / `root`**.
3. Сайт буде за `https://your-username.github.io/your-repo/`. Файл `.nojekyll` гарантує віддачу HTML без обробки.

---

## Ліцензія

**Код і дизайн — вільні до повторного використання** (як MIT). **Контент особистий** — заміни текст, фото й посилання на свої.

> **Зроблено одним файлом — навмисно.** ✦ Форкни і зроби своїм.
