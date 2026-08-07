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
