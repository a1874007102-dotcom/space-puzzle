"use strict";
var h = require("./harness");
var usage = require("../js/core/usage.js");

h.test("todayKey 格式化本地日期", function () {
  h.assertEqual(usage.todayKey(new Date(2026, 7, 7)), "2026-08-07");
});

h.test("addUsage 累加当日分钟", function () {
  var save = { settings: {}, usage: {} };
  var next = usage.addUsage(save, 5, new Date(2026, 7, 7));
  h.assertEqual(next.usage["2026-08-07"], 5);
});

h.test("isOverLimit 遵循限时设置", function () {
  var save = { settings: { dailyLimitMinutes: 30 }, usage: { "2026-08-07": 30 } };
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), true);
  save.usage["2026-08-07"] = 29;
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), false);
  save.settings.dailyLimitMinutes = 0;
  h.assertEqual(usage.isOverLimit(save, new Date(2026, 7, 7)), false);
});

h.test("lastDaysUsage 返回近 N 天（旧到新）", function () {
  var save = { usage: { "2026-08-05": 10, "2026-08-07": 5 } };
  var rows = usage.lastDaysUsage(save, 3, new Date(2026, 7, 7));
  h.assertEqual(rows.length, 3);
  h.assertEqual(rows[0].day, "2026-08-05");
  h.assertEqual(rows[0].minutes, 10);
  h.assertEqual(rows[1].day, "2026-08-06");
  h.assertEqual(rows[1].minutes, 0);
  h.assertEqual(rows[2].day, "2026-08-07");
  h.assertEqual(rows[2].minutes, 5);
});

h.finish();
