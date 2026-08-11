# 太空益智乐园 M3a（拼单词 · 英/中双语）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上线拼单词游戏：英语（emoji 看图 + 发音提示 + 字母池拼词）与中文（看释义 + 汉字池拼词）双语言，每轮 10 词、拼错给第二次机会，完整接入门户、存档与结算。

**Architecture:** 复用 M1/M2 模式：`spelling.html` 独立页面 + `js/games/spelling/` 下三个模块（`words.js` 词库数据、`rules.js` 规则纯函数、`game.js` 页面逻辑）。`rules.js` 通过 UMD 依赖 `words.js`（Node `require` / 浏览器 `Superpowers.spellingWords`）。门户 `portal.js` 为 spelling 星球填 `url`。

**Tech Stack:** HTML5 + CSS3 + 原生 JavaScript（零依赖、零构建）；浏览器内置 `speechSynthesis`（en-US）做发音，不可用时静默降级；Node 内置模块运行单元测试。

## Global Constraints

- 零框架、零构建、零外部依赖；不引入任何 CDN、字体库或图片素材。
- 所有资源路径为相对路径，兼容 GitHub Pages 子路径部署。
- 界面语言为中文；按钮等触控目标最小 48px。
- 兼容双击 HTML 直接打开（file://），使用 classic scripts + UMD，不使用 ES Modules。
- 存档键名固定：`superpowers-save-v1`；星星范围 0-3；难度解锁沿用 `scoring.difficultyUnlocked`（难度 2 需该游戏累计 2 星、难度 3 需 4 星）。
- 拼单词规则数值（规格 6.3 节的具体化）：
  - 每轮 10 词；每词最多 2 次尝试；第一次拼错时高亮正确字母，给第二次机会；第二次仍错记该题失败并显示答案。
  - 计分：每词答对 +10 分。
  - 星星：全对 3 星；正确率 ≥80% 2 星；≥60% 1 星；否则 0 星。
  - 词库：英语按 3-4 年级、5-6 年级、进阶分三档；中文按常用词、常用词进阶、常用词语+成语分三档；每档 15 词。英语"看图"用 emoji 图示，"发音提示"用 `speechSynthesis`（en-US）。
- 每完成一个任务必须提交一次 git（仓库根 `superpowers-game/`）。git 不在 PATH 时用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`；Node 用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`。
- 运行单元测试：`node tests/run-tests.js`。

## 范围说明

本计划只覆盖 M3a（拼单词）。M3b（逻辑推理）另立计划，两计划相互独立。

---

### Task 1: 词库与拼词规则引擎

**Files:**
- Create: `js/games/spelling/words.js`
- Create: `js/games/spelling/rules.js`
- Create: `tests/spelling-rules.test.js`

**Interfaces:**
- Consumes: 无外部依赖；`rules.js` 依赖 `words.js`
- Produces:
  - `window.Superpowers.spellingWords` / `require("../js/games/spelling/words.js")`：
    - `getPool(lang, level)` → `[{ w, hint }]`（lang ∈ `"en"|"zh"`，level 1/2/3，每档 15 词）
    - `EN_ALPHABET` / `ZH_DISTRACT`（干扰字符源）
  - `window.Superpowers.spellingRules` / `require("../js/games/spelling/rules.js")`：
    - `pickWords(pool, count, rand?)` → 数组（无重复）
    - `buildLetterPool(word, lang, rand?)` → 字符数组（词内字符 + 3 个干扰字符，洗牌）
    - `checkSpelling(answerChars, word)` → boolean
    - `starsForRound(correct, total)` → 0/1/2/3

- [ ] **Step 1: 写失败测试 `tests/spelling-rules.test.js`**

