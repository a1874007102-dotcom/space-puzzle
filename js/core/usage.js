(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.usage = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function usageForDay(save, day) {
    return ((save && save.usage && save.usage[day]) || 0);
  }

  function addUsage(save, minutes, now) {
    var next = clone(save || {});
    next.usage = next.usage || {};
    var day = todayKey(now);
    next.usage[day] = (next.usage[day] || 0) + Math.max(0, minutes);
    return next;
  }

  function isOverLimit(save, now) {
    var limit = save && save.settings ? save.settings.dailyLimitMinutes : 0;
    if (!limit || limit <= 0) return false;
    return usageForDay(save, todayKey(now)) >= limit;
  }

  function lastDaysUsage(save, days, now) {
    var d = now || new Date();
    var out = [];
    for (var i = days - 1; i >= 0; i--) {
      var date = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
      out.push({ day: todayKey(date), minutes: usageForDay(save, todayKey(date)) });
    }
    return out;
  }

  return {
    todayKey: todayKey,
    usageForDay: usageForDay,
    addUsage: addUsage,
    isOverLimit: isOverLimit,
    lastDaysUsage: lastDaysUsage
  };
});
