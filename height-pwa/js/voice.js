// voice.js — Speech coaching + simple synthesized beeps (no external audio files needed).
const Voice = (() => {
  let settings = {
    voiceEnabled: true,
    countdown: true,
    formCues: true,
    restAnnouncements: true,
    soundEffects: true,
    vibration: true,
    rate: 1.0, // 0.85 slower, 1.0 normal, 1.15 faster
    voiceURI: null,
  };
  let audioCtx = null;

  function updateSettings(s) { settings = Object.assign(settings, s); }

  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  function beep(freq = 880, durationMs = 120, volume = 0.15) {
    if (!settings.soundEffects) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) { /* ignore audio errors */ }
  }

  function beepStart() { beep(660, 100); setTimeout(() => beep(880, 140), 130); }
  function beepComplete() { beep(523, 90); setTimeout(() => beep(659, 90), 100); setTimeout(() => beep(784, 160), 200); }
  function beepWorkoutComplete() { beep(523, 120); setTimeout(() => beep(659, 120), 140); setTimeout(() => beep(784, 120), 280); setTimeout(() => beep(1046, 220), 420); }
  function beepTick() { beep(440, 60, 0.08); }

  function vibrate(pattern) {
    if (!settings.vibration) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    if (settings.voiceURI) {
      const found = voices.find(v => v.voiceURI === settings.voiceURI);
      if (found) return found;
    }
    return voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0];
  }

  function speak(text, opts = {}) {
    if (!settings.voiceEnabled) return;
    if (opts.isFormCue && !settings.formCues) return;
    if (opts.isRest && !settings.restAnnouncements) return;
    if (opts.isCountdown && !settings.countdown) return;
    if (!('speechSynthesis' in window)) return;
    try {
      if (opts.interrupt) window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = settings.rate;
      const v = pickVoice();
      if (v) utter.voice = v;
      window.speechSynthesis.speak(utter);
    } catch (e) { /* speech not available */ }
  }

  function cancelAll() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function listVoices() {
    if (!('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices().filter(v => v.lang && v.lang.startsWith('en'));
  }

  return { updateSettings, speak, cancelAll, beepStart, beepComplete, beepWorkoutComplete, beepTick, vibrate, listVoices, getSettings: () => settings };
})();

window.Voice = Voice;
