# 太空益智乐园 M2（算术速算 + 记忆翻牌）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上线前两款小游戏：算术速算与记忆翻牌，门户星球可点击进入对应游戏页面，完整走通"选难度 → 游玩 → 结算 → 存档 → 返回地图"。

**Architecture:** 每款游戏一个独立 HTML 页面（`arithmetic.html` / `memory.html`），页面复用 M1 核心模块（storage/scoring/audio/ui），游戏规则（出题、判分、星级）写成 UMD 纯函数模块放 `js/games/<game>/rules.js`，页面逻辑放 `js/games/<game>/game.js`。门户 `js/portal.js` 的星球配置增加 `url` 字段，点击已解锁星球跳转到对应页面。

**Tech Stack:** HTML5 + CSS3 + 原生 JavaScript（零依赖、零构建）；Node 内置模块运行单元测试。

## Global Constraints

- 零框架、零构建、零外部依赖；不引入任何 CDN、字体库或图片素材。
- 所有资源路径为相对路径，兼容 GitHub Pages 子路径部署。
- 界面语言为中文；按钮等触控目标最小 48px。
- 兼容双击 HTML 直接打开（file://），使用 classic scripts + UMD，不使用 ES Modules。
- 存档键名固定：`superpowers-save-v1`；星星范围 0-3。
- 难度解锁：难度 2 需该游戏累计 2 星，难度 3 需累计 4 星（`scoring.difficultyUnlocked`）。
- 每完成一个任务必须提交一次 git（仓库根 `superpowers-game/`）。git 不在 PATH 时用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`；Node 用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`。
- 运行单元测试：`node tests/run-tests.js`。
- 游戏规则数值（来自规格第 6.1/6.2 节，本计划的具体化）：
  - 算术速算：60 秒限时、4 选 1；答对 +10 分并累计连击，连击加成具体化为 `10 + 5 × (连击数 − 1)`；答错断连击。星星：总题数 ≥15 且正确率 ≥95% → 3 星；≥80% → 2 星；≥60% → 1 星；否则 0 星。
  - 记忆翻牌：新手 6 对（4×3 格）、探险家 8 对（4×4）、舰长 12 对（6×4）。计分 = `对数×10 + max(0, 对数+6−步数)×2`；星星：步数 ≤ 对数+2 → 3 星；≤ 对数+4 → 2 星；≤ 对数+6 → 1 星；否则 0 星。

## 范围说明

本计划只覆盖 M2（规格第 6.1/6.2 节 + M1 门户接入）。拼单词与逻辑推理留待 M3 计划。

---

### Task 1: 算术速算规则引擎（出题/判分纯函数）

**Files:**
- Create: `js/games/arithmetic/rules.js`
- Create: `tests/arithmetic-rules.test.js`

**Interfaces:**
- Consumes: 无（纯函数，独立于 storage/scoring）
- Produces: `window.Superpowers.arithmeticRules` / `require("../js/games/arithmetic/rules.js")`，API：
  - `makeQuestion(level, rand?)` → `{ text, answer, options[4] }`；`rand` 为可注入的随机函数（默认 `Math.random`）
  - `checkAnswer(question, chosen)` → boolean
  - `pointsForCorrect(combo)` → 10 + 5×(combo−1)
  - `starsForRound(correct, total)` → 0/1/2/3
  - `emptyState()` → `{ answered:0, correct:0, points:0, combo:0, bestCombo:0 }`

- [ ] **Step 1: 写失败测试 `tests/arithmetic-rules.test.js`**

