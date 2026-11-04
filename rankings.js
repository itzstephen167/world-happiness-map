loadHappiness().then(({ ranked, rank }) => {
  function fillList(sel, data) {
    d3.select(sel).selectAll("li").data(data).join("li").append("a")
      .attr("href", d => `index.html?c=${encodeURIComponent(d.country)}`)
      .html(d => `<span class="rank">${rank.get(d.country)}</span><span>${d.country}</span><span class="score">${d.score.toFixed(2)}</span>`);
  }
  fillList("#top", ranked.slice(0, 10));
  fillList("#bottom", ranked.slice(-10).reverse());
}).catch(err => loadError("#rankings .card", err));