```js
"use strict";
var h = require("./harness");
var words = require("../js/games/spelling/words.js");
var rules = require("../js/games/spelling/rules.js");

h.test("getPool 每语言每档 15 词且含提示", function () {
  ["en", "zh"].forEach(function (lang) {
    [1, 2, 3].forEach(function (level) {
      var pool = words.getPool(lang, level);
      h.assertEqual(pool.length, 15, lang + " L" + level + " size");
      pool.forEach(function (item) {
        h.assertEqual(typeof item.w === "string" && item.w.length > 0, true, "有词");
        h.assertEqual(typeof item.hint === "string" && item.hint.length > 0, true, "有提示");
      });
    });
  });
});

h.test("pickWords 从词库抽取不重复词", function () {
  var pool = words.getPool("en", 1);
  var picked = rules.pickWords(pool, 10);
  h.assertEqual(picked.length, 10);
  h.assertEqual(new Set(picked.map(function (p) { return p.w; })).size, 10);
  var same = rules.pickWords(pool, 10, function () { return 0.5; });
  var same2 = rules.pickWords(pool, 10, function () { return 0.5; });
  h.assertEqual(same.map(function (p) { return p.w; }).join(","), same2.map(function (p) { return p.w; }).join(","));
});

h.test("buildLetterPool 含全部词字符且长度=词长+3", function () {
  var en = rules.buildLetterPool("apple", "en");
  h.assertEqual(en.length, 8);
  ["a", "p", "p", "l", "e"].forEach(function (c) {
    h.assertEqual(en.filter(function (x) { return x === c; }).length >= 1, true, "含 " + c);
  });
  var zh = rules.buildLetterPool("苹果", "zh");
  h.assertEqual(zh.length, 5);
  ["苹", "果"].forEach(function (c) {
    h.assertEqual(zh.indexOf(c) >= 0, true, "含 " + c);
  });
});

h.test("checkSpelling 判断拼写正确性", function () {
  h.assertEqual(rules.checkSpelling(["a", "p", "p", "l", "e"], "apple"), true);
  h.assertEqual(rules.checkSpelling(["a", "p", "l", "p", "e"], "apple"), false);
});

h.test("starsForRound 星级阈值", function () {
  h.assertEqual(rules.starsForRound(10, 10), 3);
  h.assertEqual(rules.starsForRound(8, 10), 2);
  h.assertEqual(rules.starsForRound(6, 10), 1);
  h.assertEqual(rules.starsForRound(5, 10), 0);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/spelling-rules.test.js`
Expected: FAIL，`Cannot find module '../js/games/spelling/words.js'`。

- [ ] **Step 3: 实现 `js/games/spelling/words.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.spellingWords = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EN = {
    1: [
      { w: "apple", hint: "🍎" }, { w: "dog", hint: "🐶" }, { w: "cat", hint: "🐱" },
      { w: "book", hint: "📖" }, { w: "sun", hint: "☀️" }, { w: "moon", hint: "🌙" },
      { w: "star", hint: "⭐" }, { w: "fish", hint: "🐟" }, { w: "bird", hint: "🐦" },
      { w: "milk", hint: "🥛" }, { w: "egg", hint: "🥚" }, { w: "cake", hint: "🎂" },
      { w: "ball", hint: "⚽" }, { w: "tree", hint: "🌳" }, { w: "car", hint: "🚗" }
    ],
    2: [
      { w: "teacher", hint: "👩‍🏫" }, { w: "school", hint: "🏫" }, { w: "friend", hint: "🤝" },
      { w: "family", hint: "👨‍👩‍👧" }, { w: "water", hint: "💧" }, { w: "bread", hint: "🍞" },
      { w: "mountain", hint: "⛰️" }, { w: "river", hint: "🌊" }, { w: "flower", hint: "🌸" },
      { w: "music", hint: "🎵" }, { w: "doctor", hint: "🩺" }, { w: "animal", hint: "🐾" },
      { w: "garden", hint: "🌿" }, { w: "picture", hint: "🖼️" }, { w: "holiday", hint: "🎉" }
    ],
    3: [
      { w: "beautiful", hint: "💖" }, { w: "science", hint: "🔬" }, { w: "history", hint: "🏛️" },
      { w: "weather", hint: "🌦️" }, { w: "library", hint: "📚" }, { w: "elephant", hint: "🐘" },
      { w: "umbrella", hint: "☂️" }, { w: "rainbow", hint: "🌈" }, { w: "chocolate", hint: "🍫" },
      { w: "dinosaur", hint: "🦕" }, { w: "astronaut", hint: "🚀" }, { w: "computer", hint: "💻" },
      { w: "basketball", hint: "🏀" }, { w: "playground", hint: "🎠" }, { w: "butterfly", hint: "🦋" }
    ]
  };

  var ZH = {
    1: [
      { w: "苹果", hint: "一种红色的水果" }, { w: "小狗", hint: "汪汪叫的动物" },
      { w: "小猫", hint: "会抓老鼠的宠物" }, { w: "书本", hint: "用来学习的物品" },
      { w: "太阳", hint: "白天天空中的星球" }, { w: "月亮", hint: "夜晚天上的星球" },
      { w: "星星", hint: "夜空中的亮点" }, { w: "小鱼", hint: "水里游的动物" },
      { w: "小鸟", hint: "会飞的动物" }, { w: "牛奶", hint: "白色的饮品" },
      { w: "鸡蛋", hint: "鸡下的蛋" }, { w: "蛋糕", hint: "生日时吃的甜点" },
      { w: "足球", hint: "用脚踢的球" }, { w: "大树", hint: "高高的植物" },
      { w: "汽车", hint: "四个轮子的交通工具" }
    ],
    2: [
      { w: "老师", hint: "学校里教你知识的人" }, { w: "学校", hint: "学习的地方" },
      { w: "朋友", hint: "一起玩的好伙伴" }, { w: "家庭", hint: "爸爸妈妈和你" },
      { w: "河流", hint: "流动的水" }, { w: "花朵", hint: "会开花的植物" },
      { w: "音乐", hint: "好听的声音" }, { w: "医生", hint: "看病的人" },
      { w: "动物", hint: "会动的生命" }, { w: "花园", hint: "种花的地方" },
      { w: "天气", hint: "晴雨冷暖" }, { w: "假期", hint: "不用上学的日子" },
      { w: "图书馆", hint: "看书借书的地方" }, { w: "彩虹", hint: "雨后天空的七彩桥" },
      { w: "礼物", hint: "送人的东西" }
    ],
    3: [
      { w: "坚持", hint: "不放弃地做下去" }, { w: "努力", hint: "认真用劲去做" },
      { w: "勇敢", hint: "不怕困难" }, { w: "聪明", hint: "反应很快、很会想" },
      { w: "诚实", hint: "不说谎" }, { w: "谦虚", hint: "不骄傲自满" },
      { w: "认真", hint: "对待事情不马虎" }, { w: "专心", hint: "注意力集中" },
      { w: "团结", hint: "大家一条心" }, { w: "友善", hint: "对人友好和善" },
      { w: "一马当先", hint: "跑在最前面" }, { w: "三心二意", hint: "做事不专心" },
      { w: "画蛇添足", hint: "多此一举" }, { w: "守株待兔", hint: "坐等好运气" },
      { w: "亡羊补牢", hint: "犯错后及时补救" }
    ]
  };

  var EN_ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
  var ZH_DISTRACT = ["大", "小", "中", "上", "下", "左", "右", "天", "地", "人", "山", "水", "火", "木", "金", "土", "日", "月", "风", "雨"];

  function getPool(lang, level) {
    var table = lang === "zh" ? ZH : EN;
    return (table[level] || table[1]).slice();
  }

  return {
    getPool: getPool,
    EN_ALPHABET: EN_ALPHABET,
    ZH_DISTRACT: ZH_DISTRACT
  };
});
```