```js
"use strict";
var h = require("./harness");
var rules = require("../js/games/arithmetic/rules.js");

function compute(text) {
  var expr = text.replace(" = ?", "").replace(/\s+/g, "");
  expr = expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  return Function("return (" + expr + ")")();
}

function assertQuestion(q, level, label) {
  h.assertEqual(q.options.length, 4, label + " options length");
  h.assertEqual(new Set(q.options).size, 4, label + " options unique");
  h.assertEqual(q.options.indexOf(q.answer) >= 0, true, label + " answer in options");
  h.assertEqual(compute(q.text), q.answer, label + " answer correct");
  if (level === 1) {
    var parts = q.text.split(" = ?")[0].split(" ");
    h.assertEqual(parts.length, 3, label + " level1 format");
    h.assertEqual(Number(parts[0]) <= 20 && Number(parts[2]) <= 20, true, label + " operands <= 20");
  }
}

h.test("makeQuestion 各级 200 次生成合法题目", function () {
  for (var level = 1; level <= 3; level++) {
    for (var i = 0; i < 200; i++) {
      assertQuestion(rules.makeQuestion(level), level, "L" + level + "#" + i);
    }
  }
});

h.test("makeQuestion 支持注入随机函数", function () {
  var q1 = rules.makeQuestion(1, function () { return 0.5; });
  var q2 = rules.makeQuestion(1, function () { return 0.5; });
  h.assertEqual(q1.text, q2.text);
});

h.test("checkAnswer 判断正确性", function () {
  var q = rules.makeQuestion(1);
  h.assertEqual(rules.checkAnswer(q, q.answer), true);
  h.assertEqual(rules.checkAnswer(q, q.options[0] === q.answer ? q.options[1] : q.options[0]), false);
});

h.test("pointsForCorrect 连击加成", function () {
  h.assertEqual(rules.pointsForCorrect(1), 10);
  h.assertEqual(rules.pointsForCorrect(2), 15);
  h.assertEqual(rules.pointsForCorrect(3), 20);
});

h.test("starsForRound 星级阈值", function () {
  h.assertEqual(rules.starsForRound(15, 15), 3);
  h.assertEqual(rules.starsForRound(14, 14), 2);
  h.assertEqual(rules.starsForRound(10, 10), 2);
  h.assertEqual(rules.starsForRound(8, 10), 1);
  h.assertEqual(rules.starsForRound(5, 10), 0);
  h.assertEqual(rules.starsForRound(0, 0), 0);
});

h.test("emptyState 初始值", function () {
  var s = rules.emptyState();
  h.assertEqual(s.answered, 0);
  h.assertEqual(s.points, 0);
  h.assertEqual(s.combo, 0);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/arithmetic-rules.test.js`
Expected: FAIL，`Cannot find module '../js/games/arithmetic/rules.js'`。

