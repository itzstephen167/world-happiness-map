// Shared by every page: loads the scores and works out rankings and regional averages.
const loadHappiness = () => d3.csv("data/happiness.csv", d => ({ country: d.country, score: +d.score, region: d.region })).then(rows => {
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  return {
    rows, ranked,
    happiness: new Map(rows.map(d => [d.country, d.score])),
    regionOf: new Map(rows.map(d => [d.country, d.region])),
    // World Happiness Report regions: mean score and country count for each
    regions: d3.rollup(rows, v => ({ avg: d3.mean(v, d => d.score), n: v.length }), d => d.region),
    rank: new Map(ranked.map((d, i) => [d.country, i + 1])),
    best: ranked[0], worst: ranked[ranked.length - 1],
  };
});

const loadError = (sel, err) => d3.select(sel).html(`<h2>Couldn't load data</h2><p class="muted">${err.message}. If opening the file directly, run a local server (see README).</p>`);