- [ ] **Step 4: 实现 `js/games/spelling/rules.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./words.js"));
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.spellingRules = factory(root.Superpowers.spellingWords);
  }
})(typeof self !== "undefined" ? self : this, function (wordsData) {
  "use strict";

  function shuffle(arr, rand) {
    var a = arr.slice();
    var r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickWords(pool, count, rand) {
    return shuffle(pool, rand).slice(0, count);
  }

  function buildLetterPool(word, lang, rand) {
    var chars = word.split("");
    var distractorPool = lang === "zh" ? wordsData.ZH_DISTRACT : wordsData.EN_ALPHABET;
    var used = {};
    chars.forEach(function (c) { used[c] = true; });
    var distractors = [];
    var pool = shuffle(distractorPool, rand);
    for (var i = 0; i < pool.length && distractors.length < 3; i++) {
      if (!used[pool[i]]) { used[pool[i]] = true; distractors.push(pool[i]); }
    }
    return shuffle(chars.concat(distractors), rand);
  }

  function checkSpelling(answerChars, word) {
    return answerChars.join("") === word;
  }

  function starsForRound(correct, total) {
    if (total <= 0) return 0;
    if (correct === total) return 3;
    var rate = correct / total;
    if (rate >= 0.8) return 2;
    if (rate >= 0.6) return 1;
    return 0;
  }

  return {
    pickWords: pickWords,
    buildLetterPool: buildLetterPool,
    checkSpelling: checkSpelling,
    starsForRound: starsForRound
  };
});
```

- [ ] **Step 5: 运行测试确认通过**

Run: `node tests/spelling-rules.test.js`
Expected: 5 个测试全部 PASS，退出码 0。

- [ ] **Step 6: 提交**

```bash
git add js/games/spelling/words.js js/games/spelling/rules.js tests/spelling-rules.test.js
git commit -m "feat: M3a 拼单词词库与规则引擎与测试"
```

---

### Task 2: 拼单词页面

**Files:**
- Create: `spelling.html`
- Create: `js/games/spelling/game.js`
- Modify: `css/base.css`（追加语言按钮、答案槽、字母块、发音按钮样式）

**Interfaces:**
- Consumes: `Superpowers.storage/scoring/audio/ui`、`Superpowers.spellingWords.getPool`、`Superpowers.spellingRules.*`
- Produces: 可游玩页面；结算后 `storage.save(scoring.applyResult(save, "spelling", { level, stars, score, points, playedAt }))`

