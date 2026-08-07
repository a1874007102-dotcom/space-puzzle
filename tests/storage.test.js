"use strict";
var h = require("./harness");
var storage = require("../js/core/storage.js");

function fakeStore() {
  var data = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem: function (k, v) { data[k] = String(v); },
    removeItem: function (k) { delete data[k]; }
  };
}

h.test("createDefault 返回合法默认存档", function () {
  var s = storage.createDefault();
  h.assertEqual(s.stars, 0);
  h.assertEqual(s.settings.dailyLimitMinutes, 30);
  h.assertEqual(s.settings.pin, "0000");
});

h.test("sanitize 修复损坏数据", function () {
  var s = storage.sanitize({
    stars: "abc",
    games: "nope",
    settings: { muted: "yes", dailyLimitMinutes: -5, pin: "12" },
    usage: { "2026-08-07": "9" }
  });
  h.assertEqual(s.stars, 0);
  h.assertEqual(s.settings.muted, false);
  h.assertEqual(s.settings.dailyLimitMinutes, 30);
  h.assertEqual(s.settings.pin, "0000");
  h.assertEqual(s.usage["2026-08-07"], 9);
});

h.test("save 后 load 往返一致", function () {
  var store = fakeStore();
  var s = storage.createDefault();
  s.stars = 6;
  s.games.arithmetic = { levels: { "1": 3 }, bestScore: 30, plays: 1, lastPlayedAt: "2026-08-07T00:00:00Z" };
  h.assertEqual(storage.save(s, store), true);
  var loaded = storage.load(store);
  h.assertEqual(loaded.stars, 6);
  h.assertEqual(loaded.games.arithmetic.levels["1"], 3);
});

h.test("store 不可用时降级为内存存档", function () {
  var broken = {
    getItem: function () { throw new Error("blocked"); },
    setItem: function () { throw new Error("blocked"); },
    removeItem: function () { throw new Error("blocked"); }
  };
  storage.save(storage.createDefault(), broken); // 写入内存
  var loaded = storage.load(broken);
  h.assertEqual(loaded.stars, 0);
});

h.test("reset 清除持久化数据", function () {
  var store = fakeStore();
  var s = storage.createDefault();
  s.stars = 12;
  storage.save(s, store);
  var fresh = storage.reset(store);
  h.assertEqual(fresh.stars, 0);
  h.assertEqual(store.getItem(storage.KEY), null);
});

h.finish();
