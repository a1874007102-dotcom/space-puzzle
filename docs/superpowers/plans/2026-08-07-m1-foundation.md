# 太空益智乐园 M1（门户 + 核心系统 + 家长区）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成 M1 地基：门户星球地图、核心系统（存档/计分/时长/音频/UI 组件）、家长区与每日限时，形成可试玩的框架。

**Architecture:** 纯静态站点：`js/portal.js` 负责门户渲染与导航；`js/core/` 下 storage / scoring / usage / audio / ui / parent-area 六个独立模块通过 `window.Superpowers` 命名空间暴露；纯逻辑模块用 UMD 包装，Node 可直接 `require` 测试。使用经典 script 标签加载（不用 ES Modules），保证双击 `index.html`（file:// 协议）也能运行。

**Tech Stack:** HTML5 + CSS3 + 原生 JavaScript（零依赖、零构建）；Node 内置模块运行单元测试（`node tests/run-tests.js`）。

## Global Constraints

- 零框架、零构建、零外部依赖；不引入任何 CDN、字体库或图片素材。
- 所有资源路径为相对路径，兼容 GitHub Pages 子路径部署。
- 界面语言为中文；按钮等触控目标最小 48px。
- 兼容双击 `index.html` 直接打开（file://），因此使用 classic scripts + UMD，**不使用 ES Modules**（替代规格第 3 节中 ES Modules 的表述，理由见上）。
- 存档键名固定：`superpowers-save-v1`；星星范围 0-3。
- 解锁规则：第 1 颗星球默认开放；累计 6 星解锁下一颗；难度 2 需该游戏累计 2 星，难度 3 需累计 4 星。
- 每日限时：`settings.dailyLimitMinutes`，0 表示不限。
- git 仓库根为 `superpowers-game/`，分支 `main`；每完成一个任务必须提交一次。若 `git` 不在 PATH，使用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe`。
- 运行单元测试：`node tests/run-tests.js`（Node 不在 PATH 时用 `C:\Users\admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`）。
- 本地预览：在 `superpowers-game/` 下运行 `python -m http.server 8000` 后访问 `http://localhost:8000`。

## 范围说明

本计划只覆盖 M1（规格第 3/4/5/7/8/9 节中的 M1 部分）。4 款小游戏（规格第 6 节）在 M1 完成后分别制定 M2/M3 计划；M4 打磨发布另立计划。

---

### Task 1: 项目脚手架与太空主题

**Files:**
- Create: `index.html`
- Create: `css/base.css`

**Interfaces:**
- Consumes: 无
- Produces: 静态门户外壳；后续任务向 `index.html` 追加已声明的脚本文件即可，无需再改 HTML 结构。

- [ ] **Step 1: 创建 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>太空益智乐园</title>
  <link rel="stylesheet" href="css/base.css">
</head>
<body>
  <div id="app">
    <header class="sp-header">
      <div id="logo" class="sp-logo" title="飞船">🚀</div>
      <div class="sp-header-stats">
        <span id="starCount" class="sp-stat">★ 0</span>
        <span id="pointCount" class="sp-stat">⚡ 0</span>
      </div>
      <button id="muteBtn" class="sp-icon-btn" title="静音">🔊</button>
    </header>
    <main id="map" class="sp-map"></main>
  </div>
  <script src="js/core/storage.js"></script>
  <script src="js/core/scoring.js"></script>
  <script src="js/core/usage.js"></script>
  <script src="js/core/audio.js"></script>
  <script src="js/core/ui.js"></script>
  <script src="js/core/parent-area.js"></script>
  <script src="js/portal.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 `css/base.css`**

```css
:root {
  --sp-bg: #0b1026;
  --sp-bg-soft: #121a3d;
  --sp-accent: #ffd166;
  --sp-accent-2: #ef476f;
  --sp-text: #f8f9fa;
  --sp-text-dim: #b8c0d8;
  --sp-radius: 18px;
  --sp-font: "Microsoft YaHei", "PingFang SC", sans-serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; min-height: 100%; }
body {
  font-family: var(--sp-font);
  background: radial-gradient(ellipse at 50% 0%, #1b2a6b 0%, var(--sp-bg) 65%);
  color: var(--sp-text);
}
.sp-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; }
.sp-logo { font-size: 30px; cursor: pointer; user-select: none; }
.sp-header-stats { display: flex; gap: 14px; font-size: 18px; }
.sp-stat { background: var(--sp-bg-soft); padding: 6px 14px; border-radius: 999px; }
.sp-icon-btn { background: var(--sp-bg-soft); border: none; border-radius: 12px; color: var(--sp-text); font-size: 20px; padding: 8px 12px; cursor: pointer; min-width: 48px; min-height: 48px; }
.sp-map { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; padding: 24px; max-width: 900px; margin: 0 auto; }
.sp-planet { background: linear-gradient(145deg, #3b4aa0, #232d66); border: none; border-radius: var(--sp-radius); color: var(--sp-text); padding: 26px 14px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 160px; }
.sp-planet-icon { font-size: 52px; }
.sp-planet-name { font-size: 18px; }
.sp-planet-stars { color: var(--sp-accent); letter-spacing: 3px; }
.sp-planet-locked { opacity: 0.55; filter: grayscale(0.6); }
.sp-planet-lock { font-size: 13px; color: var(--sp-text-dim); }
.sp-toast { position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%); background: #1e2a5e; border: 1px solid #3d4f9f; padding: 12px 22px; border-radius: 999px; z-index: 90; }
.sp-modal-overlay, .sp-result-overlay, .sp-rest-overlay, .sp-parent-overlay { position: fixed; inset: 0; background: rgba(5, 8, 25, 0.72); display: flex; align-items: center; justify-content: center; z-index: 80; }
.sp-modal, .sp-result, .sp-parent-card { position: relative; background: #141c44; border-radius: var(--sp-radius); padding: 26px; min-width: min(420px, 90vw); }
.sp-modal-title, .sp-parent-title { margin-top: 0; }
.sp-modal-buttons { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.sp-btn { background: #2a3a7a; border: none; color: var(--sp-text); border-radius: 12px; padding: 12px 18px; font-size: 16px; cursor: pointer; min-height: 48px; min-width: 96px; }
.sp-btn-primary { background: var(--sp-accent); color: #241d05; font-weight: 700; }
.sp-btn-danger { background: var(--sp-accent-2); }
.sp-btn-ghost { background: transparent; border: 1px solid #3d4f9f; }
.sp-btn-close { position: absolute; top: 12px; right: 12px; min-width: 40px; padding: 8px; }
.sp-result { text-align: center; }
.sp-result-stars { font-size: 44px; color: var(--sp-accent); }
.sp-result-points { color: var(--sp-text-dim); }
.sp-result-message { font-size: 20px; }
.sp-result .sp-btn { margin: 8px; }
.sp-rest-overlay { flex-direction: column; text-align: center; }
.sp-rest-emoji { font-size: 60px; }
.sp-rest-card h2 { font-size: 32px; }
.sp-rest-note { color: var(--sp-text-dim); font-size: 14px; }
.sp-pin-input { width: 100%; padding: 12px; font-size: 22px; letter-spacing: 8px; text-align: center; border-radius: 10px; border: 1px solid #3d4f9f; background: #0e1533; color: var(--sp-text); margin: 8px 0; }
.sp-hint { color: var(--sp-accent-2); min-height: 20px; }
.sp-tabs { display: flex; gap: 8px; margin: 12px 0; }
.sp-tab { background: #2a3a7a; border: none; color: var(--sp-text); padding: 10px 16px; border-radius: 10px; cursor: pointer; }
.sp-progress-row, .sp-usage-row, .sp-setting-row { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-bottom: 1px solid #223063; }
.sp-usage-total { color: var(--sp-accent); }
.sp-setting-row { align-items: center; }
.sp-limit-input { width: 90px; padding: 8px; border-radius: 8px; border: 1px solid #3d4f9f; background: #0e1533; color: var(--sp-text); }
```