- [ ] **Step 3: 实现 `js/games/arithmetic/rules.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.arithmeticRules = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function randInt(min, max, rand) {
    var r = rand || Math.random;
    return min + Math.floor(r() * (max - min + 1));
  }

  function pick(arr, rand) {
    return arr[Math.floor((rand || Math.random)() * arr.length)];
  }

  function shuffle(arr, rand) {
    var a = arr.slice();
    var r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function makeOptions(answer, rand) {
    var set = {};
    set[answer] = true;
    var candidates = [answer + 1, answer - 1, answer + 2, answer - 2, answer + 10, answer - 10, answer + 3, answer - 3];
    var opts = [answer];
    var i = 0;
    while (opts.length < 4 && i < candidates.length) {
      var c = candidates[i];
      if (c >= 0 && !set[c]) { set[c] = true; opts.push(c); }
      i += 1;
    }
    var extra = 1;
    while (opts.length < 4) {
      var v = answer + extra;
      if (v >= 0 && !set[v]) { set[v] = true; opts.push(v); }
      extra += 1;
    }
    return shuffle(opts, rand);
  }

  function makeQuestion(level, rand) {
    level = level || 1;
    var a, b, op, answer;
    if (level === 1) {
      if ((rand || Math.random)() < 0.5) {
        a = randInt(1, 19, rand); b = randInt(1, 20 - a, rand); op = a + " + " + b; answer = a + b;
      } else {
        a = randInt(2, 20, rand); b = randInt(1, a, rand); op = a + " − " + b; answer = a - b;
      }
    } else if (level === 2) {
      var kind = randInt(1, 3, rand);
      if (kind === 1) { a = randInt(1, 99, rand); b = randInt(1, 100 - a, rand); op = a + " + " + b; answer = a + b; }
      else if (kind === 2) { a = randInt(2, 100, rand); b = randInt(1, a, rand); op = a + " − " + b; answer = a - b; }
      else { a = randInt(2, 9, rand); b = randInt(2, 9, rand); op = a + " × " + b; answer = a * b; }
    } else {
      var kind3 = randInt(1, 4, rand);
      if (kind3 === 1) {
        a = randInt(2, 9, rand); b = randInt(2, 9, rand); var c1 = randInt(2, 9, rand);
        op = "(" + a + " + " + b + ") × " + c1; answer = (a + b) * c1;
      } else if (kind3 === 2) {
        a = randInt(2, 9, rand); b = randInt(2, 9, rand); var c2 = randInt(2, 9, rand);
        op = a + " × " + b + " + " + c2; answer = a * b + c2;
      } else if (kind3 === 3) {
        a = randInt(2, 9, rand); b = randInt(2, 9, rand); var c3 = randInt(1, a * b - 1, rand);
        op = a + " × " + b + " − " + c3; answer = a * b - c3;
      } else {
        var x = randInt(2, 72, rand);
        var divs = [];
        for (var d = 2; d <= 9; d++) { if (x % d === 0) divs.push(d); }
        if (!divs.length) { x = 12; divs = [2, 3, 4, 6]; }
        var cd = pick(divs, rand);
        op = x + " ÷ " + cd; answer = x / cd;
      }
    }
    return { text: op + " = ?", answer: answer, options: makeOptions(answer, rand) };
  }

  function checkAnswer(question, chosen) {
    return question.answer === chosen;
  }

  function pointsForCorrect(combo) {
    return 10 + 5 * Math.max(0, combo - 1);
  }

  function starsForRound(correct, total) {
    if (total <= 0) return 0;
    var rate = correct / total;
    if (total >= 15 && rate >= 0.95) return 3;
    if (rate >= 0.8) return 2;
    if (rate >= 0.6) return 1;
    return 0;
  }

  function emptyState() {
    return { answered: 0, correct: 0, points: 0, combo: 0, bestCombo: 0 };
  }

  return {
    makeQuestion: makeQuestion,
    checkAnswer: checkAnswer,
    pointsForCorrect: pointsForCorrect,
    starsForRound: starsForRound,
    emptyState: emptyState
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/arithmetic-rules.test.js`
Expected: 6 个测试全部 PASS，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add js/games/arithmetic/rules.js tests/arithmetic-rules.test.js
git commit -m "feat: M2 算术速算规则引擎与测试"
```

---

### Task 2: 算术速算页面

**Files:**
- Create: `arithmetic.html`
- Create: `js/games/arithmetic/game.js`
- Modify: `css/base.css`（追加游戏通用样式：题目、选项、棋盘、卡片、难度按钮、状态行）

**Interfaces:**
- Consumes: `Superpowers.storage.load/save`、`Superpowers.scoring.applyResult/difficultyUnlocked`、`Superpowers.audio.play/setMuted/init`、`Superpowers.ui.showResult/startCountdown`、`Superpowers.arithmeticRules.*`
- Produces: 可游玩页面；结算后 `storage.save(scoring.applyResult(save, "arithmetic", { level, stars, score, points, playedAt }))`

- [ ] **Step 1: 创建 `arithmetic.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>算术速算</title>
  <link rel="stylesheet" href="css/base.css">
