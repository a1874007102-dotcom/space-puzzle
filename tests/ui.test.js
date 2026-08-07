"use strict";
var h = require("./harness");
var ui = require("../js/core/ui.js");

h.test("formatTime 格式化毫秒为 M:SS", function () {
  h.assertEqual(ui.formatTime(0), "0:00");
  h.assertEqual(ui.formatTime(61000), "1:01");
  h.assertEqual(ui.formatTime(90000), "1:30");
  h.assertEqual(ui.formatTime(-500), "0:00");
});

h.finish();