- [ ] **Step 3: 验证脚手架**

Run: 在 `superpowers-game/` 下 `python -m http.server 8000`，浏览器打开 `http://localhost:8000`
Expected: 页面为深蓝星空背景，顶部显示 🚀、★ 0、⚡ 0、🔊 按钮；地图区域为空；控制台无报错（缺失的脚本 404 可忽略，后续任务补齐）。

- [ ] **Step 4: 提交**

```bash
git add index.html css/base.css
git commit -m "feat: M1 脚手架与太空主题样式"
```

---

### Task 2: storage 存档模块（含降级）

**Files:**
- Create: `js/core/storage.js`
- Create: `tests/harness.js`
- Create: `tests/storage.test.js`

**Interfaces:**
- Consumes: 无
- Produces: `window.Superpowers.storage`（浏览器）/ `require("../js/core/storage.js")`（Node），API：
  - `KEY` : string = `"superpowers-save-v1"`
  - `createDefault()` → 合法默认存档对象
  - `sanitize(raw)` → 规范化后的存档对象（纯函数）
  - `load(store?)` → 存档对象（store 不可用/损坏时返回内存副本）
  - `save(save, store?)` → boolean
  - `reset(store?)` → 默认存档对象
  - `isAvailable(store?)` → boolean

- [ ] **Step 1: 写失败测试 `tests/harness.js` 与 `tests/storage.test.js`**

`tests/harness.js`：

```js
"use strict";
var failures = [];
var passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS " + name);
  } catch (e) {
    failures.push(name + ": " + e.message);
    console.error("FAIL " + name + " - " + e.message);
  }
}

function assertEqual(actual, expected, message) {
  var a = JSON.stringify(actual);
  var b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error((message || "") + " expected " + b + " got " + a);
  }
}

function assertTrue(value, message) {
  if (!value) throw new Error(message || "expected true");
}

function finish() {
  console.log("---- " + passed + " passed, " + failures.length + " failed ----");
  if (failures.length > 0) process.exitCode = 1;
}

module.exports = { test: test, assertEqual: assertEqual, assertTrue: assertTrue, finish: finish };
```

`tests/storage.test.js`：

```js
"use strict";
var h = require("./harness");
var storage = require("../js/core/storage.js");

function fakeStore() {
  var data = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

h.test("createDefault 返回合法默认存档", function () {
  var s = storage.createDefault();
  h.assertEqual(s.stars, 0);
  h.assertEqual(s.settings.dailyLimitMinutes, 30);
  h.assertEqual(s.settings.pin, "0000");
});

h.test("sanitize 修复损坏数据", function () {
  var s = storage.sanitize({
    stars: "abc",
    games: "nope",
    settings: { muted: "yes", dailyLimitMinutes: -5, pin: "12" },
    usage: { "2026-08-07": "9" }
  });
  h.assertEqual(s.stars, 0);
  h.assertEqual(s.settings.muted, false);
  h.assertEqual(s.settings.dailyLimitMinutes, 30);
  h.assertEqual(s.settings.pin, "0000");
  h.assertEqual(s.usage["2026-08-07"], 9);
});

h.test("save 后 load 往返一致", function () {
  var store = fakeStore();
  var s = storage.createDefault();
  s.stars = 6;
  s.games.arithmetic = { levels: { "1": 3 }, bestScore: 30, plays: 1, lastPlayedAt: "2026-08-07T00:00:00Z" };
  h.assertEqual(storage.save(s, store), true);
  var loaded = storage.load(store);
  h.assertEqual(loaded.stars, 6);
  h.assertEqual(loaded.games.arithmetic.levels["1"], 3);
});

h.test("store 不可用时降级为内存存档", function () {
  var broken = {
    getItem: function () { throw new Error("blocked"); },
    setItem: function () { throw new Error("blocked"); },
    removeItem: function () { throw new Error("blocked"); }
  };
  storage.save(storage.createDefault(), broken); // 写入内存
  var loaded = storage.load(broken);
  h.assertEqual(loaded.stars, 0);
});

h.test("reset 清除持久化数据", function () {
  var store = fakeStore();
  var s = storage.createDefault();
  s.stars = 12;
  storage.save(s, store);
  var fresh = storage.reset(store);
  h.assertEqual(fresh.stars, 0);
  h.assertEqual(store.getItem(storage.KEY), null);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/storage.test.js`
Expected: FAIL，报错 `Cannot find module '../js/core/storage.js'`（模块尚不存在）。