</head>
<body>
  <header class="sp-header">
    <a href="index.html" class="sp-btn">← 地图</a>
    <h1 class="sp-game-title">算术速算</h1>
    <button id="muteBtn" class="sp-icon-btn" title="静音">🔊</button>
  </header>
  <main id="screen" class="sp-screen"></main>
  <script src="js/core/storage.js"></script>
  <script src="js/core/scoring.js"></script>
  <script src="js/core/audio.js"></script>
  <script src="js/core/ui.js"></script>
  <script src="js/games/arithmetic/rules.js"></script>
  <script src="js/games/arithmetic/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `js/games/arithmetic/game.js`**

```js
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
```

- [ ] **Step 3: 追加游戏样式到 `css/base.css` 末尾**

```css
.sp-screen { max-width: 720px; margin: 0 auto; padding: 16px; }
.sp-game-title { text-align: center; font-size: 26px; margin: 0; }
.sp-difficulty { display: block; margin: 14px auto; min-width: 240px; }
.sp-btn-locked { opacity: 0.5; }
.sp-stat-line { display: flex; justify-content: center; gap: 18px; font-size: 18px; margin: 12px 0; }
.sp-question { font-size: 42px; text-align: center; margin: 24px 0; }
.sp-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; max-width: 520px; margin: 0 auto; }
.sp-option { font-size: 26px; min-height: 72px; }
.sp-board { display: grid; gap: 10px; max-width: 640px; margin: 16px auto; }
.sp-card { background: #232d66; border: 2px solid #3d4f9f; border-radius: 14px; font-size: 26px; min-height: 80px; color: transparent; cursor: pointer; }
.sp-card-open, .sp-card-matched { background: #3b4aa0; color: var(--sp-text); }
.sp-card-matched { border-color: var(--sp-accent); }
```

- [ ] **Step 4: 手动/沙箱验收**

Run: 启动本地服务（bundled python `-m http.server 8000`），`Invoke-WebRequest http://localhost:8000/arithmetic.html` 返回 200；检查页面引用路径全部存在（css/base.css、6 个 js）
Expected: 页面含"← 地图"、"选择难度"三个按钮（后两个锁定态显示所需星星）；真实浏览器渲染、60 秒计时、声音与结算流程留待 M2 最终浏览器验收。

- [ ] **Step 5: 提交**

```bash
git add arithmetic.html js/games/arithmetic/game.js css/base.css
git commit -m "feat: M2 算术速算游戏页面"
```

---

### Task 3: 记忆翻牌规则引擎（棋盘/判分纯函数）

**Files:**
- Create: `js/games/memory/rules.js`
- Create: `tests/memory-rules.test.js`

**Interfaces:**
- Consumes: 无
- Produces: `window.Superpowers.memoryRules` / `require("../js/games/memory/rules.js")`，API：
  - `pairCountForLevel(level)` → 6/8/12
  - `makePairs(level, rand?)` → `[{ id, a, b }]`（每对两张卡面）
  - `buildBoard(pairs, rand?)` → 2P 张卡 `{ pairId, side: "a"|"b", label }`，洗牌
  - `gridSize(level)` → `{ rows, cols }`（L1 3×4、L2 4×4、L3 4×6）
  - `starsForGame(pairCount, steps)` → 0/1/2/3
  - `pointsForGame(pairCount, steps)` → 分数

- [ ] **Step 1: 写失败测试 `tests/memory-rules.test.js`**

