(function () {
  "use strict";

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var rules = window.Superpowers.memoryRules;

  var save = null;
  var level = 1;
  var board = [];
  var matched = 0;
  var steps = 0;
  var first = null;
  var lock = false;
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
        var unlocked = scoring.difficultyUnlocked(save.games.memory, levelNumber);
        var label = names[levelNumber] + (unlocked ? "" : "（需 " + 2 * (levelNumber - 1) + " 星）");
        var btn = el("button", "sp-btn sp-difficulty" + (unlocked ? "" : " sp-btn-locked"), label);
        btn.addEventListener("click", function () { if (unlocked) start(levelNumber); });
        screen.appendChild(btn);
      })(lv);
    }
  }

  function start(lv) {
    level = lv;
    var pairs = rules.makePairs(level);
    board = rules.buildBoard(pairs);
    matched = 0;
    steps = 0;
    first = null;
    lock = false;
    renderBoard(pairs.length);
    renderCards();
  }

  function renderBoard(pairCount) {
    screen.innerHTML = "";
    var line = el("div", "sp-stat-line");
    var matchedSpan = el("span", "sp-matched", "已配对 0 / " + pairCount);
    var stepsSpan = el("span", "sp-steps", "步数 0");
    line.appendChild(matchedSpan);
    line.appendChild(stepsSpan);
    screen.appendChild(line);
    var grid = el("div", "sp-board");
    grid.id = "board";
    var size = rules.gridSize(level);
    grid.style.gridTemplateColumns = "repeat(" + size.cols + ", 1fr)";
    screen.appendChild(grid);
  }

  function renderCards() {
    var grid = document.getElementById("board");
    grid.innerHTML = "";
    board.forEach(function (card, index) {
      var btn = el("button", "sp-card", "");
      btn.dataset.index = index;
      btn.addEventListener("click", function () { flip(index, btn); });
      grid.appendChild(btn);
    });
  }

  function flip(index, node) {
    if (lock || node.classList.contains("sp-card-open") || node.classList.contains("sp-card-matched")) return;
    var card = board[index];
    node.classList.add("sp-card-open");
    node.textContent = card.label;
    audio.play("flip");
    if (!first) { first = { index: index, node: node, card: card }; return; }
    steps += 1;
    document.querySelector(".sp-steps").textContent = "步数 " + steps;
    if (first.card.pairId === card.pairId) {
      matched += 1;
      first.node.classList.add("sp-card-matched");
      node.classList.add("sp-card-matched");
      document.querySelector(".sp-matched").textContent = "已配对 " + matched + " / " + (board.length / 2);
      first = null;
      audio.play("correct");
      if (matched === board.length / 2) winRound();
    } else {
      lock = true;
      audio.play("wrong");
      var prev = first;
      first = null;
      setTimeout(function () {
        prev.node.classList.remove("sp-card-open");
        prev.node.textContent = "";
        node.classList.remove("sp-card-open");
        node.textContent = "";
        lock = false;
      }, 600);
    }
  }

  function winRound() {
    var pairCount = board.length / 2;
    var stars = rules.starsForGame(pairCount, steps);
    var points = rules.pointsForGame(pairCount, steps);
    save = scoring.applyResult(save, "memory", {
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
      message: "用了 " + steps + " 步完成",
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
