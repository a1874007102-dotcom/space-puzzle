(function () {
  "use strict";

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var wordsData = window.Superpowers.spellingWords;
  var rules = window.Superpowers.spellingRules;

  var save = null;
  var lang = "en";
  var level = 1;
  var words = [];
  var index = 0;
  var correct = 0;
  var points = 0;
  var attempt = 1;
  var selected = [];
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

  function speak(text) {
    try {
      if (window.speechSynthesis) {
        var u = new SpeechSynthesisUtterance(text);
        u.lang = "en-US";
        window.speechSynthesis.speak(u);
      }
    } catch (e) { /* 发音不可用时静默降级 */ }
  }

  function renderLang() {
    screen.innerHTML = "";
    screen.appendChild(el("h2", "sp-game-title", "选择语言"));
    var langs = [{ id: "en", name: "英语" }, { id: "zh", name: "中文" }];
    langs.forEach(function (item) {
      var btn = el("button", "sp-btn sp-difficulty", item.name);
      btn.addEventListener("click", function () { lang = item.id; renderDifficulty(); });
      screen.appendChild(btn);
    });
  }

  function renderDifficulty() {
    screen.innerHTML = "";
    screen.appendChild(el("h2", "sp-game-title", "选择难度"));
    var names = { 1: "新手", 2: "探险家", 3: "舰长" };
    for (var lv = 1; lv <= 3; lv++) {
      (function (levelNumber) {
        var game = save.games.spelling || {};
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
    var pool = wordsData.getPool(lang, level);
    words = rules.pickWords(pool, 10);
    index = 0;
    correct = 0;
    points = 0;
    renderRoundHeader();
    renderWord();
  }

  function renderRoundHeader() {
    screen.innerHTML = "";
    var line = el("div", "sp-stat-line");
    line.appendChild(el("span", "sp-progress", "第 " + (index + 1) + " / 10 词"));
    line.appendChild(el("span", "sp-score", "得分 " + points));
    screen.appendChild(line);
  }

  function renderWord() {
    var word = words[index];
    attempt = 1;
    selected = [];
    var hintArea = el("div", "sp-hint-area");
    var hint = el("div", "sp-hint-big", word.hint);
    hintArea.appendChild(hint);
    if (lang === "en") {
      var speakBtn = el("button", "sp-btn sp-speak-btn", "🔊 读一遍");
      speakBtn.addEventListener("click", function () { speak(word.w); });
      hintArea.appendChild(speakBtn);
    }
    screen.appendChild(hintArea);
    var slots = el("div", "sp-answer-slots");
    slots.id = "slots";
    for (var i = 0; i < word.w.length; i++) {
      var slot = el("span", "sp-slot", "");
      slot.dataset.pos = i;
      slots.appendChild(slot);
    }
    screen.appendChild(slots);
    var chipsWrap = el("div", "sp-chips");
    chipsWrap.id = "chips";
    rules.buildLetterPool(word.w, lang).forEach(function (ch) {
      var chip = el("button", "sp-chip", ch);
      chip.dataset.char = ch;
      chip.addEventListener("click", function () { pickChar(chip); });
      chipsWrap.appendChild(chip);
    });
    screen.appendChild(chipsWrap);
    var clearBtn = el("button", "sp-btn sp-clear-btn", "清除");
    clearBtn.addEventListener("click", clearAnswer);
    var submitBtn = el("button", "sp-btn sp-btn-primary sp-submit-btn", "确定");
    submitBtn.addEventListener("click", submit);
    screen.appendChild(clearBtn);
    screen.appendChild(submitBtn);
    if (lang === "en") speak(word.w);
  }

  function pickChar(chip) {
    if (chip.classList.contains("sp-chip-used")) return;
    var word = words[index];
    if (selected.length >= word.w.length) return;
    selected.push(chip.dataset.char);
    chip.classList.add("sp-chip-used");
    renderSlots();
  }

  function renderSlots() {
    var slots = document.getElementById("slots");
    for (var i = 0; i < slots.children.length; i++) {
      slots.children[i].textContent = selected[i] || "";
    }
  }

  function clearAnswer() {
    selected = [];
    var chips = document.querySelectorAll(".sp-chip-used");
    chips.forEach(function (chip) { chip.classList.remove("sp-chip-used"); });
    renderSlots();
  }

  function submit() {
    var word = words[index];
    if (selected.length !== word.w.length) {
      ui.showToast("还没拼完哦");
      return;
    }
    if (rules.checkSpelling(selected, word.w)) {
      correct += 1;
      points += 10;
      audio.play("correct");
      nextWord();
    } else if (attempt === 1) {
      attempt = 2;
      audio.play("wrong");
      highlightCorrect(word.w);
      ui.showToast("再试一次，注意高亮的字母");
    } else {
      audio.play("wrong");
      ui.showToast("答案是 " + word.w);
      nextWord();
    }
  }

  function highlightCorrect(word) {
    var chips = document.querySelectorAll(".sp-chip");
    var counts = {};
    word.split("").forEach(function (c) { counts[c] = (counts[c] || 0) + 1; });
    chips.forEach(function (chip) {
      var ch = chip.dataset.char;
      if (counts[ch] > 0) {
        counts[ch] -= 1;
        chip.classList.add("sp-chip-correct");
      }
    });
  }

  function nextWord() {
    index += 1;
    if (index >= words.length) {
      endRound();
      return;
    }
    renderRoundHeader();
    renderWord();
  }

  function endRound() {
    var stars = rules.starsForRound(correct, words.length);
    save = scoring.applyResult(save, "spelling", {
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
      message: "拼对 " + correct + " / 10 个词",
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
    renderLang();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
