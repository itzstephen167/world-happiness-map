// The game page: pick which of two countries scores higher, or guess one country's score, with a running score.
// Best streaks are remembered per mode on this device.
loadHappiness().then(({ rows }) => {
  const url = c => `country.html?c=${encodeURIComponent(c)}`;
  const picks = d3.selectAll(".game-pick");
  const CLOSE = 0.5; // a score guess counts when it is within half a point
  const BEST_KEY = "whm-game-best";
  let bests = {};
  try { bests = JSON.parse(localStorage.getItem(BEST_KEY)) || {}; } catch (e) {}
  let mode = "higher", pair, solo, answered, round = 0, right = 0, streak = 0, best = bests[mode] || 0;

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
    answered = false; round++;
    d3.select("#gameRound").text(`Round ${round}`);
    d3.select("#gameResult").text("");
    d3.select("#gameNext").attr("hidden", "");
    if (mode === "score") {
      solo = rows[Math.floor(Math.random() * rows.length)];
      d3.select("#soloName").text(solo.country);
      d3.select("#soloRegion").text(solo.region);
      d3.select("#soloScore").text("?");
      d3.select("#soloGo").property("disabled", false);
      d3.select("#soloRange").property("disabled", false);
      return;
    }
    pair = draw();
    picks.data(pair).attr("class", "game-pick").property("disabled", false).attr("aria-label", d => `${d.country}, ${d.region}`);
    picks.select(".game-name").text(d => d.country);
    picks.select(".game-region").text(d => d.region);
    picks.select(".game-score").text("?");
  }

  function guess(d) {
    if (answered) return;
    answered = true;
    const win = d3.max(pair, p => p.score), ok = d.score === win;
    score(ok);
    picks.property("disabled", true)
      .classed("right", p => p.score === win)
      .classed("wrong", p => p === d && !ok);
    picks.select(".game-score").text(p => p.score.toFixed(2));
    const [hi, lo] = pair[0].score > pair[1].score ? pair : [pair[1], pair[0]];
    d3.select("#gameResult").html(`${ok ? "Correct!" : "Not this time."} <a href="${url(hi.country)}">${hi.country}</a> scores ${hi.score.toFixed(2)}, ${(hi.score - lo.score).toFixed(2)} above <a href="${url(lo.country)}">${lo.country}</a>.`);
    tally();
    d3.select("#gameNext").attr("hidden", null).node().focus();
  }

  // Guess-the-score round: right when the guess is within CLOSE of the real score
  function guessScore() {
    if (answered) return;
    answered = true;
    const g = +d3.select("#soloRange").property("value"), off = g - solo.score, ok = Math.abs(off) <= CLOSE;
    score(ok);
    d3.select("#soloScore").text(solo.score.toFixed(2));
    d3.select("#soloGo").property("disabled", true);
    d3.select("#soloRange").property("disabled", true);
    d3.select("#gameResult").html(`${ok ? "Close enough!" : "Not this time."} <a href="${url(solo.country)}"></a> scores ${solo.score.toFixed(2)}; you guessed ${g.toFixed(1)}, ${Math.abs(off).toFixed(2)} ${off > 0 ? "too high" : "too low"}.`)
      .select("a").text(solo.country);
    tally();
    d3.select("#gameNext").attr("hidden", null).node().focus();
  }

  function score(ok) {
    right += ok; streak = ok ? streak + 1 : 0;
    if (streak > best) {
      best = streak; bests[mode] = best;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(bests)); } catch (e) {}
    }
  }

  function tally() {
    const played = round - !answered;
    d3.select("#gameScore").text(`${right} / ${played}`);
    d3.select("#gamePct").text(played ? `${Math.round(right / played * 100)}% correct` : "No guesses yet");
    d3.select("#gameStreak").text(streak);
    d3.select("#gameBest").text(best);
  }

  function setMode(m) {
    mode = m; round = right = streak = 0; best = bests[mode] || 0;
    d3.selectAll("#gameMode button").classed("on", function () { return this.dataset.m === mode; })
      .attr("aria-checked", function () { return this.dataset.m === mode; });
    d3.select("#gamePair").attr("hidden", mode === "score" ? "" : null);
    d3.select("#gameSolo").attr("hidden", mode === "score" ? null : "");
    d3.select("h1").text(mode === "score" ? "Guess the score" : "Which scores higher?");
    d3.select("#gameSub").text(mode === "score" ? `One country at a time. Guess its happiness score; within ${CLOSE} of the real one counts.` : "Two countries, one guess. Pick the one with the higher happiness score.");
    d3.select("#gameNext").text(mode === "score" ? "Next country →" : "Next pair →");
    d3.select("#gameNote").text(mode === "score" ? `Scores run from 0 to 10; most countries sit between 4 and 7.5.` : "Pairs never tie. Scores come from the same dataset as the map.");
    next(); tally();
  }

  picks.on("click", (e, d) => guess(d));
  d3.select("#soloRange").on("input", function () { d3.select("#soloOut").text((+this.value).toFixed(1)); });
  d3.select("#soloGo").on("click", guessScore);
  d3.select("#gameNext").on("click", next);
  d3.selectAll("#gameMode button").on("click", function () { setMode(this.dataset.m); });
  // Start over clears this round's score; the remembered best streak stays.
  d3.select("#gameReset").on("click", () => setMode(mode));
  setMode(new URLSearchParams(location.search).get("mode") === "score" ? "score" : "higher");
}).catch(err => loadError("#game .card", err));
