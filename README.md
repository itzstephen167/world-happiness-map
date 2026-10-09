# World Happiness Map

Interactive Mercator world map built with D3 and TopoJSON (`world-atlas`), colored in shades of blue by happiness score.

Features: hover tooltips, click-to-zoom with a detail card (score + rank), search, pan/zoom controls, top/bottom 10 lists, dark mode.

## Run locally

The page loads a CSV, so it needs a web server (not `file://`):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo.
2. Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Your site appears at `https://<user>.github.io/<repo>/`.

## Data

`data/happiness.csv` (`country,score`) holds approximate World Happiness Report 2024 scores. Country names must match the `name` property in world-atlas (e.g. `United States of America`, `Dem. Rep. Congo`). Replace with the official data before publishing.
