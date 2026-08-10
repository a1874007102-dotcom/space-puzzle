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
