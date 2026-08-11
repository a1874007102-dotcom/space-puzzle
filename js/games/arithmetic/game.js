(function () {
  "use strict";

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var rules = window.Superpowers.arithmeticRules;

  var save = null;
  var state = null;
  var level = 1;
  var stopTimer = null;
  var screen = document.getElementById("screen");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderDifficulty() {
    screen.innerHTML = "";
    screen.appendChild(el("h2", "sp-game-title", "选择难度"));
    var names = { 1: "新手", 2: "探险家", 3: "舰长" };
    for (var lv = 1; lv <= 3; lv++) {
      (function (levelNumber) {
        var unlocked = scoring.difficultyUnlocked(save.games.arithmetic, levelNumber);
        var label = names[levelNumber] + (unlocked ? "" : "（需 " + 2 * (levelNumber - 1) + " 星）");
        var btn = el("button", "sp-btn sp-difficulty" + (unlocked ? "" : " sp-btn-locked"), label);
        btn.addEventListener("click", function () { if (unlocked) start(levelNumber); });
        screen.appendChild(btn);
      })(lv);
    }
  }

  function start(lv) {
    level = lv;
    state = rules.emptyState();
    renderGame();
    nextQuestion();
    stopTimer = ui.startCountdown(60, function (remaining) {
      document.getElementById("timer").textContent = "⏱ " + remaining;
    }, function () { endRound(); });
  }

  function renderGame() {
    screen.innerHTML = "";
    var line = el("div", "sp-stat-line");
    line.appendChild(el("span", "sp-timer", "⏱ 60"));
    line.appendChild(el("span", "sp-score", "得分 0"));
    line.appendChild(el("span", "sp-combo", "连击 0"));
    screen.appendChild(line);
    screen.appendChild(el("div", "sp-question", ""));
    screen.appendChild(el("div", "sp-options", ""));
  }

  function nextQuestion() {
    var q = rules.makeQuestion(level);
    document.querySelector(".sp-question").textContent = q.text;
    var wrap = document.querySelector(".sp-options");
    wrap.innerHTML = "";
    q.options.forEach(function (opt) {
      var btn = el("button", "sp-btn sp-option", String(opt));
      btn.addEventListener("click", function () { answer(q, opt); });
      wrap.appendChild(btn);
    });
  }

  function answer(q, chosen) {
    state.answered += 1;
    if (rules.checkAnswer(q, chosen)) {
      state.correct += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      state.points += rules.pointsForCorrect(state.combo);
      audio.play("correct");
    } else {
      state.combo = 0;
      audio.play("wrong");
    }
    document.querySelector(".sp-score").textContent = "得分 " + state.points;
    document.querySelector(".sp-combo").textContent = "连击 " + state.combo;
    nextQuestion();
  }

  function endRound() {
    if (stopTimer) { stopTimer(); stopTimer = null; }
    var stars = rules.starsForRound(state.correct, state.answered);
    save = scoring.applyResult(save, "arithmetic", {
      level: level,
      stars: stars,
      score: state.points,
      points: state.points,
      playedAt: new Date().toISOString()
    });
    storage.save(save);
    audio.play("win");
    ui.showResult({
      stars: stars,
      points: state.points,
      message: "答对 " + state.correct + " / " + state.answered + " 题",
      onReplay: function () { renderDifficulty(); },
      onHome: function () { window.location.href = "index.html"; }
    });
  }

  function init() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    document.getElementById("muteBtn").textContent = save.settings.muted ? "🔇" : "🔊";
    document.getElementById("muteBtn").addEventListener("click", function () {
      save.settings.muted = !save.settings.muted;
      audio.setMuted(save.settings.muted);
      storage.save(save);
      document.getElementById("muteBtn").textContent = save.settings.muted ? "🔇" : "🔊";
    });
    document.addEventListener("pointerdown", function () { audio.init(); }, { once: true });
    renderDifficulty();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
