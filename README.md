# Ameya's Library

A single painted illustration as a portfolio. Every object on the shelf opens one section. No framework, no build step, no dependencies: double-click `index.html` and it works.

## Files

| File | What it is |
|---|---|
| `index.html` | The page. Painting, panel shell, no-JS fallback, meta tags. |
| `config.js` | **The only file you edit to change content.** Sections, hotspots, items, contact details. |
| `styles.css` | All styling. Tokens (colours, timings, themes) are at the top. |
| `app.js` | Hotspots, panel, routing, themes, lightbox, contact, mobile list. |
| `dev.js` | Hotspot alignment tool. Only loads with `?dev` on the URL. |
| `library.png` | The full-size painting, 3840×2160. Kept as the master. |
| `library.webp`, `library-2400.webp`, `library-2400.png` | What the browser loads: lossless full-size WebP on desktop, 2400px WebP on phones, PNG fallback. |
| `og.jpg`, `favicon.png` | Social card image and tab icon, both cut from the painting. |
| `assets/` | Your artwork, project images, and `resume.pdf`. |

## Adding a project to a section

1. Drop the image into `assets/`. Keep it under about 400KB; 1600px on the long side is plenty for the panel, and the lightbox shows it at that size too.
2. Open `config.js`, find the section, and add an object to its `items` array:

```js
{
  title: "Night market",
  description: "Gouache study from a trip in March. Two evenings, one sitting each.",
  image: "assets/night-market.jpg",
  alt: "A gouache painting of a lamplit food stall at night, steam rising in orange light.",
  link: "",
  linkLabel: "",
  meta: "2026"
}
```

3. Save and refresh. Open the browser console: the config validator warns about anything missing (image path that 404s, missing alt text, overlapping hotspots).

Every field is commented in `config.js`. `video` on an item (YouTube or Vimeo URL) embeds a player in place of the image.

## Adding a whole section

1. Add an object to `SECTIONS` in `config.js` with a new `id`, `label`, `theme`, `hotspot`, and `items`.
2. Pick a theme: `paper`, `gallery`, `spread`, `reel`, `lab`, `shelf`, `screen`, or `contact`. To invent a new one, add its variables to the theme block at the top of `styles.css` and one `.theme-<name> { … }` block in the Step 6 section.
3. Position the hotspot in dev mode (below).
4. Add a matching `<h2>` and `<p>` to the `<noscript>` block in `index.html` so the no-JavaScript fallback stays complete.

## Repositioning a hotspot (dev mode)

1. Open `index.html?dev` in a browser (double-clicking the file then adding `?dev` to the address works).
2. Every hotspot shows with a dashed outline and its id. Drag to move. Drag the small gold corner to resize. Arrow keys nudge 0.1%, shift+arrow 1%.
3. The bar at the bottom shows live percentages, lets you add or delete hotspots, and toggles rect/ellipse.
4. Changes persist in localStorage, so a refresh keeps your work.
5. Click **Copy config**, open `config.js`, and paste over the whole `const SECTIONS = [ … ];` block. Note: the copied block keeps your `items`, but not the long comments above the array, which live outside it.
6. Click **Reset to config.js** to discard the draft.

Hotspots are percentages of the painting, so they stay correct at any window size and zoom.

## Swapping the painting for a new version

Export from Procreate as described in the build plan: flatten a copy, guides off, largest PNG. Then:

1. Replace `library.png` with the new export. If the pixel size changed, update `PAINTING.width` / `PAINTING.height` in `config.js` **and** the `--painting-w` / `--painting-h` values on the `#stage` div in `index.html`. If the aspect ratio changed, also update the `padding-top` fallback in `styles.css` (height ÷ width × 100).
2. Regenerate the derived images. Without any tooling, the quickest route is [squoosh.app](https://squoosh.app): make a full-size lossless WebP (`library.webp`), a 2400px-wide WebP (`library-2400.webp`), a 2400px PNG (`library-2400.png`), a 1200px JPEG (`og.jpg`), and a 64px square PNG for `favicon.png`.
3. Make a new placeholder: a 32px-wide WebP of the painting, base64-encoded, pasted into the `background-image` on `#stage` in `index.html`. (Squoosh can export at 32px; any base64 tool turns the file into a data URI.)
4. Open `index.html?dev` and re-drag the hotspots onto the new objects. Copy config, paste.
5. Commit: `git add -A && git commit -m "New painting"`.

## Deployment

See `DEPLOY.md` for Netlify, GitHub Pages, DNS for ameyakohli.com, rollback, and the update routine.

## Version control

Each build step is one commit. To roll back a step that went wrong:

```
git log --oneline          # find the commit before the bad step
git revert <hash>          # undo just that step, keep the rest
```
