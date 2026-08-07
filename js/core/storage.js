(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.storage = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "superpowers-save-v1";
  var memory = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createDefault() {
    return {
      stars: 0,
      points: 0,
      games: {},
      settings: {
        muted: false,
        dailyLimitMinutes: 30,
        pin: "0000"
      },
      usage: {}
    };
  }

  function toNumber(value, fallback) {
    var n = Number(value);
    return isFinite(n) && n >= 0 ? n : fallback;
  }

  function toBool(value, fallback) {
    return typeof value === "boolean" ? value : fallback;
  }

  function sanitizeGame(raw) {
    var game = raw && typeof raw === "object" ? raw : {};
    var levels = {};
    if (game.levels && typeof game.levels === "object") {
      Object.keys(game.levels).forEach(function (key) {
        levels[key] = Math.max(0, Math.min(3, toNumber(game.levels[key], 0)));
      });
    }
    return {
      levels: levels,
      bestScore: toNumber(game.bestScore, 0),
      plays: toNumber(game.plays, 0),
      lastPlayedAt: typeof game.lastPlayedAt === "string" ? game.lastPlayedAt : null
    };
  }

  function sanitize(raw) {
    var data = raw && typeof raw === "object" ? raw : {};
    var games = {};
    if (data.games && typeof data.games === "object") {
      Object.keys(data.games).forEach(function (id) {
        games[id] = sanitizeGame(data.games[id]);
      });
    }
    var settings = data.settings && typeof data.settings === "object" ? data.settings : {};
    var usage = {};
    if (data.usage && typeof data.usage === "object") {
      Object.keys(data.usage).forEach(function (day) {
        usage[day] = toNumber(data.usage[day], 0);
      });
    }
    return {
      stars: toNumber(data.stars, 0),
      points: toNumber(data.points, 0),
      games: games,
      settings: {
        muted: toBool(settings.muted, false),
        dailyLimitMinutes: toNumber(settings.dailyLimitMinutes, 30),
        pin: typeof settings.pin === "string" && /^\d{4}$/.test(settings.pin) ? settings.pin : "0000"
      },
      usage: usage
    };
  }

  function defaultStore() {
    try {
      return typeof localStorage !== "undefined" ? localStorage : null;
    } catch (e) {
      return null;
    }
  }

  function isAvailable(store) {
    var s = store || defaultStore();
    if (!s) return false;
    try {
      var probe = "__superpowers_probe__";
      s.setItem(probe, "1");
      var value = s.getItem(probe);
      s.removeItem(probe);
      return value === "1";
    } catch (e) {
      return false;
    }
  }

  function load(store) {
    var s = store || defaultStore();
    if (s) {
      try {
        var raw = s.getItem(KEY);
        if (raw) return sanitize(JSON.parse(raw));
      } catch (e) {
        // 损坏或不可用：走内存降级
      }
    }
    if (memory) return clone(memory);
    var fresh = createDefault();
    memory = clone(fresh);
    return fresh;
  }

  function save(save, store) {
    var s = store || defaultStore();
    var data = sanitize(save || {});
    memory = clone(data);
    if (!s) return false;
    try {
      s.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function reset(store) {
    var fresh = createDefault();
    memory = clone(fresh);
    var s = store || defaultStore();
    if (s) {
      try {
        s.removeItem(KEY);
      } catch (e) { /* 忽略 */ }
    }
    return fresh;
  }

  return {
    KEY: KEY,
    createDefault: createDefault,
    sanitize: sanitize,
    load: load,
    save: save,
    reset: reset,
    isAvailable: isAvailable
  };
});
