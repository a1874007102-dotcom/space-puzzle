(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Superpowers = root.Superpowers || {};
    root.Superpowers.ui = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function formatTime(ms) {
    var totalSeconds = Math.max(0, Math.round(ms / 1000));
    var minutes = Math.floor(totalSeconds / 60);
    var seconds = totalSeconds % 60;
    return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showToast(message) {
    var existing = document.querySelector(".sp-toast");
    if (existing) existing.remove();
    var toast = el("div", "sp-toast", message);
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 1800);
  }

  function openModal(options) {
    var opts = options || {};
    var overlay = el("div", "sp-modal-overlay");
    var box = el("div", "sp-modal");
    box.appendChild(el("h2", "sp-modal-title", opts.title || ""));
    var body = el("div", "sp-modal-body");
    if (typeof opts.body === "string") {
      body.innerHTML = opts.body;
    } else if (opts.body) {
      body.appendChild(opts.body);
    }
    box.appendChild(body);
    var buttons = opts.buttons || [{ id: "ok", label: "确定" }];
    var buttonRow = el("div", "sp-modal-buttons");
    buttons.forEach(function (btn) {
      var button = el("button", "sp-btn sp-btn-" + (btn.kind || "primary"), btn.label);
      button.addEventListener("click", function () {
        overlay.remove();
        if (opts.onChoose) opts.onChoose(btn.id);
      });
      buttonRow.appendChild(button);
    });
    box.appendChild(buttonRow);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function showResult(options) {
    var opts = options || {};
    var stars = "";
    for (var i = 0; i < 3; i++) {
      stars += i < (opts.stars || 0) ? "★" : "☆";
    }
    var overlay = el("div", "sp-result-overlay");
    var box = el("div", "sp-result");
    box.appendChild(el("div", "sp-result-stars", stars));
    if (opts.points !== undefined) {
      box.appendChild(el("p", "sp-result-points", "获得 " + opts.points + " 积分"));
    }
    box.appendChild(el("p", "sp-result-message", opts.message || "太棒了！"));
    var replay = el("button", "sp-btn sp-btn-primary", "再玩一次");
    replay.addEventListener("click", function () {
      overlay.remove();
      if (opts.onReplay) opts.onReplay();
    });
    var home = el("button", "sp-btn", "返回地图");
    home.addEventListener("click", function () {
      overlay.remove();
      if (opts.onHome) opts.onHome();
    });
    box.appendChild(replay);
    box.appendChild(home);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function startCountdown(seconds, onTick, onDone) {
    var remaining = Math.max(0, Math.floor(seconds));
    if (onTick) onTick(remaining);
    var timer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        if (onDone) onDone();
      } else if (onTick) {
        onTick(remaining);
      }
    }, 1000);
    return function () { clearInterval(timer); };
  }

  return {
    formatTime: formatTime,
    showToast: showToast,
    openModal: openModal,
    showResult: showResult,
    startCountdown: startCountdown
  };
});
