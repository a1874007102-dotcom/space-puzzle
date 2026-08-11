(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./words.js"));
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.spellingRules = factory(root.Superpowers.spellingWords);
  }
})(typeof self !== "undefined" ? self : this, function (wordsData) {
  "use strict";

  function shuffle(arr, rand) {
    var a = arr.slice();
    var r = rand || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickWords(pool, count, rand) {
    return shuffle(pool, rand).slice(0, count);
  }

  function buildLetterPool(word, lang, rand) {
    var chars = word.split("");
    var distractorPool = lang === "zh" ? wordsData.ZH_DISTRACT : wordsData.EN_ALPHABET;
    var used = {};
    chars.forEach(function (c) { used[c] = true; });
    var distractors = [];
    var pool = shuffle(distractorPool, rand);
    for (var i = 0; i < pool.length && distractors.length < 3; i++) {
      if (!used[pool[i]]) { used[pool[i]] = true; distractors.push(pool[i]); }
    }
    return shuffle(chars.concat(distractors), rand);
  }

  function checkSpelling(answerChars, word) {
    return answerChars.join("") === word;
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
    pickWords: pickWords,
    buildLetterPool: buildLetterPool,
    checkSpelling: checkSpelling,
    starsForRound: starsForRound
  };
});
