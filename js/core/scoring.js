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
