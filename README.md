# Lord's Last Call Church — Website

A single-file, self-contained website for Lord's Last Call Church (Luong Mogik Mar Nyasaye).

## What's inside

- `index.html` — the entire site: HTML, CSS, and JavaScript in one file, plus the church logo
  embedded directly as a base64 image (so there are no separate image files to manage).

## Opening it in VS Code

1. Unzip this folder and open it in VS Code (`File > Open Folder…`).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel if you
   don't already have it.
3. Right-click `index.html` and choose **"Open with Live Server"**. The site will open in
   your browser and auto-refresh whenever you save changes.

   Alternatively, just double-click `index.html` in a file explorer to open it directly in
   a browser — everything works without a server since the whole page is self-contained.

## Structure of index.html

- `<style>` block (top of file) — all CSS, using custom properties (`--navy`, `--gold`, etc.)
  defined on `:root` for easy theme tweaks.
- `<body>` — semantic sections in order: header/nav, hero, mission/vision/beliefs pillars,
  "Our Foundation" + key beliefs, ministries, about + news, contact, footer.
- `<script>` block (bottom of file) — vanilla JS handling the mobile menu, dropdown nav,
  search toggle, contact form, scroll-based active nav highlighting, and back-to-top button.
  No build step or dependencies required.

## Making changes

Because everything lives in one HTML file, you can edit CSS, markup, and JS all in the same
place. A few starting points:

- **Colors/fonts**: edit the `:root { ... }` custom properties near the top of the `<style>`
  block.
- **Logo**: search for `class="brand-mark"` (header) and `class="foot-brand"` (footer) — the
  logo is the base64 `<img>` tag inside each. To swap it, replace the `src` with a new
  `data:image/png;base64,...` string (or point it at an external image file if you'd rather
  not embed it).
- **Content**: all section text is plain HTML inside the section elements (`<section id="...">`),
  so search for the visible text you want to change.

## Deploying

This is a static site — no build step needed. You can host it as-is on any static host
(Netlify, GitHub Pages, Vercel, a plain web server, etc.) by uploading `index.html`.
