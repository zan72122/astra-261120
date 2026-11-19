'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path');
const { create, area, N, R, dx } = require('./sim.js');
const dt = 0.05,
  rows = [],
  results = {},
  max = { h: 0, ice: 0, dew: 0, volume: 0, radius: 0, temp: 0 };
const cols = [
  'scenario',
  's',
  'phase',
  'milk_ml',
  'plate_ml',
  'max_h_mm',
  'ice_mass_fraction',
  'mean_dew',
  'fruit_crushed',
  'grain_mm',
  'roll_ml',
  'roll_radius_mm',
  'angle_rad',
  'wet_gain',
  'dry_gain',
  'guide',
  'serve',
  'refill_probe_mm',
  'max_dh_mm',
  'max_dice',
  'max_ddew',
  'max_dT_C',
  'min_ddew',
  'local_spread_dh_mm',
];
let nonuniform = 0,
  intervals = 0;
const index = (x, z) => Math.round((z + R) / dx) * N + Math.round((x + R) / dx);
const fixed = (x) => (typeof x === 'number' ? Number(x.toFixed(7)) : x);
function metrics(g) {
  const s = g.s;
  let volume = 0,
    h = 0,
    ice = 0;
  for (const c of s.cells) {
    volume += c.h * area;
    h = Math.max(h, c.h);
    ice += c.h * c.ice * area;
  }
  return { volume, h, ice: volume > 0 ? ice / volume : 0 };
}
function trace(name, g) {
  let last = g.s.cells.map((c) => [c.h, c.ice, c.dew, c.temp]),
    prev = metrics(g),
    radius = g.s.roll.radius;
  const track = () => {
    const s = g.s,
      v = metrics(g);
    let dh = 0,
      di = 0,
      dd = 0,
      dT = 0,
      loD = Infinity,
      hiD = -Infinity,
      minH = Infinity,
      maxH = -Infinity;
    for (let k = 0; k < s.cells.length; k++) {
      const c = s.cells[k];
      if (!c.active) continue;
      const d = c.h - last[k][0],
        dew = c.dew - last[k][2];
      dh = Math.max(dh, Math.abs(d));
      di = Math.max(di, Math.abs(c.ice - last[k][1]));
      dd = Math.max(dd, Math.abs(dew));
      minH = Math.min(minH, d);
      maxH = Math.max(maxH, d);
      loD = Math.min(loD, dew);
      hiD = Math.max(hiD, dew);
      dT = Math.max(dT, Math.abs(c.temp - last[k][3]));
      assert.ok(
        Number.isFinite(c.h + c.ice + c.temp + c.fruit) &&
          c.h >= 0 &&
          c.ice >= 0 &&
          c.ice <= 1 &&
          c.fruit >= 0,
      );
      last[k][0] = c.h;
      last[k][1] = c.ice;
      last[k][2] = c.dew;
      last[k][3] = c.temp;
    }
    ++intervals;
    if (hiD - loD > 1e-10 || maxH - minH > 1e-10) ++nonuniform;
    max.h = Math.max(max.h, dh);
    max.ice = Math.max(max.ice, di);
    max.dew = Math.max(max.dew, dd);
    max.temp = Math.max(max.temp, dT);
    max.volume = Math.max(max.volume, Math.abs(v.volume - prev.volume));
    // Measure the food while it is on the worktop. Serving transfers ownership.
    if (s.phase === 'curl' || s.phase === 'tip')
      max.radius = Math.max(max.radius, Math.abs(s.roll.radius - radius) * 100);
    const values = [
      name,
      s.time,
      s.phase,
      s.poured,
      v.volume,
      v.h,
      v.ice,
      s.condensation,
      s.fruit.crush,
      s.fruit.grain,
      s.roll.volume,
      s.roll.radius * 100,
      s.roll.angle,
      s.wet,
      s.dry,
      s.guide,
      s.serve,
      s.cells[index(0, 0)].h,
      dh,
      di,
      dd,
      dT,
      loD,
      maxH - minH,
    ];
    rows.push(values.map(fixed).join(','));
    prev = v;
    radius = s.roll.radius;
  };
  return function tick() {
    g.step(dt);
    track();
  };
}
function run(name, g, seconds) {
  const next = trace(name, g);
  for (let i = 0; i < Math.round(seconds / dt); i++) next();
  return metrics(g);
}
{
  const g = create(),
    before = g.s.cells.map((c) => c.dew),
    next = trace('idle', g);
  let cue = 0;
  for (let k = 0; k < 200; k++) {
    next();
    if (!cue && g.s.guide > 0.01) cue = g.s.time;
  }
  const changes = g.s.cells
    .filter((c) => c.active)
    .map((c) => c.dew - before[g.s.cells.indexOf(c)]);
  results.idle = {
    seconds: g.s.time,
    firstGuide_s: cue,
    minDewChange: Math.min(...changes),
    maxDewChange: Math.max(...changes),
    beadLength_mm: g.s.beadStretch * 100,
  };
  assert.equal(g.s.phase, 'ready');
  assert.equal(g.s.poured, 0);
  assert.ok(cue >= 4 && cue < 4.15 && results.idle.maxDewChange > results.idle.minDewChange);
}
function poured(name, options, seconds = 14) {
  const g = create(options);
  g.input('down');
  const measured = run(name, g, seconds);
  assert.ok(Math.abs(measured.volume - g.s.poured) < 1e-5);
  return measured;
}
const little = poured('amount_80', { amount: 80 }),
  large = poured('amount_145', { amount: 145 });
