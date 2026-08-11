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
