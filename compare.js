loadHappiness().then(({ rows, ranked, happiness, regionOf, regions, rank, best, worst }) => {
  const names = ranked.map(d => d.country).sort();
  const cmpA = d3.select("#cmpA"), cmpB = d3.select("#cmpB");
  [cmpA, cmpB].forEach(s => s.selectAll("option").data(names).join("option").attr("value", d => d).text(d => d));
  // Defaults to the happiest and least happy; compare.html?a=Finland starts from a chosen country.
  const q = new URLSearchParams(location.search);
  const a0 = happiness.has(q.get("a")) ? q.get("a") : best.country;
  const b0 = happiness.has(q.get("b")) ? q.get("b") : a0 === worst.country ? best.country : worst.country;
  cmpA.property("value", a0);
  cmpB.property("value", b0);
  function compare() {
    const pair = [cmpA.property("value"), cmpB.property("value")];
    d3.select("#cmp").selectAll(".cmp-side").data(pair).join("div").attr("class", "cmp-side")
      .html(n => `<h3></h3>
        <div class="big">${happiness.get(n).toFixed(2)}</div>
        <div class="bar"><i style="width:${(happiness.get(n) / 10) * 100}%"></i></div>
        <p class="muted">Rank ${rank.get(n)} of ${rows.length}</p>
        <p class="muted"></p>`)
      .each(function (n) {
        d3.select(this).select("h3").text(n);
        d3.select(this).select("p:last-child").text(`${regionOf.get(n)} · region avg ${regions.get(regionOf.get(n)).avg.toFixed(2)}`);
      });
    const [a, b] = pair, diff = happiness.get(a) - happiness.get(b);
    d3.select("#cmpGap").text(a === b ? "Pick two different countries to compare."
      : Math.abs(diff) < 0.005 ? `${a} and ${b} have the same score.`
      : `${diff > 0 ? a : b} scores ${Math.abs(diff).toFixed(2)} points higher than ${diff > 0 ? b : a}.`);
  }
  cmpA.on("change", compare);
  cmpB.on("change", compare);
  compare();
}).catch(err => loadError("#compare .card", err));
