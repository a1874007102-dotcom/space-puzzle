"use strict";
var fs = require("fs");
var path = require("path");
var h = require("./harness");

function read(rel) {
  return fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
}

h.test("算术游戏 getElementById 引用均有对应 id 声明", function () {
  var src = read("js/games/arithmetic/game.js") + "\n" + read("arithmetic.html");
  var refs = [];
  var re = /getElementById\("([^"]+)"\)/g;
  var m;
  while ((m = re.exec(src)) !== null) refs.push(m[1]);
  h.assertEqual(refs.length >= 1, true, "存在 getElementById 引用");
  refs.forEach(function (id) {
    var declared = src.indexOf('id = "' + id + '"') >= 0 || src.indexOf('id="' + id + '"') >= 0;
    h.assertEqual(declared, true, "id 引用有对应声明: " + id);
  });
});

h.test("记忆游戏 querySelector 类引用均有对应元素", function () {
  var src = read("js/games/memory/game.js");
  var refs = [];
  var re = /querySelector\("\.([^"]+)"\)/g;
  var m;
  while ((m = re.exec(src)) !== null) refs.push(m[1]);
  h.assertEqual(refs.length >= 1, true, "存在 querySelector 引用");
  refs.forEach(function (cls) {
    h.assertEqual(src.indexOf('"' + cls + '"') >= 0, true, "类引用有对应创建: " + cls);
  });
});

h.finish();
