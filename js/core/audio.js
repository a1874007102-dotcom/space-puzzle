(function () {
  "use strict";

  var ctx = null;
  var muted = false;
  var bgmTimer = null;
  var bgmNotes = [261.63, 293.66, 329.63, 392.00, 329.63, 293.66];
  var bgmIndex = 0;

  var SFX = {
    click: [880],
    flip: [660],
    correct: [523.25, 659.25, 783.99],
    wrong: [220, 174.61],
    win: [523.25, 659.25, 783.99, 1046.5]
  };

  function init() {
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(freq, start, duration, type, gainValue) {
    if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration + 0.05);
  }

  function play(name) {
    if (muted) return;
    if (!init()) return;
    var notes = SFX[name] || SFX.click;
    notes.forEach(function (freq, i) {
      tone(freq, i * 0.09, 0.18, name === "wrong" ? "triangle" : "sine");
    });
  }

  function setMuted(value) {
    muted = !!value;
    if (muted) stopBgm();
  }

  function isMuted() {
    return muted;
  }

  function startBgm() {
    if (muted || bgmTimer) return;
    if (!init()) return;
    bgmTimer = setInterval(function () {
      if (muted) return;
      tone(bgmNotes[bgmIndex % bgmNotes.length], 0, 0.9, "triangle", 0.04);
      bgmIndex += 1;
    }, 480);
  }

  function stopBgm() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  window.Superpowers = window.Superpowers || {};
  window.Superpowers.audio = {
    init: init,
    play: play,
    setMuted: setMuted,
    isMuted: isMuted,
    startBgm: startBgm,
    stopBgm: stopBgm
  };
})();
