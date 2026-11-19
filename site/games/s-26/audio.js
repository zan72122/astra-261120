'use strict';
function kitchenSound() {
  let ctx,
    bus,
    noise,
    wetFilter,
    wetGain,
    dryFilter,
    dryGain,
    stream,
    streamGain,
    muted = false,
    lastPress = -5,
    lastPhase = 'ready',
    lastGrain = 0;
  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      bus = ctx.createGain();
      bus.gain.value = muted ? 0 : 0.54;
      bus.connect(ctx.destination);
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate),
        data = buffer.getChannelData(0);
      let prev = 0;
      for (let i = 0; i < data.length; i++) {
        const n = Math.random() * 2 - 1;
        data[i] = 0.78 * n + 0.22 * prev;
        prev = n;
      }
      noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      noise.start();
      function band(type, f, q) {
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = f;
        filter.Q.value = q;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        noise.connect(filter).connect(gain).connect(bus);
        return [filter, gain];
      }
      [wetFilter, wetGain] = band('lowpass', 510, 0.9);
      [dryFilter, dryGain] = band('bandpass', 3400, 0.88);
      [stream, streamGain] = band('bandpass', 1300, 0.42);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  function note(start, f, end, duration, gain, type = 'sine') {
    const o = ctx.createOscillator(),
      v = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, start);
    o.frequency.exponentialRampToValueAtTime(end, start + duration);
    v.gain.setValueAtTime(0.0001, start);
    v.gain.exponentialRampToValueAtTime(gain, start + 0.007);
    v.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.connect(v).connect(bus);
    o.start(start);
    o.stop(start + duration + 0.012);
  }
  function tap(s) {
    if (!ctx) return;
    const n = ctx.currentTime;
    if (s.phase === 'spread' || s.phase === 'edge') {
      const i = s.cells.reduce((a, c) =>
        Math.hypot(c.x - s.tool.x, c.z - s.tool.z) < Math.hypot(a.x - s.tool.x, a.z - s.tool.z)
          ? c
          : a,
      );
      note(n, 300 + 100 * i.ice, 70 + 500 * i.ice, 0.12, 0.09 * (1 - i.ice) + 0.014);
      lastPress = n;
    } else if (s.phase === 'ready') note(n, 880, 460, 0.14, 0.038);
    else if (s.phase === 'tip') note(n, 520, 335, 0.12, 0.052);
  }
  function update(s) {
    if (!ctx || ctx.state === 'suspended') return;
    const t = ctx.currentTime;
    wetGain.gain.setTargetAtTime(s.wet * 0.25, t, 0.032);
    wetFilter.frequency.setTargetAtTime(330 + 440 * s.wet, t, 0.045);
    dryGain.gain.setTargetAtTime(s.dry * 0.2, t, 0.035);
    dryFilter.frequency.setTargetAtTime(1650 + 2300 * s.dry + 300 * s.tool.flat, t, 0.04);
    streamGain.gain.setTargetAtTime(s.flow * 0.0039, t, 0.08);
    stream.frequency.setTargetAtTime(1250 + 250 * s.tilt + 540 * s.air, t, 0.07);
    if (s.wet > 0.12 && s.pressed && t - lastPress > 0.32 + 0.7 * (1 - s.wet)) {
      note(t, 230 + s.wet * 170, 72, 0.095, 0.055 * s.wet);
      lastPress = t;
    }
    if (s.dry > 0.05 && t > lastGrain) {
      note(
        t,
        1100 + Math.random() * 2600,
        800 + Math.random() * 400,
        0.022,
        0.016 * s.dry,
        'triangle',
      );
      lastGrain = t + 0.025 + Math.random() * 0.055;
    }
    if (lastPhase === 'tip' && s.phase === 'offer') {
      note(t, 604, 542, 0.22, 0.052);
      note(t + 0.12, 818, 776, 0.23, 0.031);
    }
    if (lastPhase === 'clean' && s.phase === 'ready') note(t, 250, 105, 0.12, 0.059);
    lastPhase = s.phase;
  }
  return {
    init,
    tap,
    update,
    mute(v) {
      muted = v;
      if (ctx) bus.gain.setTargetAtTime(v ? 0 : 0.54, ctx.currentTime, 0.035);
    },
  };
}
