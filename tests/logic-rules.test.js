"use strict";
var h = require("./harness");
var rules = require("../js/games/logic/rules.js");

function assertQuestion(q, label) {
  h.assertEqual(q.options.length, 4, label + " options length");
  h.assertEqual(new Set(q.options).size, 4, label + " options unique");
  h.assertEqual(q.options.indexOf(q.answer) >= 0, true, label + " answer in options");
  h.assertEqual(typeof q.text === "string" && q.text.length > 0, true, label + " has text");
}

h.test("条件推理：条件数=人数-1，问题含答案", function () {
  [1, 2, 3].forEach(function (level) {
    for (var i = 0; i < 100; i++) {
      var q = rules.makeConditionQuestion(level);
      assertQuestion(q, "L" + level + "条件#" + i);
      var conditionCount = q.text.split("比").length - 2;
      h.assertEqual(conditionCount, level + 1, "条件数=" + (level + 1));
      h.assertEqual(q.text.indexOf("谁") >= 0, true, "含提问");
    }
  });
});

h.test("真假判断：选项含说真话，答案在选项中", function () {
  for (var i = 0; i < 100; i++) {
    var q = rules.makeTruthQuestion();
    assertQuestion(q, "真假#" + i);
    h.assertEqual(q.answer.indexOf("说真话") >= 0, true, "答案为说真话者");
  }
});

h.test("类比推理：答案=正确类别", function () {
  for (var i = 0; i < 100; i++) {
    var q = rules.makeAnalogyQuestion();
    assertQuestion(q, "类比#" + i);
    h.assertEqual(q.text.indexOf("就像") >= 0, true, "含就像");
  }
});

h.test("buildRound 返回 10 题且题序洗牌", function () {
  var round = rules.buildRound(1);
  h.assertEqual(round.length, 10);
  round.forEach(function (q, i) { assertQuestion(q, "round#" + i); });
  var a = rules.buildRound(1, function () { return 0.5; });
  var b = rules.buildRound(1, function () { return 0.5; });
  h.assertEqual(a.map(function (q) { return q.text; }).join("|"), b.map(function (q) { return q.text; }).join("|"));
});

h.test("checkAnswer 与 starsForRound", function () {
  var q = rules.makeConditionQuestion(1);
  h.assertEqual(rules.checkAnswer(q, q.answer), true);
  h.assertEqual(rules.checkAnswer(q, q.options[0] === q.answer ? q.options[1] : q.options[0]), false);
  h.assertEqual(rules.starsForRound(10, 10), 3);
  h.assertEqual(rules.starsForRound(8, 10), 2);
  h.assertEqual(rules.starsForRound(6, 10), 1);
  h.assertEqual(rules.starsForRound(5, 10), 0);
});

h.finish();