- [ ] **Step 3: 实现 `js/core/storage.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.storage = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "superpowers-save-v1";
  var memory = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefault() {
    return {
      stars: 0,
      points: 0,
      games: {},
      settings: {
        muted: false,
        dailyLimitMinutes: 30,
        pin: "0000"
      },
      usage: {}
    };
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return isFinite(n) && n >= 0 ? n : fallback;
  }

  function toBool(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function sanitizeGame(raw) {
    var game = raw && typeof raw === "object" ? raw : {};
    var levels = {};
    if (game.levels && typeof game.levels === "object") {
      Object.keys(game.levels).forEach(function (key) {
        levels[key] = Math.max(0, Math.min(3, toNumber(game.levels[key], 0)));
      });
    }
    return {
      levels: levels,
      bestScore: toNumber(game.bestScore, 0),
      plays: toNumber(game.plays, 0),
      lastPlayedAt: typeof game.lastPlayedAt === "string" ? game.lastPlayedAt : null
    };
  }

  function sanitize(raw) {
    var data = raw && typeof raw === "object" ? raw : {};
    var games = {};
    if (data.games && typeof data.games === "object") {
      Object.keys(data.games).forEach(function (id) {
        games[id] = sanitizeGame(data.games[id]);
      });
    }
    var settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    var usage = {};
    if (data.usage && typeof data.usage === "object") {
      Object.keys(data.usage).forEach(function (day) {
        usage[day] = toNumber(data.usage[day], 0);
      });
    }
    return {
      stars: toNumber(data.stars, 0),
      points: toNumber(data.points, 0),
      games: games,
      settings: {
        muted: toBool(settings.muted, false),
        dailyLimitMinutes: toNumber(settings.dailyLimitMinutes, 30),
        pin: typeof settings.pin === "string" && /^\d{4}$/.test(settings.pin) ? settings.pin : "0000"
      },
      usage: usage
    };
  }

  function defaultStore() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch (e) {
      return null;
    }
  }

  function isAvailable(store) {
    var s = store || defaultStore();
    if (!s) return false;
    try {
      var probe = "__superpowers_probe__";
      s.setItem(probe, "1");
      var value = s.getItem(probe);
      s.removeItem(probe);
      return value === "1";
    } catch (e) {
      return false;
    }
  }

  function load(store) {
    var s = store || defaultStore();
    if (s) {
      try {
        var raw = s.getItem(KEY);
        if (raw) return sanitize(JSON.parse(raw));
      } catch (e) {
        // 损坏或不可用：走内存降级
      }
    }
    if (memory) return clone(memory);
    var fresh = createDefault();
    memory = clone(fresh);
    return fresh;
  }

  function save(save, store) {
    var s = store || defaultStore();
    var data = sanitize(save || {});
    memory = clone(data);
    if (!s) return false;
    try {
      s.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function reset(store) {
    var fresh = createDefault();
    memory = clone(fresh);
    var s = store || defaultStore();
    if (s) {
      try {
        s.removeItem(KEY);
      } catch (e) { /* 忽略 */ }
    }
    return fresh;
  }

  return {
    KEY: KEY,
    createDefault: createDefault,
    sanitize: sanitize,
    load: load,
    save: save,
    reset: reset,
    isAvailable: isAvailable
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/storage.test.js`
Expected: 5 个测试全部 PASS，`---- 5 passed, 0 failed ----`，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add js/core/storage.js tests/harness.js tests/storage.test.js
git commit -m "feat: M1 storage 存档模块与测试"
```

---

### Task 3: scoring 计分与解锁规则模块

**Files:**
- Create: `js/core/scoring.js`
- Create: `tests/scoring.test.js`

**Interfaces:**
- Consumes: 无（纯函数，独立于 storage）
- Produces: `window.Superpowers.scoring` / `require("../js/core/scoring.js")`，API：
  - `emptyGame()` → `{ levels: {}, bestScore: 0, plays: 0, lastPlayedAt: null }`
  - `starsForCorrectRate(rate)` → 0/1/2/3（≥0.95→3，≥0.8→2，≥0.6→1，否则 0）
  - `gameStars(gameSave)` → 该游戏各难度星星之和
  - `difficultyUnlocked(gameSave, level)` → boolean（level≤1 恒 true；否则需累计 `2*(level-1)` 星）
  - `planetUnlocked(totalStars, index)` → boolean（index 0 恒 true；否则需 `6*index` 星）
  - `totalStars(save)` → 所有游戏星星之和
  - `applyResult(save, gameId, result)` → 新存档对象；`result = { level, stars(0-3), score, points, playedAt }`；星星取历史最高、积分累加、重算 `save.stars`

- [ ] **Step 1: 写失败测试 `tests/scoring.test.js`**

```js
"use strict";
var h = require("./harness");
var scoring = require("../js/core/scoring.js");

h.test("starsForCorrectRate 阈值", function () {
  h.assertEqual(scoring.starsForCorrectRate(1), 3);
  h.assertEqual(scoring.starsForCorrectRate(0.94), 2);
  h.assertEqual(scoring.starsForCorrectRate(0.8), 2);
  h.assertEqual(scoring.starsForCorrectRate(0.79), 1);
  h.assertEqual(scoring.starsForCorrectRate(0.6), 1);
  h.assertEqual(scoring.starsForCorrectRate(0.59), 0);
});

h.test("applyResult 更新星星、分数与积分", function () {
  var save = { stars: 0, points: 0, games: {} };
  var next = scoring.applyResult(save, "arithmetic", {
    level: 1, stars: 2, score: 20, points: 20, playedAt: "2026-08-07T00:00:00Z"
  });
  h.assertEqual(next.games.arithmetic.levels["1"], 2);
  h.assertEqual(next.games.arithmetic.bestScore, 20);
  h.assertEqual(next.games.arithmetic.plays, 1);
  h.assertEqual(next.stars, 2);
  h.assertEqual(next.points, 20);
});

h.test("applyResult 保留历史最高、星星只增不减", function () {
  var save = { stars: 0, points: 0, games: {} };
  save = scoring.applyResult(save, "arithmetic", { level: 1, stars: 3, score: 30, points: 30 });
  save = scoring.applyResult(save, "arithmetic", { level: 1, stars: 1, score: 5, points: 5 });
  h.assertEqual(save.games.arithmetic.levels["1"], 3);
  h.assertEqual(save.games.arithmetic.bestScore, 30);
  h.assertEqual(save.games.arithmetic.plays, 2);
  h.assertEqual(save.points, 35);
});

h.test("难度解锁阈值", function () {
  var g1 = { levels: { "1": 1 } };
  h.assertEqual(scoring.difficultyUnlocked(g1, 1), true);
  h.assertEqual(scoring.difficultyUnlocked(g1, 2), false);
  var g2 = { levels: { "1": 2 } };
  h.assertEqual(scoring.difficultyUnlocked(g2, 2), true);
  h.assertEqual(scoring.difficultyUnlocked(g2, 3), false);
  var g3 = { levels: { "1": 2, "2": 2 } };
  h.assertEqual(scoring.difficultyUnlocked(g3, 3), true);
});

h.test("星球解锁阈值", function () {
  h.assertEqual(scoring.planetUnlocked(0, 0), true);
  h.assertEqual(scoring.planetUnlocked(5, 1), false);
  h.assertEqual(scoring.planetUnlocked(6, 1), true);
  h.assertEqual(scoring.planetUnlocked(11, 2), false);
  h.assertEqual(scoring.planetUnlocked(12, 2), true);
});