```js
"use strict";
var h = require("./harness");
var rules = require("../js/games/memory/rules.js");

h.test("pairCountForLevel 对数为 6/8/12", function () {
  h.assertEqual(rules.pairCountForLevel(1), 6);
  h.assertEqual(rules.pairCountForLevel(2), 8);
  h.assertEqual(rules.pairCountForLevel(3), 12);
});

h.test("makePairs 新手为两两相同符号", function () {
  var pairs = rules.makePairs(1);
  h.assertEqual(pairs.length, 6);
  pairs.forEach(function (p) { h.assertEqual(p.a, p.b); });
  var labels = pairs.map(function (p) { return p.a; });
  h.assertEqual(new Set(labels).size, 6);
});

h.test("makePairs 探险家为数字与中文配对", function () {
  var pairs = rules.makePairs(2);
  h.assertEqual(pairs.length, 8);
  pairs.forEach(function (p) { h.assertEqual(p.a !== p.b, true); });
  var all = [];
  pairs.forEach(function (p) { all.push(p.a, p.b); });
  h.assertEqual(new Set(all).size, 16);
});

h.test("makePairs 舰长为算式与结果且结果唯一", function () {
  var pairs = rules.makePairs(3);
  h.assertEqual(pairs.length, 12);
  var results = pairs.map(function (p) { return p.b; });
  h.assertEqual(new Set(results).size, 12);
  pairs.forEach(function (p) {
    var sum = p.a.split(" + ").map(Number).reduce(function (x, y) { return x + y; }, 0);
    h.assertEqual(String(sum), p.b);
  });
});

h.test("buildBoard 生成 2P 张洗牌卡", function () {
  var pairs = rules.makePairs(1);
  var board = rules.buildBoard(pairs);
  h.assertEqual(board.length, 12);
  var labels = board.map(function (c) { return c.label; });
  h.assertEqual(labels.length, new Set(labels).size * 2);
  var first = rules.buildBoard(pairs, function () { return 0; });
  var second = rules.buildBoard(pairs, function () { return 0; });
  h.assertEqual(first.map(function (c) { return c.pairId; }).join(","), second.map(function (c) { return c.pairId; }).join(","));
});

h.test("gridSize 各级格数", function () {
  h.assertEqual(rules.gridSize(1).cols, 4);
  h.assertEqual(rules.gridSize(1).rows, 3);
  h.assertEqual(rules.gridSize(2).cols, 4);
  h.assertEqual(rules.gridSize(2).rows, 4);
  h.assertEqual(rules.gridSize(3).cols, 6);
  h.assertEqual(rules.gridSize(3).rows, 4);
});

h.test("starsForGame 与 pointsForGame 阈值", function () {
  h.assertEqual(rules.starsForGame(6, 8), 3);
  h.assertEqual(rules.starsForGame(6, 10), 2);
  h.assertEqual(rules.starsForGame(6, 12), 1);
  h.assertEqual(rules.starsForGame(6, 13), 0);
  h.assertEqual(rules.pointsForGame(6, 8), 68);
  h.assertEqual(rules.pointsForGame(6, 13), 60);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/memory-rules.test.js`
Expected: FAIL，`Cannot find module '../js/games/memory/rules.js'`。