- [ ] **Step 1: 创建 `spelling.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>拼单词</title>
  <link rel="stylesheet" href="css/base.css">
</head>
<body>
  <header class="sp-header">
    <a href="index.html" class="sp-btn">← 地图</a>
    <h1 class="sp-game-title">拼单词</h1>
    <button id="muteBtn" class="sp-icon-btn" title="静音">🔊</button>
  </header>
  <main id="screen" class="sp-screen"></main>
  <script src="js/core/storage.js"></script>
  <script src="js/core/scoring.js"></script>
  <script src="js/core/audio.js"></script>
  <script src="js/core/ui.js"></script>
  <script src="js/games/spelling/words.js"></script>
  <script src="js/games/spelling/rules.js"></script>
  <script src="js/games/spelling/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `js/games/spelling/game.js`**

```js
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
```

- [ ] **Step 3: 追加样式到 `css/base.css` 末尾**

```css
.sp-hint-area { text-align: center; margin: 18px 0; }
.sp-hint-big { font-size: 64px; min-height: 80px; }
.sp-speak-btn { display: block; margin: 10px auto; }
.sp-answer-slots { display: flex; justify-content: center; gap: 8px; margin: 18px 0; min-height: 56px; }
.sp-slot { width: 44px; height: 52px; border-bottom: 3px solid var(--sp-accent); font-size: 30px; text-align: center; line-height: 52px; }
.sp-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; max-width: 560px; margin: 0 auto 18px; }
.sp-chip { background: #2a3a7a; border: 2px solid #3d4f9f; border-radius: 12px; color: var(--sp-text); font-size: 24px; min-width: 48px; min-height: 52px; cursor: pointer; }
.sp-chip-used { opacity: 0.35; }
.sp-chip-correct { border-color: var(--sp-accent); background: #3b4aa0; }
.sp-clear-btn { margin-right: 12px; }
```

- [ ] **Step 4: 手动/静态验收**

Run: 检查 `spelling.html` 引用的 8 个资源路径全部存在；`tests/spelling-rules.test.js` 单独跑通
Expected: 页面含"← 地图"、"选择语言"（英语/中文）；真实浏览器中的点选拼词、发音、第二次机会、结算留待 M3a 最终浏览器验收。

- [ ] **Step 5: 提交**

```bash
git add spelling.html js/games/spelling/game.js css/base.css
git commit -m "feat: M3a 拼单词游戏页面"
```

---

### Task 3: 门户接入、测试运行器、README 与最终验收

**Files:**
- Modify: `js/portal.js`（spelling 星球加 `url`）
- Modify: `tests/run-tests.js`（追加拼单词测试）
- Modify: `README.md`（已上线游戏列表）

**Interfaces:**
- Consumes: 无新依赖
- Produces: 门户可进入拼单词；全量测试覆盖 M1+M2+M3a。

- [ ] **Step 1: 修改 `js/portal.js`**

把：

```js
    { id: "spelling", name: "拼单词", icon: "☄️", url: null },
```

改为：

```js
    { id: "spelling", name: "拼单词", icon: "☄️", url: "spelling.html" },
```

- [ ] **Step 2: 修改 `tests/run-tests.js`**

在末尾追加：

```js
require("./spelling-rules.test.js");
```

- [ ] **Step 3: 修改 `README.md`**

把：

```markdown
面向 9-12 岁儿童的太空探险主题益智网页游戏。当前已上线：门户星球地图、核心系统（存档/计分/音效/限时/家长区），以及 **算术速算** 与 **记忆翻牌** 两款小游戏。拼单词与逻辑推理将在后续版本上线。
```

改为：

```markdown
面向 9-12 岁儿童的太空探险主题益智网页游戏。当前已上线：门户星球地图、核心系统（存档/计分/音效/限时/家长区），以及 **算术速算**、**记忆翻牌**、**拼单词（英/中双语）** 三款小游戏。逻辑推理将在后续版本上线。
```

- [ ] **Step 4: 全量测试**

Run: `node tests/run-tests.js`
Expected: 38 个测试全部 PASS（33 + 拼单词 5），`---- 38 passed, 0 failed ----`，退出码 0。

- [ ] **Step 5: 最终验收（需浏览器，标注为人工项）**

- 门户"拼单词"星球可点击进入；未解锁显示锁定。
- 英语：emoji 图示 + 自动发音 + 🔊 重听；点选字母拼词，拼错一次高亮正确字母、再试一次。
- 中文：看释义点选汉字拼词/成语，逻辑同上。
- 10 词结束出结算页并写存档；返回地图后星球星星与家长区进度更新。

- [ ] **Step 6: 提交**

```bash
git add js/portal.js tests/run-tests.js README.md
git commit -m "feat: M3a 门户接入拼单词，测试运行器与 README 更新"
```

---

## M3a 完成标准

- `node tests/run-tests.js` 全绿（38 个测试）。
- 门户可进入拼单词，完整走通"选语言 → 选难度 → 10 词 → 结算 → 存档 → 返回地图"。
- 英语发音与 emoji 图示、中文释义与成语词库均可用；零依赖、可双击打开、可推送 GitHub Pages。