h.test("totalStars 跨游戏求和", function () {
  var save = { games: { a: { levels: { "1": 3 } }, b: { levels: { "1": 2, "2": 1 } } } };
  h.assertEqual(scoring.totalStars(save), 6);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/scoring.test.js`
Expected: FAIL，`Cannot find module '../js/core/scoring.js'`。

- [ ] **Step 3: 实现 `js/core/scoring.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.scoring = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function emptyGame() {
    return { levels: {}, bestScore: 0, plays: 0, lastPlayedAt: null };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function starsForCorrectRate(rate) {
    if (rate >= 0.95) return 3;
    if (rate >= 0.8) return 2;
    if (rate >= 0.6) return 1;
    return 0;
  }

  function gameStars(gameSave) {
    var total = 0;
    var levels = (gameSave && gameSave.levels) || {};
    Object.keys(levels).forEach(function (key) {
      total += levels[key] || 0;
    });
    return total;
  }

  function difficultyUnlocked(gameSave, level) {
    if (!level || level <= 1) return true;
    return gameStars(gameSave) >= 2 * (level - 1);
  }

  function planetUnlocked(totalStars, index) {
    if (index <= 0) return true;
    return totalStars >= 6 * index;
  }

  function totalStars(save) {
    var total = 0;
    var games = (save && save.games) || {};
    Object.keys(games).forEach(function (id) {
      total += gameStars(games[id]);
    });
    return total;
  }

  function applyResult(save, gameId, result) {
    var next = clone(save || {});
    next.games = next.games || {};
    var game = next.games[gameId] || emptyGame();
    var level = result && result.level ? String(result.level) : "1";
    var stars = Math.max(0, Math.min(3, Math.round((result && result.stars) || 0)));
    game.levels[level] = Math.max(game.levels[level] || 0, stars);
    game.bestScore = Math.max(game.bestScore || 0, (result && result.score) || 0);
    game.plays = (game.plays || 0) + 1;
    game.lastPlayedAt = (result && result.playedAt) || new Date().toISOString();
    next.games[gameId] = game;
    next.stars = totalStars(next);
    next.points = (next.points || 0) + Math.max(0, (result && result.points) || (result && result.score) || 0);
    return next;
  }

  return {
    emptyGame: emptyGame,
    starsForCorrectRate: starsForCorrectRate,
    gameStars: gameStars,
    difficultyUnlocked: difficultyUnlocked,
    planetUnlocked: planetUnlocked,
    totalStars: totalStars,
    applyResult: applyResult
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/scoring.test.js`
Expected: 6 个测试全部 PASS，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add js/core/scoring.js tests/scoring.test.js
git commit -m "feat: M1 scoring 计分与解锁规则模块与测试"
```

---

### Task 4: usage 游玩时长与每日限时模块

**Files:**
- Create: `js/core/usage.js`
- Create: `tests/usage.test.js`

**Interfaces:**
- Consumes: 无
- Produces: `window.Superpowers.usage` / `require("../js/core/usage.js")`，API：
  - `todayKey(date?)` → `"YYYY-MM-DD"`（本地时区）
  - `usageForDay(save, day)` → 分钟数
  - `addUsage(save, minutes, now?)` → 新存档对象（当日分钟累加）
  - `isOverLimit(save, now?)` → boolean（limit≤0 恒 false）
  - `lastDaysUsage(save, days, now?)` → `[{ day, minutes }]`，从旧到新

- [ ] **Step 1: 写失败测试 `tests/usage.test.js`**

```js
"use strict";
var h = require("./harness");
var usage = require("../js/core/usage.js");

h.test("todayKey 格式化本地日期", function () {
  h.assertEqual(usage.todayKey(new Date(2026, 7, 7)), "2026-08-07");
});

h.test("addUsage 累加当日分钟", function () {
  var save = { settings: {}, usage: {} };
  var next = usage.addUsage(save, 5, new Date(2026, 7, 7));
  h.assertEqual(next.usage["2026-08-07"], 5);
});

h.test("isOverLimit 遵循限时设置", function () {
  var save = { settings: { dailyLimitMinutes: 30 }, usage: { "2026-08-07": 30 } };
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), true);
  save.usage["2026-08-07"] = 29;
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), false);
  save.settings.dailyLimitMinutes = 0;
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), false);
});

h.test("lastDaysUsage 返回近 N 天（旧到新）", function () {
  var save = { usage: { "2026-08-05": 10, "2026-08-07": 5 } };
  var rows = usage.lastDaysUsage(save, 3, new Date(2026, 7, 7));
  h.assertEqual(rows.length, 3);
  h.assertEqual(rows[0].day, "2026-08-05");
  h.assertEqual(rows[0].minutes, 10);
  h.assertEqual(rows[1].day, "2026-08-06");
  h.assertEqual(rows[1].minutes, 0);
  h.assertEqual(rows[2].day, "2026-08-07");
  h.assertEqual(rows[2].minutes, 5);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/usage.test.js`
Expected: FAIL，`Cannot find module '../js/core/usage.js'`。

- [ ] **Step 3: 实现 `js/core/usage.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.usage = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function usageForDay(save, day) {
    return ((save && save.usage && save.usage[day]) || 0);
  }

  function addUsage(save, minutes, now) {
    var next = clone(save || {});
    next.usage = next.usage || {};
    var day = todayKey(now);
    next.usage[day] = (next.usage[day] || 0) + Math.max(0, minutes);
    return next;
  }

  function isOverLimit(save, now) {
    var limit = save && save.settings ? save.settings.dailyLimitMinutes : 0;
    if (!limit || limit <= 0) return false;
    return usageForDay(save, todayKey(now)) >= limit;
  }

  function lastDaysUsage(save, days, now) {
    var d = now || new Date();
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var date = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      out.push({ day: todayKey(date), minutes: usageForDay(save, todayKey(date)) });
    }
    return out;
  }

  return {
    todayKey: todayKey,
    usageForDay: usageForDay,
    addUsage: addUsage,
    isOverLimit: isOverLimit,
    lastDaysUsage: lastDaysUsage
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/usage.test.js`
Expected: 4 个测试全部 PASS，退出码 0。

- [ ] **Step 5: 提交**

```bash
git add js/core/usage.js tests/usage.test.js
git commit -m "feat: M1 usage 游玩时长与限时模块与测试"
```

---

### Task 5: audio 音频合成模块

**Files:**
- Create: `js/core/audio.js`

**Interfaces:**
- Consumes: 无
- Produces: `window.Superpowers.audio`，API：
  - `init()` → AudioContext 或 null（首次用户交互时调用）
  - `play(name)` → void；name ∈ `click | flip | correct | wrong | win`
  - `setMuted(bool)` / `isMuted()` → void / boolean
  - `startBgm()` / `stopBgm()` → void

- [ ] **Step 1: 实现 `js/core/audio.js`**

```js
(function () {
  "use strict";

  var ctx = null;
  var muted = false;
  var bgmTimer = null;
  var bgmNotes = [261.63, 293.66, 329.63, 392.00, 329.63, 293.66];
  var bgmIndex = 0;

  var SFX = {
    click: [880],
    flip: [660],
    correct: [523.25, 659.25, 783.99],
    wrong: [220, 174.61],
    win: [523.25, 659.25, 783.99, 1046.5]
  };

  function init() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, start, duration, type, gainValue) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration + 0.05);
  }

  function play(name) {
    if (muted) return;
    if (!init()) return;
    var notes = SFX[name] || SFX.click;
    notes.forEach(function (freq, i) {
      tone(freq, i * 0.09, 0.18, name === "wrong" ? "triangle" : "sine");
    });
  }

  function setMuted(value) {
    muted = !!value;
    if (muted) stopBgm();
  }

  function isMuted() {
    return muted;
  }

  function startBgm() {
    if (muted || bgmTimer) return;
    if (!init()) return;
    bgmTimer = setInterval(function () {
      if (muted) return;
      tone(bgmNotes[bgmIndex % bgmNotes.length], 0, 0.9, "triangle", 0.04);
      bgmIndex += 1;
    }, 480);
  }

  function stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  window.Superpowers = window.Superpowers || {};
  window.Superpowers.audio = {
    init: init,
    play: play,
    setMuted: setMuted,
    isMuted: isMuted,
    startBgm: startBgm,
    stopBgm: stopBgm
  };
})();
```

- [ ] **Step 2: 手动验收音频**

Run: 启动本地服务打开页面，在页面任意处点击一次（解锁 AudioContext），然后控制台执行 `Superpowers.audio.play("correct")`、`play("wrong")`、`play("win")`
Expected: 依次听到上行琶音、柔和低音、号角式和弦；`Superpowers.audio.startBgm()` 后听到轻量循环旋律；`setMuted(true)` 后全部静音。无报错。

- [ ] **Step 3: 提交**

```bash
git add js/core/audio.js
git commit -m "feat: M1 Web Audio 合成音效与背景音乐"
```

---

### Task 6: ui 共享组件模块

**Files:**
- Create: `js/core/ui.js`
- Create: `tests/ui.test.js`

**Interfaces:**
- Consumes: 无（`formatTime` 为纯函数）
- Produces: `window.Superpowers.ui` / `require("../js/core/ui.js")`，API：
  - `formatTime(ms)` → `"M:SS"`
  - `showToast(message)` → void
  - `openModal({ title, body, buttons: [{id,label,kind}], onChoose(id) })` → void
  - `showResult({ stars, points, message, onReplay, onHome })` → void
  - `startCountdown(seconds, onTick, onDone)` → stop 函数

- [ ] **Step 1: 写失败测试 `tests/ui.test.js`**

```js
"use strict";
var h = require("./harness");
var ui = require("../js/core/ui.js");

h.test("formatTime 格式化毫秒为 M:SS", function () {
  h.assertEqual(ui.formatTime(0), "0:00");
  h.assertEqual(ui.formatTime(61000), "1:01");
  h.assertEqual(ui.formatTime(90000), "1:30");
  h.assertEqual(ui.formatTime(-500), "0:00");
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/ui.test.js`
Expected: FAIL，`Cannot find module '../js/core/ui.js'`。

- [ ] **Step 3: 实现 `js/core/ui.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.ui = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function formatTime(ms) {
    var totalSeconds = Math.max(0, Math.round(ms / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showToast(message) {
    var existing = document.querySelector(".sp-toast");
    if (existing) existing.remove();
    var toast = el("div", "sp-toast", message);
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 1800);
  }

  function openModal(options) {
    var opts = options || {};
    var overlay = el("div", "sp-modal-overlay");
    var box = el("div", "sp-modal");
    box.appendChild(el("h2", "sp-modal-title", opts.title || ""));
    var body = el("div", "sp-modal-body");
    if (typeof opts.body === "string") {
      body.innerHTML = opts.body;
    } else if (opts.body) {
      body.appendChild(opts.body);
    }
    box.appendChild(body);
    var buttons = opts.buttons || [{ id: "ok", label: "确定" }];
    var buttonRow = el("div", "sp-modal-buttons");
    buttons.forEach(function (btn) {
      var button = el("button", "sp-btn sp-btn-" + (btn.kind || "primary"), btn.label);
      button.addEventListener("click", function () {
        overlay.remove();
        if (opts.onChoose) opts.onChoose(btn.id);
      });
      buttonRow.appendChild(button);
    });
    box.appendChild(buttonRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function showResult(options) {
    var opts = options || {};
    var stars = "";
    for (var i = 0; i < 3; i++) {
      stars += i < (opts.stars || 0) ? "★" : "☆";
    }
    var overlay = el("div", "sp-result-overlay");
    var box = el("div", "sp-result");
    box.appendChild(el("div", "sp-result-stars", stars));
    if (opts.points !== undefined) {
      box.appendChild(el("p", "sp-result-points", "获得 " + opts.points + " 积分"));
    }
    box.appendChild(el("p", "sp-result-message", opts.message || "太棒了！"));
    var replay = el("button", "sp-btn sp-btn-primary", "再玩一次");
    replay.addEventListener("click", function () {
      overlay.remove();
      if (opts.onReplay) opts.onReplay();
    });
    var home = el("button", "sp-btn", "返回地图");
    home.addEventListener("click", function () {
      overlay.remove();
      if (opts.onHome) opts.onHome();
    });
    box.appendChild(replay);
    box.appendChild(home);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function startCountdown(seconds, onTick, onDone) {
    var remaining = Math.max(0, Math.floor(seconds));
    if (onTick) onTick(remaining);
    var timer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        if (onDone) onDone();
      } else if (onTick) {
        onTick(remaining);
      }
    }, 1000);
    return function () { clearInterval(timer); };
  }

  return {
    formatTime: formatTime,
    showToast: showToast,
    openModal: openModal,
    showResult: showResult,
    startCountdown: startCountdown
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/ui.test.js`
Expected: 1 个测试 PASS，退出码 0。

- [ ] **Step 5: 手动验收 UI 组件**

Run: 打开页面，控制台依次执行：
`Superpowers.ui.showToast("你好")`、`Superpowers.ui.openModal({ title: "测试", body: "内容", buttons: [{id:"a",label:"A"},{id:"b",label:"B",kind:"ghost"}], onChoose: (id)=>console.log(id) })`、`Superpowers.ui.showResult({ stars: 2, points: 15, message: "好棒", onHome: ()=>{}, onReplay: ()=>{} })`、`Superpowers.ui.startCountdown(3, (n)=>console.log(n), ()=>console.log("done"))`
Expected: toast 出现 1.8 秒后消失；模态框按钮可点且回调输出对应 id；结算页显示 ★★☆ 与积分；倒计时输出 3→2→1→done。

- [ ] **Step 6: 提交**

```bash
git add js/core/ui.js tests/ui.test.js
git commit -m "feat: M1 ui 共享组件与 formatTime 测试"
```

---

### Task 7: portal 门户逻辑

**Files:**
- Create: `js/portal.js`

**Interfaces:**
- Consumes: `Superpowers.storage.load/save`、`Superpowers.scoring.planetUnlocked/gameStars`、`Superpowers.audio.setMuted`、`Superpowers.ui.showToast`
- Produces: `window.Superpowers.portal = { GAMES }`，其中 `GAMES` 为 4 颗星球配置数组 `[{ id, name, icon }]`（id 顺序：arithmetic, memory, spelling, logic），后续游戏任务和家长区读取该配置。

- [ ] **Step 1: 实现 `js/portal.js`**

```js
(function () {
  "use strict";

  var GAMES = [
    { id: "arithmetic", name: "算术速算", icon: "🪐" },
    { id: "memory", name: "记忆翻牌", icon: "🌕" },
    { id: "spelling", name: "拼单词", icon: "☄️" },
    { id: "logic", name: "逻辑推理", icon: "🛸" }
  ];

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var parentArea = window.Superpowers.parentArea;

  var save = null;

  function refreshHeader() {
    document.getElementById("starCount").textContent = "★ " + save.stars;
    document.getElementById("pointCount").textContent = "⚡ " + save.points;
    document.getElementById("muteBtn").textContent = save.settings.muted ? "🔇" : "🔊";
  }

  function renderMap() {
    var map = document.getElementById("map");
    map.innerHTML = "";
    GAMES.forEach(function (game, index) {
      var unlocked = scoring.planetUnlocked(save.stars, index);
      var card = document.createElement("button");
      card.className = "sp-planet" + (unlocked ? "" : " sp-planet-locked");
      var html = '<span class="sp-planet-icon">' + game.icon + '</span><span class="sp-planet-name">' + game.name + "</span>";
      if (unlocked) {
        var stars = scoring.gameStars(save.games[game.id]);
        html += '<span class="sp-planet-stars">' + "★".repeat(stars) + "</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          ui.showToast(game.name + " 即将上线，敬请期待！");
        });
      } else {
        var need = 6 * index - save.stars;
        html += '<span class="sp-planet-lock">🔒 再拿 ' + need + " 颗星星解锁</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          ui.showToast("再拿 " + need + " 颗星星解锁 " + game.name + "！");
        });
      }
      map.appendChild(card);
    });
  }

  function onSettingsChanged() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();
  }

  function init() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();

    document.getElementById("muteBtn").addEventListener("click", function () {
      save.settings.muted = !save.settings.muted;
      audio.setMuted(save.settings.muted);
      storage.save(save);
      refreshHeader();
    });

    var logo = document.getElementById("logo");
    var logoClicks = 0;
    var logoTimer = null;
    logo.addEventListener("click", function () {
      logoClicks += 1;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1200);
      if (logoClicks >= 5) {
        logoClicks = 0;
        if (parentArea && parentArea.openParentArea) {
          parentArea.openParentArea(onSettingsChanged);
        } else {
          ui.showToast("家长区即将上线");
        }
      }
    });
  }

  window.Superpowers = window.Superpowers || {};
  window.Superpowers.portal = { GAMES: GAMES };

  document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: 手动验收门户**

Run: 打开页面
Expected: 地图出现 4 张星球卡片；第 1 张（算术速算）可用，其余 3 张锁定并显示"再拿 6/12/18 颗星星解锁"；点击未解锁星球出现 toast；点击已解锁星球出现"即将上线"toast；静音按钮在 🔊/🔇 间切换；连点 🚀 5 次出现"家长区即将上线"toast（家长区下一任务实现）。

- [ ] **Step 3: 提交**

```bash
git add js/portal.js
git commit -m "feat: M1 门户星球地图与解锁逻辑"
```

---

### Task 8: parent-area 家长区

**Files:**
- Create: `js/core/parent-area.js`
- Create: `tests/parent-area.test.js`

**Interfaces:**
- Consumes: `Superpowers.storage.load/save/reset`、`Superpowers.scoring.gameStars`、`Superpowers.usage.lastDaysUsage`、`Superpowers.audio.setMuted`、`Superpowers.ui.showToast/openModal`、`Superpowers.portal.GAMES`
- Produces: `window.Superpowers.parentArea` / `require("../js/core/parent-area.js")`，API：
  - `isValidPin(input, storedPin)` → boolean（4 位数字且相等）
  - `isDefaultPin(pin)` → boolean（pin === "0000"）
  - `openParentArea(onChanged)` → void；onChanged 在设置/重置后回调

- [ ] **Step 1: 写失败测试 `tests/parent-area.test.js`**

```js
"use strict";
var h = require("./harness");
var parentArea = require("../js/core/parent-area.js");

h.test("isValidPin 仅接受匹配的 4 位数字", function () {
  h.assertEqual(parentArea.isValidPin("1234", "1234"), true);
  h.assertEqual(parentArea.isValidPin("123", "1234"), false);
  h.assertEqual(parentArea.isValidPin("abcd", "1234"), false);
  h.assertEqual(parentArea.isValidPin("0000", "0000"), true);
});

h.test("isDefaultPin 识别默认 PIN", function () {
  h.assertEqual(parentArea.isDefaultPin("0000"), true);
  h.assertEqual(parentArea.isDefaultPin("1234"), false);
});

h.finish();
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node tests/parent-area.test.js`
Expected: FAIL，`Cannot find module '../js/core/parent-area.js'`。

- [ ] **Step 3: 实现 `js/core/parent-area.js`**

```js
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.parentArea = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isValidPin(input, storedPin) {
    return typeof input === "string" && /^\d{4}$/.test(input) && input === storedPin;
  }

  function isDefaultPin(pin) {
    return pin === "0000";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function openParentArea(onChanged) {
    var storage = window.Superpowers.storage;
    var save = storage.load();
    var view = overlay();

    if (isDefaultPin(save.settings.pin)) {
      showSetPin(view, function (newPin) {
        save.settings.pin = newPin;
        storage.save(save);
        showPinPrompt(view, function () { showDashboard(view, onChanged); });
      });
      return;
    }

    showPinPrompt(view, function () { showDashboard(view, onChanged); });
  }

  function overlay() {
    var o = el("div", "sp-parent-overlay");
    var card = el("div", "sp-parent-card");
    var close = el("button", "sp-btn sp-btn-close", "✕");
    close.addEventListener("click", function () { o.remove(); });
    card.appendChild(close);
    o.appendChild(card);
    document.body.appendChild(o);
    return { overlay: o, card: card };
  }

  function showSetPin(view, onSet) {
    view.card.appendChild(el("h2", "sp-parent-title", "首次进入：设置家长 PIN"));
    var input = el("input", "sp-pin-input");
    input.type = "password";
    input.maxLength = 4;
    input.placeholder = "4 位数字";
    var input2 = el("input", "sp-pin-input");
    input2.type = "password";
    input2.maxLength = 4;
    input2.placeholder = "再次输入";
    var hint = el("p", "sp-hint", "");
    var ok = el("button", "sp-btn sp-btn-primary", "保存 PIN");
    ok.addEventListener("click", function () {
      if (!/^\d{4}$/.test(input.value)) { hint.textContent = "请输入 4 位数字"; return; }
      if (input.value !== input2.value) { hint.textContent = "两次输入不一致"; return; }
      if (input.value === "0000") { hint.textContent = "不能使用默认 PIN"; return; }
      onSet(input.value);
    });
    view.card.appendChild(input);
    view.card.appendChild(input2);
    view.card.appendChild(hint);
    view.card.appendChild(ok);
  }

  function showPinPrompt(view, onSuccess) {
    view.card.appendChild(el("h2", "sp-parent-title", "家长验证"));
    var input = el("input", "sp-pin-input");
    input.type = "password";
    input.maxLength = 4;
    input.placeholder = "输入 4 位 PIN";
    var hint = el("p", "sp-hint", "");
    var attempts = 0;
    var ok = el("button", "sp-btn sp-btn-primary", "进入");
    ok.addEventListener("click", function () {
      var save = window.Superpowers.storage.load();
      if (window.Superpowers.parentArea.isValidPin(input.value, save.settings.pin)) {
        onSuccess();
      } else {
        attempts += 1;
        hint.textContent = "PIN 错误（" + attempts + "/3）";
        if (attempts >= 3) {
          view.overlay.remove();
          window.Superpowers.ui.showToast("验证失败，已退出家长区");
        }
      }
    });
    view.card.appendChild(input);
    view.card.appendChild(hint);
    view.card.appendChild(ok);
  }

  function showDashboard(view, onChanged) {
    view.card.appendChild(el("h2", "sp-parent-title", "家长区"));
    var tabs = el("div", "sp-tabs");
    var tabProgress = el("button", "sp-tab", "进度");
    var tabUsage = el("button", "sp-tab", "时长");
    var tabSettings = el("button", "sp-tab", "设置");
    tabs.appendChild(tabProgress);
    tabs.appendChild(tabUsage);
    tabs.appendChild(tabSettings);
    view.card.appendChild(tabs);
    var content = el("div", "sp-tab-content");
    view.card.appendChild(content);
    tabProgress.addEventListener("click", function () { renderProgress(content); });
    tabUsage.addEventListener("click", function () { renderUsage(content); });
    tabSettings.addEventListener("click", function () { renderSettings(content, onChanged); });
    renderProgress(content);
  }

  function renderProgress(content) {
    content.innerHTML = "";
    var save = window.Superpowers.storage.load();
    var games = (window.Superpowers.portal && window.Superpowers.portal.GAMES) || [];
    if (!games.length) {
      content.appendChild(el("p", "", "暂无游戏数据"));
      return;
    }
    games.forEach(function (game) {
      var g = save.games[game.id] || {};
      var stars = window.Superpowers.scoring.gameStars(g);
      var row = el("div", "sp-progress-row");
      row.appendChild(el("span", "", game.name));
      row.appendChild(el("span", "", "★ " + stars + " | 最高分 " + (g.bestScore || 0) + " | 玩过 " + (g.plays || 0) + " 次"));
      content.appendChild(row);
    });
  }

  function renderUsage(content) {
    content.innerHTML = "";
    var save = window.Superpowers.storage.load();
    var rows = window.Superpowers.usage.lastDaysUsage(save, 7);
    rows.forEach(function (row) {
      var line = el("div", "sp-usage-row");
      line.appendChild(el("span", "", row.day));
      line.appendChild(el("span", "", row.minutes + " 分钟"));
      content.appendChild(line);
    });
    var total = rows.reduce(function (sum, r) { return sum + r.minutes; }, 0);
    content.appendChild(el("p", "sp-usage-total", "近 7 天合计：" + total + " 分钟"));
  }

  function renderSettings(content, onChanged) {
    content.innerHTML = "";
    var storage = window.Superpowers.storage;
    var save = storage.load();

    var muteLabel = el("label", "sp-setting-row");
    var muteCheck = el("input", "");
    muteCheck.type = "checkbox";
    muteCheck.checked = save.settings.muted;
    muteLabel.appendChild(muteCheck);
    muteLabel.appendChild(el("span", "", "静音"));

    var limitLabel = el("label", "sp-setting-row");
    limitLabel.appendChild(el("span", "", "每日限时（分钟，0=不限）"));
    var limitInput = el("input", "sp-limit-input");
    limitInput.type = "number";
    limitInput.min = "0";
    limitInput.value = String(save.settings.dailyLimitMinutes);
    limitLabel.appendChild(limitInput);

    var saveBtn = el("button", "sp-btn sp-btn-primary", "保存设置");
    saveBtn.addEventListener("click", function () {
      save.settings.muted = muteCheck.checked;
      save.settings.dailyLimitMinutes = Math.max(0, Math.floor(Number(limitInput.value) || 0));
      storage.save(save);
      window.Superpowers.audio.setMuted(save.settings.muted);
      window.Superpowers.ui.showToast("设置已保存");
      if (onChanged) onChanged();
    });

    var resetBtn = el("button", "sp-btn sp-btn-danger", "重置存档");
    resetBtn.addEventListener("click", function () {
      window.Superpowers.ui.openModal({
        title: "确认重置？",
        body: "将清除所有星星、积分与设置。",
        buttons: [
          { id: "cancel", label: "取消", kind: "ghost" },
          { id: "confirm", label: "确认重置", kind: "danger" }
        ],
        onChoose: function (id) {
          if (id === "confirm") {
            storage.reset();
            window.Superpowers.ui.showToast("存档已重置");
            if (onChanged) onChanged();
          }
        }
      });
    });

    content.appendChild(muteLabel);
    content.appendChild(limitLabel);
    content.appendChild(saveBtn);
    content.appendChild(resetBtn);
  }

  return {
    isValidPin: isValidPin,
    isDefaultPin: isDefaultPin,
    openParentArea: openParentArea
  };
});
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node tests/parent-area.test.js`
Expected: 2 个测试全部 PASS，退出码 0。

- [ ] **Step 5: 手动验收家长区**

Run: 打开页面，连点 🚀 5 次
Expected: 首次进入出现"设置家长 PIN"（拒绝 0000、非 4 位、两次不一致）；设置成功后进入"家长验证"；输错 3 次自动退出；正确 PIN 进入家长区，进度/时长/设置三个标签页可用；设置页可改静音与限时、可重置存档（有确认弹窗）。

- [ ] **Step 6: 提交**

```bash
git add js/core/parent-area.js tests/parent-area.test.js
git commit -m "feat: M1 家长区（PIN、进度、时长、设置、重置）"
```

---

### Task 9: 每日限时拦截与游玩计时

**Files:**
- Modify: `js/portal.js`（替换为最终版：加入 `tickSession`、`checkLimit`、首次交互解锁音频，并暴露 `GAMES`）

**Interfaces:**
- Consumes: `Superpowers.usage.addUsage/isOverLimit`、`Superpowers.parentArea.openParentArea`
- Produces: 无新 API；portal 每 60 秒把 1 分钟写入当日 usage，超限时显示休息屏。

- [ ] **Step 1: 将 `js/portal.js` 替换为最终版**

```js
(function () {
  "use strict";

  var GAMES = [
    { id: "arithmetic", name: "算术速算", icon: "🪐" },
    { id: "memory", name: "记忆翻牌", icon: "🌕" },
    { id: "spelling", name: "拼单词", icon: "☄️" },
    { id: "logic", name: "逻辑推理", icon: "🛸" }
  ];

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var usage = window.Superpowers.usage;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var parentArea = window.Superpowers.parentArea;

  var save = null;
  var sessionTimer = null;

  function refreshHeader() {
    document.getElementById("starCount").textContent = "★ " + save.stars;
    document.getElementById("pointCount").textContent = "⚡ " + save.points;
    document.getElementById("muteBtn").textContent = save.settings.muted ? "🔇" : "🔊";
  }

  function renderMap() {
    var map = document.getElementById("map");
    map.innerHTML = "";
    GAMES.forEach(function (game, index) {
      var unlocked = scoring.planetUnlocked(save.stars, index);
      var card = document.createElement("button");
      card.className = "sp-planet" + (unlocked ? "" : " sp-planet-locked");
      var html = '<span class="sp-planet-icon">' + game.icon + '</span><span class="sp-planet-name">' + game.name + "</span>";
      if (unlocked) {
        var stars = scoring.gameStars(save.games[game.id]);
        html += '<span class="sp-planet-stars">' + "★".repeat(stars) + "</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          ui.showToast(game.name + " 即将上线，敬请期待！");
        });
      } else {
        var need = 6 * index - save.stars;
        html += '<span class="sp-planet-lock">🔒 再拿 ' + need + " 颗星星解锁</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          ui.showToast("再拿 " + need + " 颗星星解锁 " + game.name + "！");
        });
      }
      map.appendChild(card);
    });
  }

  function checkLimit() {
    if (usage.isOverLimit(save)) {
      if (!document.querySelector(".sp-rest-overlay")) {
        var overlay = document.createElement("div");
        overlay.className = "sp-rest-overlay";
        overlay.innerHTML = '<div class="sp-rest-card"><div class="sp-rest-emoji">☄️</div><h2>该休息啦</h2><p>去喝口水，看看窗外吧！</p><p class="sp-rest-note">今日已达每日限时，家长可在家长区调整。</p></div>';
        document.body.appendChild(overlay);
        var clicks = 0;
        overlay.addEventListener("click", function () {
          clicks += 1;
          if (clicks >= 5) {
            parentArea.openParentArea(onSettingsChanged);
          }
        });
      }
    } else {
      var rest = document.querySelector(".sp-rest-overlay");
      if (rest) rest.remove();
    }
  }

  function onSettingsChanged() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();
    checkLimit();
  }

  function tickSession() {
    save = usage.addUsage(save, 1);
    storage.save(save);
    refreshHeader();
    checkLimit();
  }

  function init() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();

    document.getElementById("muteBtn").addEventListener("click", function () {
      save.settings.muted = !save.settings.muted;
      audio.setMuted(save.settings.muted);
      storage.save(save);
      refreshHeader();
    });

    var logo = document.getElementById("logo");
    var logoClicks = 0;
    var logoTimer = null;
    logo.addEventListener("click", function () {
      logoClicks += 1;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1200);
      if (logoClicks >= 5) {
        logoClicks = 0;
        if (parentArea && parentArea.openParentArea) {
          parentArea.openParentArea(onSettingsChanged);
        } else {
          ui.showToast("家长区即将上线");
        }
      }
    });

    document.addEventListener("pointerdown", function () {
      audio.init();
      audio.startBgm();
    }, { once: true });

    sessionTimer = setInterval(tickSession, 60000);
    checkLimit();
  }

  window.Superpowers = window.Superpowers || {};
  window.Superpowers.portal = { GAMES: GAMES };

  document.addEventListener("DOMContentLoaded", init);
})();
```

- [ ] **Step 2: 手动验收每日限时与计时**

Run: 打开页面，控制台执行：
`var s = Superpowers.storage.load(); s.settings.dailyLimitMinutes = 1; s.usage = {}; Superpowers.storage.save(s);` 后刷新页面，再把 `Superpowers.usage.addUsage(Superpowers.storage.load(), 1)` 的结果 `storage.save` 回写并刷新
Expected: 出现"该休息啦 ☄️"全屏页；点击其他区域不消失；连点全屏页 5 次进入家长区，把限时改为 0 并保存，休息屏自动消失；页面停留每满 60 秒，家长区"时长"页当日分钟 +1。

- [ ] **Step 3: 提交**

```bash
git add js/portal.js
git commit -m "feat: M1 每日限时拦截与游玩计时"
```

---

### Task 10: 测试运行器、项目文档与最终验收

**Files:**
- Create: `tests/run-tests.js`
- Create: `README.md`
- Create: `docs/publishing.md`

**Interfaces:**
- Consumes: 全部测试文件与核心模块
- Produces: 统一测试入口 `node tests/run-tests.js`；项目 README 与发布指南。

- [ ] **Step 1: 创建 `tests/run-tests.js`**

```js
"use strict";
require("./storage.test.js");
require("./scoring.test.js");
require("./usage.test.js");
require("./ui.test.js");
require("./parent-area.test.js");
```

说明：各测试文件自带 `h.finish()` 汇总；`run-tests.js` 顺序加载全部测试。若某个测试文件失败，`process.exitCode` 置 1，整体退出码非 0。

- [ ] **Step 2: 运行全量测试**

Run: `node tests/run-tests.js`
Expected: 5 个文件、18 个测试全部 PASS，总输出 `---- 18 passed, 0 failed ----`，退出码 0。

- [ ] **Step 3: 创建 `README.md`**

```markdown
# 太空益智乐园

