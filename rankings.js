loadHappiness().then(({ rows, ranked, rank, regions }) => {
  function fillList(sel, data) {
    d3.select(sel).selectAll("li").data(data).join("li").append("a")
      .attr("href", d => `index.html?c=${encodeURIComponent(d.country)}`)
      .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`);
  }
  fillList("#top", ranked.slice(0, 10));
  fillList("#bottom", ranked.slice(-10).reverse());

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
