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
