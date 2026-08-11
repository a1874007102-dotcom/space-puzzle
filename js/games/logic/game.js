(function () {
  "use strict";

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var rules = window.Superpowers.logicRules;

  var save = null;
  var level = 1;
  var questions = [];
  var index = 0;
  var correct = 0;
  var points = 0;
  var screen = document.getElementById("screen");

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function starsText(stars) {
    return "★".repeat(stars) + "☆".repeat(3 - stars);
  }

  function renderDifficulty() {
    screen.innerHTML = "";
    screen.appendChild(el("h2", "sp-game-title", "选择难度"));
    var names = { 1: "新手", 2: "探险家", 3: "舰长" };
    for (var lv = 1; lv <= 3; lv++) {
      (function (levelNumber) {
        var game = save.games.logic || {};
        var stars = (game.levels && game.levels[levelNumber]) || 0;
        var unlocked = scoring.difficultyUnlocked(game, levelNumber);
        var label = names[levelNumber] + " " + starsText(stars) + (unlocked ? "" : "（需 " + 2 * (levelNumber - 1) + " 星）");
        var btn = el("button", "sp-btn sp-difficulty" + (unlocked ? "" : " sp-btn-locked"), label);
        btn.addEventListener("click", function () { if (unlocked) start(levelNumber); });
        screen.appendChild(btn);
      })(lv);
    }
  }

  function start(lv) {
    level = lv;
    questions = rules.buildRound(level);
    index = 0;
    correct = 0;
    points = 0;
    renderQuestion();
  }

  function renderQuestion() {
    screen.innerHTML = "";
    var line = el("div", "sp-stat-line");
    line.appendChild(el("span", "sp-progress", "第 " + (index + 1) + " / 10 题"));
    line.appendChild(el("span", "sp-score", "得分 " + points));
    screen.appendChild(line);
    var q = questions[index];
    screen.appendChild(el("div", "sp-question sp-question-logic", q.text));
    var wrap = el("div", "sp-options");
    q.options.forEach(function (opt) {
      var btn = el("button", "sp-btn sp-option", opt);
      btn.addEventListener("click", function () { answer(q, opt); });
      wrap.appendChild(btn);
    });
    screen.appendChild(wrap);
  }

  function answer(q, chosen) {
    if (rules.checkAnswer(q, chosen)) {
      correct += 1;
      points += 10;
      audio.play("correct");
    } else {
      audio.play("wrong");
    }
    index += 1;
    if (index >= questions.length) {
      endRound();
    } else {
      renderQuestion();
    }
  }

  function endRound() {
    var stars = rules.starsForRound(correct, questions.length);
    save = scoring.applyResult(save, "logic", {
      level: level,
      stars: stars,
      score: points,
      points: points,
      playedAt: new Date().toISOString()
    });
    storage.save(save);
    audio.play("win");
    ui.showResult({
      stars: stars,
      points: points,
      message: "答对 " + correct + " / 10 题",
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
