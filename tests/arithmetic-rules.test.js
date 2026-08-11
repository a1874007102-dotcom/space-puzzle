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
  h.assertEqual(rules.starsForRound(8, 10), 2);
  h.assertEqual(rules.starsForRound(7, 10), 1);
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