assert.ok(large.h > little.h && large.ice < little.ice);
results.amount = {
  smallMax_mm: little.h,
  largeMax_mm: large.h,
  smallFrozen: little.ice,
  largeFrozen: large.ice,
};
const cold = poured('temperature_4', { temperature: 4 }),
  warm = poured('temperature_23', { temperature: 23 });
assert.ok(cold.ice > warm.ice);
results.temperature = { coldFrozen: cold.ice, warmFrozen: warm.ice };
function press(name, load) {
  const g = create();
  g.input('down');
  run(name + '_pour', g, 8);
  g.input('down', g.s.fruit.x, g.s.fruit.z, load);
  run(name, g, 1.45);
  return { grain_mm: g.s.fruit.grain, crushed: g.s.fruit.crush };
}
results.press = { light: press('light', 0.26), firm: press('firm', 0.86) };
assert.ok(results.press.light.grain_mm > results.press.firm.grain_mm);
function prepared() {
  const g = create();
  g.s.phase = 'spread';
  g.s.poured = 90;
  g.s.fruit.crush = 1;
  return g;
}
function trail(name, ice) {
  const g = prepared();
  for (const c of g.s.cells) {
    if (Math.abs(c.x) < 0.8 && Math.abs(c.z) < 0.78) {
      c.h = Math.abs(c.x) < 0.18 ? 0.15 : 4.5;
      c.ice = ice;
      c.temp = -4;
    }
  }
  run(name, g, 0.6);
  return g.s.cells[index(0, 0)].h;
}
results.refill = { wet_mm: trail('wet_trail', 0.02), frozen_mm: trail('dry_trail', 0.96) };
assert.ok(results.refill.wet_mm > results.refill.frozen_mm + 0.3);
function spreadWidth(name, speed) {
  const g = prepared(),
    t = g.s.tool;
  t.x = t.tx = -1.1;
  t.z = t.tz = 0;
  for (const c of g.s.cells) {
    if (Math.abs(c.z) < 0.12 && Math.abs(c.x) < 1.4) {
      c.h = 3.8;
      c.temp = -4;
      c.ice = 0.25;
    }
  }
  g.input('down', -1.1, 0, 0.56);
  const next = trace(name, g);
  let width = 0;
  for (let j = 0; j < 48; j++) {
    g.input('move', Math.min(1.1, -1.1 + speed * j * dt), 0, 0.56);
    next();
    width = Math.max(width, 2 * (0.26 + 0.59 * t.flat) * 10);
  }
  return width;
}
results.band = { upright_cm: spreadWidth('upright', 0.12), flat_cm: spreadWidth('flat', 1.65) };
assert.ok(results.band.flat_cm > results.band.upright_cm + 2);
function rollBand(name, length, pulpX) {
  const g = prepared(),
    s = g.s;
  s.phase = 'edge';
  s.edge = { x: 0, z: 1.2 };
  s.tool.x = s.tool.tx = 0;
  s.tool.z = s.tool.tz = 1.2;
  for (const c of s.cells) {
    if (Math.abs(c.x) < 1.22 && c.z < 1.24 && c.z > -0.98) {
      c.ice = 0.94;
      c.temp = -12;
      c.h = c.z > 1.2 - length ? 0.95 : 0;
      if (Math.abs(c.x - pulpX) < 0.19 && c.h > 0.1) c.fruit = 0.27;
    }
  }
  s.poured = metrics(g).volume;
  g.input('down', 0, 1.2);
  g.input('move', 0, -2.49);
  const next = trace(name, g);
  for (let k = 0; k < 90 && s.phase === 'curl'; k++) next();
  const v = metrics(g);
  assert.ok(Math.abs(v.volume + s.roll.volume - s.poured) < 1e-5);
  const peeled = s.cells.filter((c) => c.peel > 0.999);
  assert.ok(peeled.length > 0);
  const cleared = peeled.filter((c) => c.h < 0.055).length / peeled.length;
  assert.ok(cleared > 0.96);
  return {
    cleared,
    radius_mm: s.roll.radius * 100,
    turns: s.roll.angle / (2 * Math.PI),
    pulp: s.roll.sections.reduce((n, c) => n + c.pulp, 0),
    retained: s.roll.sections.flatMap((c) => c.grains).length,
  };
}
results.roll = {
  short: rollBand('short_band', 0.66, 0),
  long: rollBand('long_band', 2.1, 0),
  beside: rollBand('beside_pulp', 2.1, 1.07),
};
assert.ok(
  results.roll.short.turns < results.roll.long.turns &&
    results.roll.short.radius_mm < results.roll.long.radius_mm,
);
assert.ok(results.roll.long.retained > 0 && results.roll.beside.retained === 0);
{
  const g = create(),
    s = g.s,
    next = trace('recipe', g),
    visits = [],
    startMilk = s.amount;
  let wet = 0,
    dry = 0,
    peakRadius = 0,
    pulp = 0,
    cycle = false,
    peakLift = 0,
    dropTime = 0,
    streamTime = 0;
  function observe() {
    if (!dropTime && s.drop >= 0.998) dropTime = s.time;
    if (!streamTime && s.flow >= 1) streamTime = s.time;
    if (visits.at(-1) !== s.phase) visits.push(s.phase);
    wet = Math.max(wet, s.wet);
    dry = Math.max(dry, s.dry);
    peakRadius = Math.max(peakRadius, s.roll.radius * 100);
    peakLift = Math.max(peakLift, s.serve * 9.8);
    pulp = Math.max(pulp, s.roll.sections.length);
  }
  observe();
  g.input('down');
  for (let k = 0; k < 1900; k++) {
    observe();
    if (s.phase === 'spread') {
      if (!s.pressed) g.input('down', s.fruit.x, s.fruit.z, 0.58);
      if (s.fruit.crush > 0.88)
        g.input('move', -0.24 + 1.2 * Math.sin(s.age * 1.78), 0.91 * Math.cos(s.age * 1.6), 0.58);
    } else if (s.phase === 'edge') g.input('down', s.edge.x, s.edge.z, 0.5);
    else if (s.phase === 'curl') g.input('move', -0.17, -2.48, 0.5);
    else if (s.phase === 'tip') g.input('down', s.roll.x, s.roll.z);
    if (['curl', 'tip', 'offer'].includes(s.phase))
      assert.ok(Math.abs(metrics(g).volume + s.roll.volume - startMilk) < 1e-5);
    next();
    if (s.batches) {
      observe();
      cycle = true;
      break;
    }
  }
  assert.ok(cycle);
  assert.deepEqual(visits, [
    'ready',
    'pour',
    'spread',
    'edge',
    'curl',
    'tip',
    'offer',
    'clean',
    'ready',
  ]);
  assert.equal(metrics(g).volume, 0);
  assert.equal(s.fruit.crush, 0);
  assert.ok(wet > 0 && dry > 0 && pulp > 0);
  results.recipe = {
    seconds: s.time,
    dropTime_s: dropTime,
    streamTime_s: streamTime,
    wet,
    dry,
    peakRadius_mm: peakRadius,
    lift_cm: peakLift,
    visits,
  };
  g.input('down');
  run('next_batch', g, 2.0);
  assert.ok(s.poured > 0 && s.batches === 1);
}
// A child can inspect a fully frozen sheet for several minutes and still finish it.
{
  const g = create();
  g.input('down');
  run('linger_pour', g, 8);
  const s = g.s;
  const next = trace('linger_press', g);
  g.input('down', s.fruit.x, s.fruit.z, 0.7);
  for (let i = 0; i < 220 && s.phase === 'spread'; i++) {
    if (s.fruit.crush > 0.9) g.input('move', Math.sin(i * 0.18), Math.cos(i * 0.15) * 0.6, 0.7);
    next();
  }
  assert.equal(s.phase, 'edge');
  g.input('up');
  run('linger_frozen', g, 180);
  assert.equal(s.phase, 'edge');
  g.input('down', s.edge.x, s.edge.z);
  g.input('move', s.edge.x, -2.48);
  run('linger_roll', g, 5);
  assert.equal(s.phase, 'tip');
  results.unhurried = { held_s: 180, roll_ml: s.roll.volume };
}
function contactSound(label, frozen) {
  const g = prepared(),
    tool = g.s.tool;
  tool.x = tool.tx = tool.z = tool.tz = 0;
  for (const c of g.s.cells) {
    if (Math.hypot(c.x, c.z) < 0.8) {
      c.h = 2;
      c.temp = -7;
      c.ice = frozen;
    }
  }
  g.input('down', 0, 0, 0.49);
  run(label, g, 0.45);
  return { wetGain: g.s.wet * 0.25, dryGain: g.s.dry * 0.2 };
}
results.sound = {
  wet: contactSound('sound_milk', 0.04),
  frozen: contactSound('sound_sheet', 0.94),
};
assert.ok(
  results.sound.wet.wetGain > results.sound.frozen.wetGain &&
    results.sound.frozen.dryGain > results.sound.wet.dryGain,
);
function showCup(label, gaze) {
  const g = create();
  g.s.phase = 'offer';
  g.input('look', gaze, 0);
  run(label, g, 3);
  return (g.s.wrist * 180) / Math.PI;
}
results.wrist = { left_deg: showCup('look_left', -1), right_deg: showCup('look_right', 1) };
assert.ok(results.wrist.right_deg - results.wrist.left_deg > 32);
assert.equal(nonuniform, intervals);
assert.ok(
  max.h < 2.2 && max.ice < 0.18 && max.temp < 6 && max.radius < 4.0,
  'excessive adjacent material displacement',
);
results.adjacent = { ...max, seconds: dt, intervals, nonuniform };
fs.writeFileSync(
  path.join(__dirname, 'state-trace.csv'),
  [cols.join(','), ...rows].join('\n') + '\n',
);
console.log(JSON.stringify(results, (_, v) => (typeof v === 'number' ? fixed(v) : v), 2));
