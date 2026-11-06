// One country's page: country.html?c=Finland
loadHappiness().then(({ rows, ranked, happiness, regionOf, regions, rank }) => {
  const name = new URLSearchParams(location.search).get("c");
  const url = c => `country.html?c=${encodeURIComponent(c)}`;

  const pick = d3.select("#cPick");
  pick.selectAll("option").data(["", ...ranked.map(d => d.country).sort()]).join("option")
    .attr("value", d => d).text(d => d || "Choose a country…");
  pick.on("change", function () { if (this.value) location.href = url(this.value); });

  if (!happiness.has(name)) {
    d3.select("#cName").text("Country");
    d3.select("#cMissing").attr("hidden", null);
    return;
  }
  pick.property("value", name);
  document.title = `${name} — World Happiness Map`;
  d3.select("#cBody").attr("hidden", null);

  const score = happiness.get(name), region = regionOf.get(name), reg = regions.get(region), world = d3.mean(rows, d => d.score);
  const vs = (v, label) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)} vs ${label}`;
  d3.select("#cName").text(name);
  d3.select("#cSub").text(region);
  d3.select("#cScore").text(score.toFixed(2));
  d3.select("#cRank").text(rank.get(name));
  d3.select("#cRankOf").text(`of ${rows.length} countries`);
  d3.select("#cRegion").text(reg.avg.toFixed(2));
  d3.select("#cRegionDiff").text(vs(score - reg.avg, `${reg.n} in region`));
  d3.select("#cWorld").text(world.toFixed(2));
  d3.select("#cWorldDiff").text(vs(score - world, "the world"));
  d3.select("#cMap").attr("href", `index.html?c=${encodeURIComponent(name)}`);
  d3.select("#cCompare").attr("href", `compare.html?a=${encodeURIComponent(name)}`);

  function fillList(sel, data) {
    d3.select(sel).selectAll("li").data(data).join("li")
      .attr("class", d => d.country === name ? "current" : null)
      .append("a")
      .attr("href", d => url(d.country))
      .attr("aria-current", d => d.country === name ? "page" : null)
      .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`);
  }
  // Three places either side, or more on one side at the very top or bottom.
  const at = rank.get(name) - 1, from = Math.max(0, Math.min(at - 3, ranked.length - 7));
  fillList("#cNear", ranked.slice(from, from + 7));
  d3.select("#cPeersTitle").text(region);
  fillList("#cPeers", ranked.filter(d => d.region === region));
  const here = document.querySelector("#cPeers .current");
  if (here) here.parentNode.scrollTop = here.offsetTop - here.parentNode.offsetTop - 60;
}).catch(err => loadError("#country", err));