- [ ] **Step 3: 实现 `js/games/memory/rules.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.memoryRules = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var SYMBOLS = ["🚀", "🌙", "⭐", "☄️", "🪐", "👾", "🌈", "🔥", "❄️", "🍎", "🐱", "⚡", "🌍", "🎯", "🧩", "🛸", "🐬", "🍀"];
  var CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

  function pairCountForLevel(level) {
    return level >= 3 ? 12 : level === 2 ? 8 : 6;
  }

  function shuffle(arr, rand) {
    var a = arr.slice();
    var r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function makePairs(level, rand) {
    var n = pairCountForLevel(level);
    var pairs = [];
    if (level === 1) {
      var symbols = shuffle(SYMBOLS, rand).slice(0, n);
      symbols.forEach(function (s, i) { pairs.push({ id: i, a: s, b: s }); });
    } else if (level === 2) {
      var nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], rand).slice(0, n);
      nums.forEach(function (num, i) { pairs.push({ id: i, a: String(num), b: CN_NUM[num - 1] }); });
    } else {
      for (var i = 0; i < n; i++) {
        var left = i + 1;
        pairs.push({ id: i, a: left + " + " + n, b: String(left + n) });
      }
      pairs = shuffle(pairs, rand);
    }
    return pairs;
  }

  function buildBoard(pairs, rand) {
    var cards = [];
    pairs.forEach(function (p) {
      cards.push({ pairId: p.id, side: "a", label: p.a });
      cards.push({ pairId: p.id, side: "b", label: p.b });
    });
    return shuffle(cards, rand);
  }

  function gridSize(level) {
    return level >= 3 ? { rows: 4, cols: 6 } : level === 2 ? { rows: 4, cols: 4 } : { rows: 3, cols: 4 };
  }

  function starsForGame(pairCount, steps) {
    if (steps <= pairCount + 2) return 3;
    if (steps <= pairCount + 4) return 2;
    if (steps <= pairCount + 6) return 1;
    return 0;
  }

  function pointsForGame(pairCount, steps) {
    return pairCount * 10 + Math.max(0, pairCount + 6 - steps) * 2;
  }

  return {
    pairCountForLevel: pairCountForLevel,
    makePairs: makePairs,
    buildBoard: buildBoard,
    gridSize: gridSize,
    starsForGame: starsForGame,
    pointsForGame: pointsForGame
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/memory-rules.test.js`
Expected: 6 个测试全部 PASS，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add js/games/memory/rules.js tests/memory-rules.test.js
git commit -m "feat: M2 记忆翻牌规则引擎与测试"
```

---

### Task 4: 记忆翻牌页面

**Files:**
- Create: `memory.html`
- Create: `js/games/memory/game.js`

**Interfaces:**
- Consumes: `Superpowers.storage/scoring/audio/ui`、`Superpowers.memoryRules.*`
- Produces: 可游玩页面；结算后 `storage.save(scoring.applyResult(save, "memory", { level, stars, score, points, playedAt }))`

- [ ] **Step 1: 创建 `memory.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>记忆翻牌</title>
  <link rel="stylesheet" href="css/base.css">
</head>
<body>
  <header class="sp-header">
    <a href="index.html" class="sp-btn">← 地图</a>
    <h1 class="sp-game-title">记忆翻牌</h1>
    <button id="muteBtn" class="sp-icon-btn" title="静音">🔊</button>
  </header>
  <main id="screen" class="sp-screen"></main>
  <script src="js/core/storage.js"></script>
  <script src="js/core/scoring.js"></script>
  <script src="js/core/audio.js"></script>
  <script src="js/core/ui.js"></script>
  <script src="js/games/memory/rules.js"></script>
  <script src="js/games/memory/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `js/games/memory/game.js`**

```js
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
```

- [ ] **Step 3: 手动/沙箱验收**

Run: 启动本地服务，`Invoke-WebRequest http://localhost:8000/memory.html` 返回 200；检查页面引用路径全部存在
Expected: 页面含"← 地图"、"选择难度"三个按钮；真实浏览器翻牌、匹配、结算留待 M2 最终浏览器验收。

- [ ] **Step 4: 提交**

```bash
git add memory.html js/games/memory/game.js
git commit -m "feat: M2 记忆翻牌游戏页面"
```

---

### Task 5: 门户导航接入与集成验收

**Files:**
- Modify: `js/portal.js`（GAMES 增加 `url` 字段；点击已解锁星球跳转对应页面）

**Interfaces:**
- Consumes: 无新依赖
- Produces: 门户两个星球可跳转 `arithmetic.html` / `memory.html`；spelling/logic 仍显示"即将上线"。

- [ ] **Step 1: 修改 `js/portal.js` 的 GAMES 配置**

把：

```js
  var GAMES = [
    { id: "arithmetic", name: "算术速算", icon: "🪐" },
    { id: "memory", name: "记忆翻牌", icon: "🌕" },
    { id: "spelling", name: "拼单词", icon: "☄️" },
    { id: "logic", name: "逻辑推理", icon: "🛸" }
  ];
```

改为：