面向 9-12 岁儿童的太空探险主题益智网页游戏。当前版本为 M1 地基：门户星球地图、存档/计分/音效/限时核心系统与家长区。4 款小游戏（算术速算、记忆翻牌、拼单词、逻辑推理）将在后续版本上线。

## 运行

- 本地预览：`python -m http.server 8000` 后访问 http://localhost:8000
- 直接打开 `index.html` 也可（经典脚本，兼容 file://）

## 测试

`node tests/run-tests.js`

## 发布

见 `docs/publishing.md`。
```

- [ ] **Step 4: 创建 `docs/publishing.md`**

```markdown
# 发布到 GitHub Pages

1. 在 GitHub 新建仓库（如 `space-puzzle`）。
2. 推送：`git remote add origin https://github.com/<用户名>/<仓库名>.git`，然后 `git push -u origin main`。
3. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)` → Save。
4. 等待约 1 分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

注意：项目内全部使用相对路径，子路径部署无需额外配置。
```

- [ ] **Step 5: 最终验收**

Run: 全量测试通过后，在桌面宽度（≥1024px）与窄屏（≤480px）各打开一次页面
Expected: 桌面为多列星球卡片，窄屏自动折行；所有按钮可点且不小于 48px；家长区三个标签页在两种宽度下均可操作；无控制台报错。

- [ ] **Step 6: 提交**

```bash
git add tests/run-tests.js README.md docs/publishing.md
git commit -m "docs: M1 测试运行器、README 与发布指南"
```

---

## M1 完成标准

- `node tests/run-tests.js` 全绿（18 个测试）。
- 门户显示 4 颗星球并按星星解锁；家长区可设置 PIN、查看进度与时长、设置限时与静音、重置存档；每日限时拦截生效。
- 项目零依赖、可双击打开、可一键推送到 GitHub Pages。
