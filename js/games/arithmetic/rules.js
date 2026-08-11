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
