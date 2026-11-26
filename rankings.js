loadHappiness().then(({ rows, ranked, rank, regions }) => {
  function fillList(sel, data) {
    d3.select(sel).selectAll("li").data(data).join("li").append("a")
      .attr("href", d => `index.html?c=${encodeURIComponent(d.country)}`)
      .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`);
  }
  fillList("#top", ranked.slice(0, 10));
  fillList("#bottom", ranked.slice(-10).reverse());

  // Score distribution: how many countries fall in each half-point band, with one country marked
  const DW = 720, DH = 230, M = { t: 16, r: 12, b: 34, l: 34 };
  const x = d3.scaleLinear().domain([Math.floor(d3.min(rows, d => d.score)), Math.ceil(d3.max(rows, d => d.score))]).range([M.l, DW - M.r]);
  const bins = d3.bin().domain(x.domain()).thresholds(d3.range(x.domain()[0], x.domain()[1], 0.5))(rows.map(d => d.score));
  const y = d3.scaleLinear().domain([0, d3.max(bins, b => b.length)]).nice().range([DH - M.b, M.t]);
  const dist = d3.select("#dist");
  dist.append("g").attr("class", "dist-axis").attr("transform", `translate(0,${DH - M.b})`)
    .call(d3.axisBottom(x).ticks(x.domain()[1] - x.domain()[0]).tickSizeOuter(0));
  dist.append("g").attr("class", "dist-axis").attr("transform", `translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(4).tickSize(-(DW - M.l - M.r))).call(g => g.select(".domain").remove());
  dist.append("text").attr("class", "dist-label").attr("x", DW - M.r).attr("y", DH - 4).attr("text-anchor", "end").text("Happiness score");
  const bars = dist.append("g").selectAll("rect").data(bins).join("rect")
    .attr("class", "dist-bar").attr("x", b => x(b.x0) + 1).attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 2))
    .attr("y", b => y(b.length)).attr("height", b => y(0) - y(b.length)).attr("rx", 3);
  bars.append("title").text(b => `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}: ${b.length} ${b.length === 1 ? "country" : "countries"}`);
  // Table fallback: the same counts as the bars
  const distRows = d3.select("#distTable").selectAll("tr").data(bins).join("tr");
  distRows.append("td").text(b => `${b.x0.toFixed(1)}–${b.x1.toFixed(1)}`);
  distRows.append("td").attr("class", "num").append("span").attr("class", "score").text(b => b.length);
  const mark = dist.append("g").attr("class", "dist-mark").style("display", "none");
  mark.append("line").attr("y1", M.t - 6).attr("y2", DH - M.b);
  const markText = mark.append("text").attr("y", M.t - 6);

  const distPick = d3.select("#distPick");
  distPick.selectAll("option").data(["", ...ranked.map(d => d.country).sort()]).join("option")
    .attr("value", d => d).text(d => d || "Mark a country…");
  function drawMark() {
    const name = distPick.property("value"), d = rows.find(r => r.country === name);
    const bin = d && bins.find(b => d.score >= b.x0 && (d.score < b.x1 || b === bins[bins.length - 1]));
    bars.classed("on", b => b === bin);
    mark.style("display", d ? null : "none");
    const peak = bins[d3.maxIndex(bins, b => b.length)];
    const total = `${rows.length} countries in half-point bands. The most common band is ${peak.x0.toFixed(1)}–${peak.x1.toFixed(1)}, with ${peak.length} countries.`;
    if (!d) { d3.select("#distDesc").text(total); return; }
    const px = x(d.score), right = px > DW - 140;
    mark.attr("transform", `translate(${px},0)`);
    markText.attr("x", right ? -6 : 6).attr("text-anchor", right ? "end" : "start").text(`${d.country} ${d.score.toFixed(2)}`);
    d3.select("#distDesc").text(`${total} ${d.country} scores ${d.score.toFixed(2)}, ranked ${rank.get(d.country)} of ${rows.length}, in the ${bin.x0.toFixed(1)}–${bin.x1.toFixed(1)} band${bin.length === 1 ? ", on its own" : ` with ${bin.length - 1} other ${bin.length === 2 ? "country" : "countries"}`}.`);
  }
  distPick.on("change", drawMark);
  drawMark();

  // Biggest movers: change in score between an earlier year and the latest one, for countries scored in both
  d3.csv("data/happiness_history.csv", d => ({ country: d.country, year: +d.year, score: +d.score })).then(history => {
    const byYear = d3.rollup(history, v => new Map(v.map(d => [d.country, d.score])), d => d.year);
    const years = [...byYear.keys()].sort(d3.ascending);
    const latest = years[years.length - 1], now = byYear.get(latest);
    const signed = v => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;

    const fromSel = d3.select("#moversFrom");
    fromSel.selectAll("option").data(years.slice(0, -1)).join("option").attr("value", d => d).text(d => d);

    function fillMovers(sel, data) {
      d3.select(sel).selectAll("li").data(data, d => d.country).join("li").html("").append("a")
        .attr("href", d => `index.html?c=${encodeURIComponent(d.country)}`)
        .html((d, i) => `<span class="rank">${i + 1}</span><span>${d.country}<small class="muted">${d.from.toFixed(2)} → ${d.to.toFixed(2)}</small></span><span class="score">${signed(d.change)}</span>`);
      d3.select(sel).selectAll("li").order();
    }
    function drawMovers() {
      const year = +fromSel.property("value"), then = byYear.get(year);
      const moved = [...now].filter(([c]) => then.has(c) && rank.has(c))
        .map(([country, to]) => ({ country, from: then.get(country), to, change: to - then.get(country) }))
        .sort((a, b) => b.change - a.change);
      fillMovers("#risers", moved.filter(d => d.change > 0).slice(0, 10));
      fillMovers("#fallers", moved.filter(d => d.change < 0).reverse().slice(0, 10));
      d3.select("#moversNote").text(`Change in score from ${year} to ${latest}, for the ${moved.length} countries scored in both years. Each year's score is the report's three-year average ending in that year.`);
    }
    fromSel.on("change", drawMovers);
    drawMovers();
  }).catch(err => d3.select("#moversNote").text(`Couldn't load the score history: ${err.message}.`));

  // Full table: sort by any column, filter by name and region
  const table = rows.map(d => ({ ...d, rank: rank.get(d.country), diff: d.score - regions.get(d.region).avg }));
  const firstDir = { rank: 1, country: 1, region: 1, score: -1, diff: -1 };
  let sortKey = "rank", sortDir = 1;
  let shown = table; // rows currently in the table, in display order (what the CSV export saves)

  const regionSel = d3.select("#tableRegion");
  regionSel.selectAll("option").data(["", ...[...regions.keys()].sort()]).join("option")
    .attr("value", d => d).text(d => d || "All regions");

  function drawTable() {
    const needle = d3.select("#tableSearch").property("value").trim().toLowerCase();
    const region = regionSel.property("value");
    shown = table
      .filter(d => d.country.toLowerCase().includes(needle) && (!region || d.region === region))
      .sort((a, b) => (d3.ascending(a[sortKey], b[sortKey]) * sortDir) || a.rank - b.rank);

    d3.select("#tableCount").text(shown.length === rows.length ? `All ${rows.length} countries`
      : shown.length ? `${shown.length} of ${rows.length} countries` : "No countries match.");
    d3.select("#tableCsv").property("disabled", !shown.length);
    d3.selectAll(".rank-table th").attr("aria-sort", function () {
      return this.dataset.k === sortKey ? (sortDir > 0 ? "ascending" : "descending") : null;
    });

    const tr = d3.select("#tableBody").selectAll("tr").data(shown, d => d.country).join(enter => {
      const row = enter.append("tr");
      row.append("td").append("span").attr("class", "rank").text(d => d.rank);
      row.append("td").append("a").attr("href", d => `index.html?c=${encodeURIComponent(d.country)}`).text(d => d.country);
      row.append("td").attr("class", "col-region muted").text(d => d.region);
      row.append("td").attr("class", "num").append("span").attr("class", "score").text(d => d.score.toFixed(2));
      row.append("td").attr("class", "num").append("span")
        .attr("class", d => d.diff >= 0 ? "badge green" : "badge")
        .text(d => `${d.diff >= 0 ? "+" : "−"}${Math.abs(d.diff).toFixed(2)}`);
      return row;
    });
    tr.order();
  }

  d3.selectAll(".rank-table th button").on("click", function () {
    const k = this.parentNode.dataset.k;
    sortDir = k === sortKey ? -sortDir : firstDir[k];
    sortKey = k;
    drawTable();
  });
  d3.select("#tableSearch").on("input", drawTable);
  regionSel.on("change", drawTable);

  // CSV export: the rows on screen, with the current filter and sort applied
  const csvCell = v => /[",\n]/.test(v) ? `"${String(v).replace(/"/g, '""')}"` : v;
  function tableCsv() {
    const lines = shown.map(d => [d.rank, d.country, d.region, d.score.toFixed(2), d.diff.toFixed(2)].map(csvCell).join(","));
    return ["rank,country,region,score,vs_region_average", ...lines].join("\n") + "\n";
  }
  d3.select("#tableCsv").on("click", () => {
    const region = regionSel.property("value");
    const slug = region ? "-" + region.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([tableCsv()], { type: "text/csv;charset=utf-8" }));
    a.download = `happiness-rankings${slug}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  });
  drawTable();
}).catch(err => loadError("#rankings .card", err));
