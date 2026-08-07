(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.parentArea = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isValidPin(input, storedPin) {
    return typeof input === "string" && /^\d{4}$/.test(input) && input === storedPin;
  }

  function isDefaultPin(pin) {
    return pin === "0000";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function openParentArea(onChanged) {
    var storage = window.Superpowers.storage;
    var save = storage.load();
    var view = overlay();

    if (isDefaultPin(save.settings.pin)) {
      showSetPin(view, function (newPin) {
        save.settings.pin = newPin;
        storage.save(save);
        showPinPrompt(view, function () { showDashboard(view, onChanged); });
      });
      return;
    }

    showPinPrompt(view, function () { showDashboard(view, onChanged); });
  }

  function overlay() {
    var o = el("div", "sp-parent-overlay");
    var card = el("div", "sp-parent-card");
    var close = el("button", "sp-btn sp-btn-close", "✕");
    close.addEventListener("click", function () { o.remove(); });
    card.appendChild(close);
    o.appendChild(card);
    document.body.appendChild(o);
    return { overlay: o, card: card };
  }

  function showSetPin(view, onSet) {
    view.card.appendChild(el("h2", "sp-parent-title", "首次进入：设置家长 PIN"));
    var input = el("input", "sp-pin-input");
    input.type = "password";
    input.maxLength = 4;
    input.placeholder = "4 位数字";
    var input2 = el("input", "sp-pin-input");
    input2.type = "password";
    input2.maxLength = 4;
    input2.placeholder = "再次输入";
    var hint = el("p", "sp-hint", "");
    var ok = el("button", "sp-btn sp-btn-primary", "保存 PIN");
    ok.addEventListener("click", function () {
      if (!/^\d{4}$/.test(input.value)) { hint.textContent = "请输入 4 位数字"; return; }
      if (input.value !== input2.value) { hint.textContent = "两次输入不一致"; return; }
      if (input.value === "0000") { hint.textContent = "不能使用默认 PIN"; return; }
      onSet(input.value);
    });
    view.card.appendChild(input);
    view.card.appendChild(input2);
    view.card.appendChild(hint);
    view.card.appendChild(ok);
  }

  function showPinPrompt(view, onSuccess) {
    view.card.appendChild(el("h2", "sp-parent-title", "家长验证"));
    var input = el("input", "sp-pin-input");
    input.type = "password";
    input.maxLength = 4;
    input.placeholder = "输入 4 位 PIN";
    var hint = el("p", "sp-hint", "");
    var attempts = 0;
    var ok = el("button", "sp-btn sp-btn-primary", "进入");
    ok.addEventListener("click", function () {
      var save = window.Superpowers.storage.load();
      if (window.Superpowers.parentArea.isValidPin(input.value, save.settings.pin)) {
        onSuccess();
      } else {
        attempts += 1;
        hint.textContent = "PIN 错误（" + attempts + "/3）";
        if (attempts >= 3) {
          view.overlay.remove();
          window.Superpowers.ui.showToast("验证失败，已退出家长区");
        }
      }
    });
    view.card.appendChild(input);
    view.card.appendChild(hint);
    view.card.appendChild(ok);
  }

  function showDashboard(view, onChanged) {
    view.card.appendChild(el("h2", "sp-parent-title", "家长区"));
    var tabs = el("div", "sp-tabs");
    var tabProgress = el("button", "sp-tab", "进度");
    var tabUsage = el("button", "sp-tab", "时长");
    var tabSettings = el("button", "sp-tab", "设置");
    tabs.appendChild(tabProgress);
    tabs.appendChild(tabUsage);
    tabs.appendChild(tabSettings);
    view.card.appendChild(tabs);
    var content = el("div", "sp-tab-content");
    view.card.appendChild(content);
    tabProgress.addEventListener("click", function () { renderProgress(content); });
    tabUsage.addEventListener("click", function () { renderUsage(content); });
    tabSettings.addEventListener("click", function () { renderSettings(content, onChanged); });
    renderProgress(content);
  }

  function renderProgress(content) {
    content.innerHTML = "";
    var save = window.Superpowers.storage.load();
    var games = (window.Superpowers.portal && window.Superpowers.portal.GAMES) || [];
    if (!games.length) {
      content.appendChild(el("p", "", "暂无游戏数据"));
      return;
    }
    games.forEach(function (game) {
      var g = save.games[game.id] || {};
      var stars = window.Superpowers.scoring.gameStars(g);
      var row = el("div", "sp-progress-row");
      row.appendChild(el("span", "", game.name));
      row.appendChild(el("span", "", "★ " + stars + " | 最高分 " + (g.bestScore || 0) + " | 玩过 " + (g.plays || 0) + " 次"));
      content.appendChild(row);
    });
  }

  function renderUsage(content) {
    content.innerHTML = "";
    var save = window.Superpowers.storage.load();
    var rows = window.Superpowers.usage.lastDaysUsage(save, 7);
    rows.forEach(function (row) {
      var line = el("div", "sp-usage-row");
      line.appendChild(el("span", "", row.day));
      line.appendChild(el("span", "", row.minutes + " 分钟"));
      content.appendChild(line);
    });
    var total = rows.reduce(function (sum, r) { return sum + r.minutes; }, 0);
    content.appendChild(el("p", "sp-usage-total", "近 7 天合计：" + total + " 分钟"));
  }

  function renderSettings(content, onChanged) {
    content.innerHTML = "";
    var storage = window.Superpowers.storage;
    var save = storage.load();

    var muteLabel = el("label", "sp-setting-row");
    var muteCheck = el("input", "");
    muteCheck.type = "checkbox";
    muteCheck.checked = save.settings.muted;
    muteLabel.appendChild(muteCheck);
    muteLabel.appendChild(el("span", "", "静音"));

    var limitLabel = el("label", "sp-setting-row");
    limitLabel.appendChild(el("span", "", "每日限时（分钟，0=不限）"));
    var limitInput = el("input", "sp-limit-input");
    limitInput.type = "number";
    limitInput.min = "0";
    limitInput.value = String(save.settings.dailyLimitMinutes);
    limitLabel.appendChild(limitInput);

    var saveBtn = el("button", "sp-btn sp-btn-primary", "保存设置");
    saveBtn.addEventListener("click", function () {
      save.settings.muted = muteCheck.checked;
      save.settings.dailyLimitMinutes = Math.max(0, Math.floor(Number(limitInput.value) || 0));
      storage.save(save);
      window.Superpowers.audio.setMuted(save.settings.muted);
      window.Superpowers.ui.showToast("设置已保存");
      if (onChanged) onChanged();
    });

    var resetBtn = el("button", "sp-btn sp-btn-danger", "重置存档");
    resetBtn.addEventListener("click", function () {
      window.Superpowers.ui.openModal({
        title: "确认重置？",
        body: "将清除所有星星、积分与设置。",
        buttons: [
          { id: "cancel", label: "取消", kind: "ghost" },
          { id: "confirm", label: "确认重置", kind: "danger" }
        ],
        onChoose: function (id) {
          if (id === "confirm") {
            storage.reset();
            window.Superpowers.ui.showToast("存档已重置");
            if (onChanged) onChanged();
          }
        }
      });
    });

    content.appendChild(muteLabel);
    content.appendChild(limitLabel);
    content.appendChild(saveBtn);
    content.appendChild(resetBtn);
  }

  return {
    isValidPin: isValidPin,
    isDefaultPin: isDefaultPin,
    openParentArea: openParentArea
  };
});
