"use strict";
var h = require("./harness");
var parentArea = require("../js/core/parent-area.js");

h.test("isValidPin 仅接受匹配的 4 位数字", function () {
  h.assertEqual(parentArea.isValidPin("1234", "1234"), true);
  h.assertEqual(parentArea.isValidPin("123", "1234"), false);
  h.assertEqual(parentArea.isValidPin("abcd", "1234"), false);
  h.assertEqual(parentArea.isValidPin("0000", "0000"), true);
});

h.test("isDefaultPin 识别默认 PIN", function () {
  h.assertEqual(parentArea.isDefaultPin("0000"), true);
  h.assertEqual(parentArea.isDefaultPin("1234"), false);
});

h.finish();
