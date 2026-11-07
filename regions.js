// The regions page: a bar for each region's average, and a click shows its countries.
loadHappiness().then(({ rows, ranked, regions, rank }) => {
  const world = d3.mean(rows, d => d.score);
  const pct = v => `${v / 10 * 100}%`; // scores run from 0 to 10
  const list = [...regions].map(([name, r]) => ({ name, ...r })).sort((a, b) => b.avg - a.avg);

  const url = c => `country.html?c=${encodeURIComponent(c)}`;
  const vs = v => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)} vs the world`;

  d3.select("#regionNote").text(`The tick on each bar marks the world average of ${world.toFixed(2)}, across ${rows.length} countries.`);

  const bars = d3.select("#regionBars").selectAll("li").data(list).join("li").append("button")
    .attr("class", "region-bar")
    .on("click", (e, d) => select(d));
  bars.append("span").attr("class", "region-name").text(d => d.name);
  const track = bars.append("span").attr("class", "region-track").attr("aria-hidden", "true");
  track.append("i").attr("class", "fill").style("width", d => pct(d.avg));
  track.append("i").attr("class", "tick").style("left", pct(world));
  bars.append("span").attr("class", "score").text(d => d.avg.toFixed(2));

  function select(region) {
    bars.attr("aria-pressed", d => d === region);
    const countries = ranked.filter(d => d.region === region.name);
    d3.select("#regionTitle").text(region.name);
    d3.select("#regionAvg").text(region.avg.toFixed(2));
    d3.select("#regionN").text(`${region.n} ${region.n === 1 ? "country" : "countries"}`);
    d3.select("#regionDiff").text(vs(region.avg - world));
    d3.select("#regionCountries").selectAll("li").data(countries, d => d.country).join(enter => {
      const li = enter.append("li");
      li.append("a").attr("href", d => url(d.country))
        .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`);
      return li;
    }).order();
    d3.select("#regionCountries").property("scrollTop", 0);
  }
  select(list[0]);
}).catch(err => loadError("#regions .card", err));
