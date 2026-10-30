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
- `script.js` — hero word-cycle, scroll reveal, mobile menu, FAQ accordion
- `images/` — case study and portrait photos
