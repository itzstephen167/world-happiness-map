// The game page: pick which of two countries scores higher, with a running score.
loadHappiness().then(({ rows }) => {
  const url = c => `country.html?c=${encodeURIComponent(c)}`;
  const picks = d3.selectAll(".game-pick");
  let pair, answered, round = 0, right = 0, streak = 0, best = 0;

  // Two different countries with different scores, so there is always one right answer.
  function draw() {
    let a, b;
    do {
      a = rows[Math.floor(Math.random() * rows.length)];
      b = rows[Math.floor(Math.random() * rows.length)];
    } while (a === b || a.score === b.score);
    return [a, b];
  }

  function next() {
    pair = draw(); answered = false; round++;
    d3.select("#gameRound").text(`Round ${round}`);
    picks.data(pair).attr("class", "game-pick").property("disabled", false).attr("aria-label", d => `${d.country}, ${d.region}`);
    picks.select(".game-name").text(d => d.country);
    picks.select(".game-region").text(d => d.region);
    picks.select(".game-score").text("?");
    d3.select("#gameResult").text("");
    d3.select("#gameNext").attr("hidden", "");
  }

  function guess(d) {
    if (answered) return;
    answered = true;
    const win = d3.max(pair, p => p.score), ok = d.score === win;
    right += ok; streak = ok ? streak + 1 : 0; best = Math.max(best, streak);
    picks.property("disabled", true)
      .classed("right", p => p.score === win)
      .classed("wrong", p => p === d && !ok);
    picks.select(".game-score").text(p => p.score.toFixed(2));
    const [hi, lo] = pair[0].score > pair[1].score ? pair : [pair[1], pair[0]];
    d3.select("#gameResult").html(`${ok ? "Correct!" : "Not this time."} <a href="${url(hi.country)}">${hi.country}</a> scores ${hi.score.toFixed(2)}, ${(hi.score - lo.score).toFixed(2)} above <a href="${url(lo.country)}">${lo.country}</a>.`);
    tally();
    d3.select("#gameNext").attr("hidden", null).node().focus();
  }

  function tally() {
    const played = round - !answered;
    d3.select("#gameScore").text(`${right} / ${played}`);
    d3.select("#gamePct").text(played ? `${Math.round(right / played * 100)}% correct` : "No guesses yet");
    d3.select("#gameStreak").text(streak);
    d3.select("#gameBest").text(best);
  }

  picks.on("click", (e, d) => guess(d));
  d3.select("#gameNext").on("click", next);
  d3.select("#gameReset").on("click", () => { round = right = streak = best = 0; next(); tally(); });
  next();
}).catch(err => loadError("#game .card", err));