```js
  var GAMES = [
    { id: "arithmetic", name: "算术速算", icon: "🪐", url: "arithmetic.html" },
    { id: "memory", name: "记忆翻牌", icon: "🌕", url: "memory.html" },
    { id: "spelling", name: "拼单词", icon: "☄️", url: null },
    { id: "logic", name: "逻辑推理", icon: "🛸", url: null }
  ];
```

- [ ] **Step 2: 修改 `js/portal.js` 的已解锁星球点击处理**

把 renderMap 内已解锁分支的：

```js
        card.addEventListener("click", function () {
          ui.showToast(game.name + " 即将上线，敬请期待！");
        });
```

改为：

```js
        card.addEventListener("click", function () {
          if (game.url) {
            window.location.href = game.url;
          } else {
            ui.showToast(game.name + " 即将上线，敬请期待！");
          }
        });
```

- [ ] **Step 3: 集成验收**

Run: `node tests/arithmetic-rules.test.js` 与 `node tests/memory-rules.test.js`（各 6、7 个测试，应全部 PASS；两者加入 run-tests 见 Task 6）。同时用 grep 确认 `js/portal.js` 中 `url:` 出现 4 次、`window.location.href` 出现 1 次。

- [ ] **Step 4: 提交**

```bash
git add js/portal.js
git commit -m "feat: M2 门户接入算术速算与记忆翻牌"
```

---

### Task 6: 测试运行器更新、README 与最终验收

**Files:**
- Modify: `tests/run-tests.js`（追加两个新测试文件）
- Modify: `README.md`（更新已上线游戏列表）

**Interfaces:**
- Consumes: 全部测试文件
- Produces: 统一测试入口覆盖 M1+M2。

- [ ] **Step 1: 修改 `tests/run-tests.js`**

把：

```js
require("./parent-area.test.js");
```

改为：

```js
require("./parent-area.test.js");
require("./arithmetic-rules.test.js");
require("./memory-rules.test.js");
```

- [ ] **Step 2: 修改 `README.md` 的游戏列表**

把：

```markdown
面向 9-12 岁儿童的太空探险主题益智网页游戏。当前版本为 M1 地基：门户星球地图、存档/计分/音效/限时核心系统与家长区。4 款小游戏（算术速算、记忆翻牌、拼单词、逻辑推理）将在后续版本上线。
```

改为：

```markdown
面向 9-12 岁儿童的太空探险主题益智网页游戏。当前已上线：门户星球地图、核心系统（存档/计分/音效/限时/家长区），以及 **算术速算** 与 **记忆翻牌** 两款小游戏。拼单词与逻辑推理将在后续版本上线。
```

- [ ] **Step 3: 全量测试**

Run: `node tests/run-tests.js`
Expected: 31 个测试全部 PASS（M1 18 + 算术 6 + 记忆 7），`---- 31 passed, 0 failed ----`，退出码 0。

- [ ] **Step 4: 最终验收（需浏览器，标注为人工项）**

- 门户：算术速算、记忆翻牌星球可点击进入对应页面；未解锁星球仍显示锁定；拼单词/逻辑推理显示"即将上线"。
- 算术速算：新手/探险家/舰长三档；60 秒倒计时结束出结算；答对连击加分；星级按正确率。
- 记忆翻牌：三档棋盘 6/8/12 对；翻错 600ms 后自动扣回；全部配对出结算并写存档。
- 返回地图后家长区"进度"页能看到两游戏的星星/最高分/游玩次数。

- [ ] **Step 5: 提交**

```bash
git add tests/run-tests.js README.md
git commit -m "docs: M2 测试运行器与 README 更新"
```

---

## M2 完成标准

- `node tests/run-tests.js` 全绿（31 个测试）。
- 门户可进入算术速算与记忆翻牌，完整走通"选难度 → 游玩 → 结算 → 存档 → 返回地图"。
- 星级/积分正确写入 localStorage 并在家长区可见。
- 零依赖、可双击打开、可推送 GitHub Pages。
