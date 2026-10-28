const W = 960, H = 520;
const svg = d3.select("#map");
const g = svg.append("g");
const tip = d3.select("#tip");

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json"),
  d3.csv("data/happiness.csv", d => ({ country: d.country, score: +d.score })),
]).then(([world, rows]) => {
  const happiness = new Map(rows.map(d => [d.country, d.score]));
  const ranked = [...rows].sort((a, b) => b.score - a.score);
  const rank = new Map(ranked.map((d, i) => [d.country, i + 1]));

  // Summary cards
  const best = ranked[0], worst = ranked[ranked.length - 1];
  d3.select("#sAvg").text(d3.mean(rows, d => d.score).toFixed(2));
  d3.select("#sCount").text(`across ${rows.length} countries`);
  d3.select("#sTopScore").text(best.score.toFixed(2));
  d3.select("#sTop").text(best.country);
  d3.select("#sLowScore").text(worst.score.toFixed(2));
  d3.select("#sLow").text(worst.country);
  d3.select("#sGap").text((best.score - worst.score).toFixed(2));

  const countries = topojson.feature(world, world.objects.countries);
  // Mercator blows up near the poles, so drop Antarctica.
  countries.features = countries.features.filter(d => d.properties.name !== "Antarctica");

  const projection = d3.geoMercator().fitExtent([[5, 5], [W - 5, H - 5]], countries);
  const path = d3.geoPath(projection);

  const [lo, hi] = d3.extent(rows, d => d.score);
  // Offset so the lightest country is still visibly blue, not white.
  const blues = t => d3.interpolateBlues(0.15 + 0.85 * t);
  const color = d3.scaleSequential(blues).domain([lo, hi]);
  const fill = name => happiness.has(name) ? color(happiness.get(name)) : "var(--nodata)";

  let selected = null;

  const paths = g.selectAll("path")
    .data(countries.features)
    .join("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", d => fill(d.properties.name))
      .on("mousemove", (e, d) => {
        const v = happiness.get(d.properties.name);
        tip.style("opacity", 1)
           .style("left", e.clientX + 12 + "px").style("top", e.clientY + 12 + "px")
           .text(`${d.properties.name}: ${v != null ? v.toFixed(2) : "no data"}`);
      })
      .on("mouseleave", () => tip.style("opacity", 0))
      .on("click", (e, d) => { e.stopPropagation(); select(d.properties.name, true); });

  // Zoom / pan
  const zoom = d3.zoom().scaleExtent([1, 10])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);
  svg.on("click", () => select(null));

  d3.select("#zoom-in").on("click", () => svg.transition().call(zoom.scaleBy, 1.6));
  d3.select("#zoom-out").on("click", () => svg.transition().call(zoom.scaleBy, 1 / 1.6));
  d3.select("#reset").on("click", () => { select(null); resetView(); });
  const resetView = () => svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity);

  function zoomTo(feature) {
    const [[x0, y0], [x1, y1]] = path.bounds(feature);
    const k = Math.max(1, Math.min(8, 0.8 / Math.max((x1 - x0) / W, (y1 - y0) / H)));
    const t = d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    svg.transition().duration(700).call(zoom.transform, t);
  }

  // Selection + detail card
  function select(name, doZoom) {
    selected = name;
    paths.classed("selected", d => d.properties.name === name);
    const detail = d3.select("#detail");
    if (!name) {
      detail.html("<h2>Select a country</h2><p class='muted'>Click the map, search, or pick one from the rankings.</p>");
      return;
    }
    const v = happiness.get(name);
    if (v == null) {
      detail.html(`<h2></h2><p class="muted">No data for this country.</p>`).select("h2").text(name);
    } else {
      detail.html(`<h2></h2>
        <div class="big">${v.toFixed(2)}</div>
        <div class="bar"><i style="width:${(v / 10) * 100}%"></i></div>
        <p class="muted">Rank ${rank.get(name)} of ${rows.length}</p>`).select("h2").text(name);
    }
    if (doZoom) zoomTo(countries.features.find(f => f.properties.name === name));
  }

  // Search
  d3.select("#countries").selectAll("option").data(ranked.map(d => d.country).sort()).join("option").attr("value", d => d);
  d3.select("#search").on("change", function () {
    const match = [...happiness.keys()].find(k => k.toLowerCase() === this.value.trim().toLowerCase());
    if (match) { select(match, true); this.blur(); }
  });

  // Top / bottom lists
  function fillList(sel, data) {
    d3.select(sel).selectAll("li").data(data).join("li").append("button")
      .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`)
      .on("click", (e, d) => select(d.country, true))
      .on("mouseenter", (e, d) => paths.classed("dim", p => p.properties.name !== d.country))
      .on("mouseleave", () => paths.classed("dim", false));
  }
  fillList("#top", ranked.slice(0, 10));
  fillList("#bottom", ranked.slice(-10).reverse());

  // Legend
  const lw = 220, lh = 10, lx = 20, ly = H - 36;
  const grad = svg.append("defs").append("linearGradient").attr("id", "lg");
  d3.range(0, 1.01, 0.1).forEach(t =>
    grad.append("stop").attr("offset", t * 100 + "%").attr("stop-color", color(lo + t * (hi - lo))));
  const leg = svg.append("g").attr("class", "legend").attr("transform", `translate(${lx},${ly})`);
  leg.append("rect").attr("width", lw).attr("height", lh).attr("fill", "url(#lg)");
  leg.append("text").attr("y", lh + 12).text(lo.toFixed(1));
  leg.append("text").attr("x", lw).attr("y", lh + 12).attr("text-anchor", "end").text(hi.toFixed(1));
  leg.append("text").attr("y", -5).text("Happiness score");

  // Colour-blind palette toggle, remembered between visits. Cividis reads the same
  // with red-green or blue-yellow colour blindness.
  function setPalette(cvd) {
    color.interpolator(cvd ? d3.interpolateCividis : blues);
    paths.attr("fill", d => fill(d.properties.name));
    grad.selectAll("stop").attr("stop-color", (t, i) => color(lo + i / 10 * (hi - lo)));
    document.body.classList.toggle("cvd", cvd);
    d3.select("#palette").attr("aria-pressed", cvd);
    try { localStorage.setItem("palette", cvd ? "cvd" : "blues"); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem("palette"); } catch (e) {}
  if (saved === "cvd") setPalette(true);
  d3.select("#palette").on("click", function () { setPalette(this.getAttribute("aria-pressed") !== "true"); });
}).catch(err => {
  d3.select("#detail").html(`<h2>Couldn't load data</h2><p class="muted">${err.message}. If opening the file directly, run a local server (see README).</p>`);
});

// Highlight the rail icon for the section in view
const navLinks = [...document.querySelectorAll("#nav a")];
const spy = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
}), { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main > section").forEach(sec => spy.observe(sec));
