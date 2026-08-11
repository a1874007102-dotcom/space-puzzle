(function () {
  "use strict";

  var GAMES = [
    { id: "arithmetic", name: "算术速算", icon: "🪐", url: "arithmetic.html" },
    { id: "memory", name: "记忆翻牌", icon: "🌕", url: "memory.html" },
    { id: "spelling", name: "拼单词", icon: "☄️", url: "spelling.html" },
    { id: "logic", name: "逻辑推理", icon: "🛸", url: "logic.html" }
  ];

  var storage = window.Superpowers.storage;
  var scoring = window.Superpowers.scoring;
  var usage = window.Superpowers.usage;
  var audio = window.Superpowers.audio;
  var ui = window.Superpowers.ui;
  var parentArea = window.Superpowers.parentArea;

  var save = null;
  var sessionTimer = null;

  function refreshHeader() {
    document.getElementById("starCount").textContent = "★ " + save.stars;
    document.getElementById("pointCount").textContent = "⚡ " + save.points;
    document.getElementById("muteBtn").textContent = save.settings.muted ? "🔇" : "🔊";
  }

  function renderMap() {
    var map = document.getElementById("map");
    map.innerHTML = "";
    GAMES.forEach(function (game, index) {
      var unlocked = scoring.planetUnlocked(save.stars, index);
      var card = document.createElement("button");
      card.className = "sp-planet" + (unlocked ? "" : " sp-planet-locked");
      var html = '<span class="sp-planet-icon">' + game.icon + '</span><span class="sp-planet-name">' + game.name + "</span>";
      if (unlocked) {
        var stars = scoring.gameStars(save.games[game.id]);
        html += '<span class="sp-planet-stars">' + "★".repeat(stars) + "</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          if (game.url) {
            window.location.href = game.url;
          } else {
            ui.showToast(game.name + " 即将上线，敬请期待！");
          }
        });
      } else {
        var need = 6 * index - save.stars;
        html += '<span class="sp-planet-lock">🔒 再拿 ' + need + " 颗星星解锁</span>";
        card.innerHTML = html;
        card.addEventListener("click", function () {
          ui.showToast("再拿 " + need + " 颗星星解锁 " + game.name + "！");
        });
      }
      map.appendChild(card);
    });
  }

  function checkLimit() {
    if (usage.isOverLimit(save)) {
      if (!document.querySelector(".sp-rest-overlay")) {
        var overlay = document.createElement("div");
        overlay.className = "sp-rest-overlay";
        overlay.innerHTML = '<div class="sp-rest-card"><div class="sp-rest-emoji">☄️</div><h2>该休息啦</h2><p>去喝口水，看看窗外吧！</p><p class="sp-rest-note">今日已达每日限时，家长可在家长区调整。</p></div>';
        document.body.appendChild(overlay);
        var clicks = 0;
        overlay.addEventListener("click", function () {
          clicks += 1;
          if (clicks >= 5) {
            parentArea.openParentArea(onSettingsChanged);
          }
        });
      }
    } else {
      var rest = document.querySelector(".sp-rest-overlay");
      if (rest) rest.remove();
    }
  }

  function onSettingsChanged() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();
    checkLimit();
  }

  function tickSession() {
    save = usage.addUsage(save, 1);
    storage.save(save);
    refreshHeader();
    checkLimit();
  }

  function init() {
    save = storage.load();
    audio.setMuted(save.settings.muted);
    refreshHeader();
    renderMap();

    document.getElementById("muteBtn").addEventListener("click", function () {
      save.settings.muted = !save.settings.muted;
      audio.setMuted(save.settings.muted);
      storage.save(save);
      refreshHeader();
    });

    var logo = document.getElementById("logo");
    var logoClicks = 0;
    var logoTimer = null;
    logo.addEventListener("click", function () {
      logoClicks += 1;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1200);
      if (logoClicks >= 5) {
        logoClicks = 0;
        if (parentArea && parentArea.openParentArea) {
          parentArea.openParentArea(onSettingsChanged);
        } else {
          ui.showToast("家长区即将上线");
        }
      }
    });

    document.addEventListener("pointerdown", function () {
      audio.init();
      audio.startBgm();
    }, { once: true });

    sessionTimer = setInterval(tickSession, 60000);
    checkLimit();
  }

  window.Superpowers = window.Superpowers || {};
  window.Superpowers.portal = { GAMES: GAMES };

  document.addEventListener("DOMContentLoaded", init);
})();
