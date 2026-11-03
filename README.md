# Olha Datsenko — Portfolio

Static site (no build step, no framework). Edit `index.html` / `about.html` / `styles.css` / `script.js` directly and refresh — nothing to compile.

## Run locally

```
cd olha-portfolio
python3 -m http.server 8000
```

Then open http://localhost:8000

## Deploy

Pushing to `main` deploys automatically via GitHub Pages (configured in repo Settings → Pages).

## Structure

- `index.html` — home page (hero + Oneflow case studies)
- `about.html` — about page (bio, approach, skills, FAQ)
- `styles.css` — all styling
- `case-*.html` — case study pages
- `script.js` — typewriter, nav colour, page transitions, compare slider, counters, contents rail, skills playground, FAQ
- `images/` — case study screens and portrait, as multi-size WebP

## Credits

- Typeface: [Schibsted Grotesk](https://fonts.google.com/specimen/Schibsted+Grotesk), SIL Open Font License 1.1, loaded from Google Fonts.
- Physics on the About page: [Matter.js](https://brm.io/matter-js/) 0.19.0, MIT License, loaded from cdnjs.
- All other code, layout and visual design are original to this site. Product screenshots are Olha's own work at Oneflow.
