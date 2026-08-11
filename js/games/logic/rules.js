(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.logicRules = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var NAMES = ["小明", "小红", "小刚", "小丽", "小华", "小军", "小芳", "小强", "小雪", "小杰"];
  var ATTRS = ["身高", "体重", "年龄"];
  var ATTR_VERBS = { 身高: "高", 体重: "重", 年龄: "大" };
  var CATS = ["水果", "蔬菜", "动物", "植物", "家具", "颜色"];
  var ANALOGY = [
    { item: "苹果", cat: "水果" }, { item: "香蕉", cat: "水果" }, { item: "西瓜", cat: "水果" },
    { item: "白菜", cat: "蔬菜" }, { item: "萝卜", cat: "蔬菜" }, { item: "黄瓜", cat: "蔬菜" },
    { item: "小猫", cat: "动物" }, { item: "小狗", cat: "动物" }, { item: "老虎", cat: "动物" },
    { item: "玫瑰", cat: "植物" }, { item: "菊花", cat: "植物" }, { item: "荷花", cat: "植物" },
    { item: "桌子", cat: "家具" }, { item: "椅子", cat: "家具" }, { item: "柜子", cat: "家具" },
    { item: "红色", cat: "颜色" }, { item: "蓝色", cat: "颜色" }, { item: "黄色", cat: "颜色" }
  ];

  function shuffle(arr, rand) {
    var a = arr.slice();
    var r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pick(arr, rand) {
    return arr[Math.floor((rand || Math.random)() * arr.length)];
  }

  function sampleNames(n, rand) {
    return shuffle(NAMES, rand).slice(0, n);
  }

  function makeOptions(correct, distractorPool, rand) {
    var set = {};
    set[correct] = true;
    var opts = [correct];
    var pool = shuffle(distractorPool, rand);
    for (var i = 0; i < pool.length && opts.length < 4; i++) {
      if (!set[pool[i]]) { set[pool[i]] = true; opts.push(pool[i]); }
    }
    return shuffle(opts, rand);
  }

  function makeConditionQuestion(level, rand) {
    var n = level === 1 ? 3 : level === 2 ? 4 : 5;
    var names = sampleNames(n, rand);
    var attr = pick(ATTRS, rand);
    var verb = ATTR_VERBS[attr];
    var statements = [];
    for (var i = 0; i < n - 1; i++) {
      statements.push(names[i] + " 比 " + names[i + 1] + verb);
    }
    var qKind = pick(["最高", "最矮", "第二"], rand);
    var answer;
    if (qKind === "最高") answer = names[0];
    else if (qKind === "最矮") answer = names[n - 1];
    else answer = names[1];
    var others = names.filter(function (x) { return x !== answer; });
    var outside = shuffle(NAMES, rand).filter(function (x) { return names.indexOf(x) < 0; });
    var distractorPool = others.concat(outside);
    var text = names.join("、") + " 比" + attr + "。" + statements.join("，") + "。谁" + qKind + "？";
    return { text: text, options: makeOptions(answer, distractorPool, rand), answer: answer };
  }

  function makeTruthQuestion(rand) {
    var names = sampleNames(2, rand);
    var aHigher = (rand || Math.random)() < 0.5;
    var claimA = aHigher ? names[0] + " 比 " + names[1] + " 高" : names[1] + " 比 " + names[0] + " 高";
    var claimB = aHigher ? names[1] + " 比 " + names[0] + " 高" : names[0] + " 比 " + names[1] + " 高";
    var answer = aHigher ? names[0] : names[1];
    var text = names[0] + " 说：“" + claimA + "。”" + names[1] + " 说：“" + claimB + "。”两个人只有一个人说了真话。谁说真话？";
    var distractorPool = [
      (answer === names[0] ? names[1] : names[0]) + " 说真话",
      "两个人都说真话",
      "两个人都说假话"
    ];
    return { text: text, options: makeOptions(answer + " 说真话", distractorPool, rand), answer: answer + " 说真话" };
  }

  function makeAnalogyQuestion(rand) {
    var catA = pick(CATS, rand);
    var catB = pick(CATS.filter(function (c) { return c !== catA; }), rand);
    var itemA = pick(ANALOGY.filter(function (e) { return e.cat === catA; }), rand).item;
    var itemB = pick(ANALOGY.filter(function (e) { return e.cat === catB; }), rand).item;
    var text = itemA + " 是" + catA + "，就像 " + itemB + " 是 ？";
    var distractorPool = CATS.filter(function (c) { return c !== catB; });
    return { text: text, options: makeOptions(catB, distractorPool, rand), answer: catB };
  }

  function buildRound(level, rand) {
    var qs = [];
    for (var i = 0; i < 5; i++) qs.push(makeConditionQuestion(level, rand));
    for (var j = 0; j < 3; j++) qs.push(makeTruthQuestion(rand));
    for (var k = 0; k < 2; k++) qs.push(makeAnalogyQuestion(rand));
    return shuffle(qs, rand);
  }

  function checkAnswer(question, chosen) {
    return question.answer === chosen;
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
    makeConditionQuestion: makeConditionQuestion,
    makeTruthQuestion: makeTruthQuestion,
    makeAnalogyQuestion: makeAnalogyQuestion,
    buildRound: buildRound,
    checkAnswer: checkAnswer,
    starsForRound: starsForRound
  };
});
