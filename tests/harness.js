"use strict";
var failures = [];
var passed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("PASS " + name);
  } catch (e) {
    failures.push(name + ": " + e.message);
    console.error("FAIL " + name + " - " + e.message);
  }
}

function assertEqual(actual, expected, message) {
  var a = JSON.stringify(actual);
  var b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error((message || "") + " expected " + b + " got " + a);
  }
}

function assertTrue(value, message) {
  if (!value) throw new Error(message || "expected true");
}

function finish() {
  console.log("---- " + passed + " passed, " + failures.length + " failed ----");
  if (failures.length > 0) process.exitCode = 1;
}

module.exports = { test: test, assertEqual: assertEqual, assertTrue: assertTrue, finish: finish };
