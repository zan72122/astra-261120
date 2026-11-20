"use strict";
const canvas = renderer.domElement,
  shop = document.querySelector("#shop"),
  soundButton = document.querySelector("#sound");
let stage = "ladle",
  drag = null,
  lastTouch = performance.now(),
  elapsed = 0,
  last = performance.now(),
  audioCtx = null,
  muted = false,
  aspect = 1,
  portrait = false;
let ladleRest = v(),
  ladleGoal = v(),
  spatGoal = spatHome.clone(),
  bagGoal = bagHome.clone(),
  tilt = v(),
  applied = v(),
  targetLook = v(),
  actualLook = v(),
  desiredEye = v(),
  fovGoal = 47;
let pourReady = false,
  idealFlip = 0;
let flippingSide = 1,
  toolDepth = 0,
  foldIndex = 0,
  wrapProgress = 0,
  wrapChoice = 0,
  sashOpen = 0,
  carry = 0,
  transferLift = 0,
  travelHome = 0,
  settle = null,
  stageAge = 0;
const finished = [],
  ray = new T.Raycaster(),
  ndc = new T.Vector2(),
  plane = new T.Plane(v(0, 1, 0), 0);
function resize() {
  let w = innerWidth,
    h = innerHeight;
  cam.aspect = aspect = w / h;
  portrait = aspect < 0.78;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.setSize(w, h, false);
  layout();
  cameraPose();
  cam.fov = fovGoal;
  cam.position.copy(desiredEye);
  actualLook.copy(targetLook);
  cam.lookAt(actualLook);
  cam.updateProjectionMatrix();
}
function layout() {
  if (stage !== "ladle" || drag) return;
  const short = portrait;
  pan.position.set(short ? -1 : -3, 10.94, short ? 15 : 10);
  stove.position.set(pan.position.x + 1, 0, pan.position.z);
  bowlPos.set(short ? -19 : -29, 0.18, short ? -9 : 9);
  mixBowl.position.copy(bowlPos);
  platePos.set(short ? 13.9 : 29, 0.18, short ? -16 : 7.35);
  servePlate.position.copy(platePos);
  berrySource.set(short ? -13 : 12, 0, short ? -30 : -18.5);
  bananaSource.set(short ? 5 : 30, 0, short ? -35 : -22);
  fruitBowls[0].position.copy(berrySource);
  fruitBowls[1].position.copy(bananaSource);
  bagHome.set(short ? 23 : 40, 3.1, short ? -36 : -10.5);
  bagGoal.copy(bagHome);
  bag.position.copy(bagHome);
  spatHome.set(short ? -10 : 15, 0.48, short ? 33 : 28.4);
  spatGoal.copy(spatHome);
  spatula.position.copy(spatHome);
  spatula.rotation.y = 1.26;
  for (let i = 0; i < 2; i++)
    paperChoices[i].position.set(
      short ? -28 - i * 3 : 48 + i * 4,
      0.37 + i * 0.32,
      short ? -27 - i * 5 : 1 + i * 5
    );
  menuHome.position.set(short ? -35 : 52, 0, short ? -35 : -24);
  trayHome.set(short ? 36 : 66, 1, -37);
  tray.position.copy(trayHome);
  chef.root.position.set(short ? -32 : -53, -86, short ? -87 : -76);
  girl.root.position.set(short ? 25 : 43, -84, short ? -63 : -54);
  chef.root.rotation.y = 0.81;
  ladleRest.set(bowlPos.x + 1.5, 5.63, bowlPos.z - 0.6);
  ladleGoal.copy(ladleRest);
  ladle.position.copy(ladleRest);
}
function change(s) {
  stage = s;
  stageAge = 0;
  lastTouch = performance.now();
  shop.classList.toggle("close", !["ladle", "happy"].includes(s));
}
function cameraPose() {
  const short = portrait,
    wide = aspect > 1.75;
  let eye, look, f;
  if (stage === "ladle" || stage === "pour" || stage === "return") {
    eye = short ? [7, 66, 111] : [8, 48, 92];
    look = short ? [0, 3, -21] : [1, 14, -38];
    f = short ? 56 : wide ? 40 : 46;
  } else if (["spread", "flip", "landFlip"].includes(stage)) {
    eye = short ? [2, 65, 70] : [4, 50, 62];
    look = [pan.position.x, 10.6, pan.position.z + 1];
    f = short ? 65 : 43;
  } else if (stage === "transfer") {
    eye = short ? [5, 71, 78] : [8, 61, 79];
    look = short ? [0, 4, -3] : [9, 5, 1];
    f = short ? 62 : 44;
  } else if (["dress", "fold", "paper"].includes(stage)) {
    eye = short ? [platePos.x + 3, 65, 44] : [31, 45, 48];
    look = short ? [2, 1, -17] : [25.5, 2, -3.4];
    f = short ? 68 : 45;
  } else if (["window", "tray"].includes(stage)) {
    eye = short ? [37, 48, 73] : [58, 40, 66];
    look = short ? [19, 1, -40] : [42, 2, -35];
    f = short ? 62 : 48;
  } else {
    let t = carry;
    eye = [mix(short ? 37 : 58, short ? 69 : 90, t), mix(43, 26, t), mix(66, -68, t)];
    look = [mix(41, 49, t), mix(3, -11, t), mix(-40, -178, t)];
    f = short ? 63 : 50;
  }
  desiredEye.set(...eye);
  targetLook.set(...look);
  fovGoal = f;
  if (stage === "happy") {
    const pull = clamp((stageAge - 3.2) / 3.4, 0, 1),
      s = pull * pull * (3 - 2 * pull);
    desiredEye.lerp(v(short ? 35 : 58, short ? 75 : 67, short ? 113 : 106), s);
    targetLook.lerp(v(10, 0, -37), s);
    fovGoal = mix(f, short ? 65 : 51, s);
  }
}
function smoothPos(o, t, dt, rate = 14) {
  o.position.lerp(t, 1 - Math.exp(-dt * rate));
}
function obstruction(x, z) {
  if (Math.hypot(x - pan.position.x, z - pan.position.z) < 15.5) return pan.position.y + 2.35;
  if (Math.abs(x - stove.position.x) < 20 && Math.abs(z - stove.position.z) < 14) return 8.1;
  if (Math.hypot(x - bowlPos.x, z - bowlPos.z) < 11) return 8.75;
  if (fruitBowls.some((b) => Math.hypot(x - b.position.x, z - b.position.z) < 8.3)) return 8.4;
  if (Math.abs(x - menuHome.position.x) < 8.6 && Math.abs(z - menuHome.position.z) < 3.5) return 21.2;
  return Math.hypot(x - platePos.x, z - platePos.z) < 13.8 ? 2.1 : 0.1;
}
function posOf(obj, x = 0, y = 0, z = 0) {
  return obj.localToWorld(v(x, y, z));
}
function pointAt(x, y, h) {
  ndc.set((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2);
  ray.setFromCamera(ndc, cam);
  plane.constant = -h;
  return ray.ray.intersectPlane(plane, v()) || v(0, h, 0);
}
function screen(p) {
  const n = p.clone().project(cam);
  return { x: (n.x + 1) * innerWidth * 0.5, y: (1 - n.y) * innerHeight * 0.5 };
}
function nearby(e, p, cm, padding = 14) {
  const a = screen(p),
    b = screen(p.clone().add(v(cm, 0, 0)));
  return (
    Math.hypot(e.clientX - a.x, e.clientY - a.y) <
    Math.max(padding, Math.hypot(b.x - a.x, b.y - a.y) + padding)
  );
}
function initAudio() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {}
  }
  if (audioCtx?.state === "suspended") audioCtx.resume().catch(() => {});
}
function chime(freq, length = 0.12, volume = 0.042, type = "sine") {
  if (!audioCtx || muted) return;
  const o = audioCtx.createOscillator(),
    g = audioCtx.createGain(),
    t = audioCtx.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.82, t + length);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volume, t + 0.007);
  g.gain.exponentialRampToValueAtTime(0.0001, t + length);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + length + 0.02);
}
let noiseBuffer = null;
function rustle(duration, level, cutoff) {
  if (!audioCtx || muted) return;
  const ctx = audioCtx,
    t = ctx.currentTime;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    let d = noiseBuffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  let src = ctx.createBufferSource(),
    filter = ctx.createBiquadFilter(),
    gain = ctx.createGain();
  src.buffer = noiseBuffer;
  src.loop = true;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(level, t + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
  src.stop(t + duration + 0.03);
}
soundButton.addEventListener("click", () => {
  initAudio();
  muted = !muted;
  soundButton.classList.toggle("muted", muted);
  soundButton.setAttribute("aria-pressed", String(muted));
  soundButton.setAttribute("aria-label", muted ? "音を出す" : "音を消す");
  if (!muted) chime(640);
});
function edgeAt(e) {
  if (dough.folds[foldIndex] > 0.04 && nearby(e, posOf(dough.food, 0, 2, 0), 8)) return true;
  const p = pointAt(e.clientX, e.clientY, dough.food.position.y + 1).sub(dough.food.position);
  const r = diskLimit(p.x, p.z);
  if (foldIndex === 0) return p.x < -r * 0.32 && Math.hypot(p.x, p.z) < r + 5;
  if (foldIndex === 1) return p.x > r * 0.27 && Math.hypot(p.x, p.z) < r + 5;
  return p.z > r * 0.22 && Math.abs(p.x) < r * 0.8;
}
function readyFlip() {
  return dough.tiltWork > 0.22 && dough.nodes[(rings - 1) * spokes].heat > 0.32;
}
function startDrag(e, kind) {
  drag = {
    id: e.pointerId,
    kind,
    x: e.clientX,
    y: e.clientY,
    lastX: e.clientX,
    lastY: e.clientY,
    startX: e.clientX,
    startY: e.clientY,
    dist: 0,
    held: 0,
    release: false
  };
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  lastTouch = performance.now();
  return drag;
}
function begin(e) {
  if (drag || e.button > 0) return;
  initAudio();
  lastTouch = performance.now();
  if (settle) return;
  const near = (p, r, pad) => nearby(e, p, r, pad);
  if (
    stage === "ladle" &&
    (near(posOf(ladle), 8) || near(posOf(ladle, -6, 10, -2), 7) || near(posOf(ladle, -10, 17, -3), 5))
  ) {
    startDrag(e, "ladle");
    chime(345, 0.14, 0.018);
  } else if (stage === "spread") {
    if (
      readyFlip() &&
      (near(posOf(spatula, 0, 1.3, 10), 7) ||
        near(posOf(spatula, 0, 0, -3), 6) ||
        (near(posOf(pan), 14) && !near(posOf(pan), 7) && !near(posOf(handle, 0, 2, 21), 5)))
    ) {
      change("flip");
      idealFlip = dough.turned;
      startDrag(e, "flip");
      flippingSide = pointAt(e.clientX, e.clientY, 12).x < pan.position.x ? -1 : 1;
      toolDepth = 0;
      chime(480, 0.09, 0.017);
    } else if (
      near(posOf(pan, 0, 1, 0), 14) ||
      near(posOf(handle, 0, 2, 22), 8) ||
      near(posOf(handle, 0, 2, 27), 5)
    ) {
      startDrag(e, "tilt");
    }
  } else if (stage === "flip" && (near(posOf(pan), 16) || near(posOf(spatula), 8))) {
    startDrag(e, "flip");
  } else if (stage === "transfer" && (near(posOf(pan), 15) || near(posOf(spatula, 0, 1, 8), 14))) {
    startDrag(e, "transfer");
    toolDepth = 0;
  } else if (stage === "dress" || stage === "fold") {
    if (
      stage === "dress" &&
      (near(posOf(fruitBowls[0], 0, 5, 0), 8) || near(posOf(fruitBowls[1], 0, 5, 0), 7))
    ) {
      const i = near(posOf(fruitBowls[0], 0, 5, 0), 8) ? 0 : 1,
        kind = i ? "banana" : "berry",
        d = startDrag(e, "fruit");
      d.item = takeFruit(i);
      d.item.userData.kind = kind;
      d.from = d.item.position.clone();
      d.goal = d.from.clone();
      chime(i ? 420 : 510, 0.095, 0.018);
    } else if (stage === "dress" && (near(posOf(bag, 0, 2, 0), 6) || near(posOf(bag, 0, 8, 0), 5))) {
      const d = startDrag(e, "cream");
      d.trail = [];
      d.creamMesh = null;
      d.beadTime = 0;
    } else if (dough.cream.length && edgeAt(e)) {
      change("fold");
      const d = startDrag(e, "fold");
      d.prev = pointAt(e.clientX, e.clientY, dough.food.position.y);
      rustle(0.17, 0.016, 1600);
    }
  } else if (stage === "paper") {
    const a = paperChoices.findIndex((g) => near(posOf(g), 9));
    if (a >= 0 || (wrapProgress > 0 && near(posOf(dough.food), 11))) {
      const d = startDrag(e, "paper");
      if (wrapProgress === 0) wrapChoice = a < 0 ? 0 : a;
      d.prev = pointAt(e.clientX, e.clientY, 2);
      d.origin = paperChoices[wrapChoice].position.clone();
    }
  } else if (stage === "window") {
    if (near(posOf(latch), 10) || e.clientY < innerHeight * 0.73) {
      startDrag(e, "window");
    }
  } else if (stage === "tray" && near(posOf(dough.food, 0, 3, 0), 12)) {
    const d = startDrag(e, "tray");
    d.from = dough.food.position.clone();
  } else if (stage === "carry" && (near(posOf(tray), 19) || near(posOf(dough.food), 12))) {
    startDrag(e, "carry");
  } else if (stage === "happy") {
    if (stageAge > 3.2 && (near(posOf(ladle), 13) || near(posOf(pan), 19))) {
      restart();
    } else startDrag(e, "return");
  }
}
function takeFruit(index) {
  const reserve = fruitStock[index];
  let f = reserve.pop();
  if (!f) {
    f = fruit(index ? "banana" : "berry");
    scene.add(f);
    f.position.copy(posOf(fruitBowls[index], 0, 6, 0));
  } else scene.attach(f);
  f.userData.source = index;
  return f;
}
function sendBack(f) {
  const i = f.userData.source,
    src = fruitBowls[i];
  src.attach(f);
  fruitStock[i].push(f);
}
const buttercream = mat(0xfff1d5, 0.65);
function pipeCream(d, x, z) {
  let r = diskLimit(x, z);
  if (Math.hypot(x, z) > r - 0.4) return;
  let line = d.trail,
    prev = line[line.length - 1];
  if (prev && Math.hypot(prev.x - x, prev.z - z) < 0.36) return;
  if (line.length > 210) {
    line = d.trail = [];
    d.creamMesh = null;
  }
  const y = Math.min(4.5, Math.max(0.4, surfaceHeight(x, z) + 0.18));
  let pt = v(x, y, z);
  line.push(pt);
  dough.cream.push(pt.clone());
  if (line.length === 1) line.push(pt.clone().add(v(0.045, 0.08, 0.04)));
  const pa = [],
    ix = [];
  for (let j = 0; j < line.length; j++) {
    let a = line[j],
      b = line[Math.min(j + 1, line.length - 1)],
      prior = line[Math.max(0, j - 1)],
      dir = b.clone().sub(prior);
    if (dir.lengthSq() < 0.00001) dir.set(0.1, 0, 1);
    dir.normalize();
    let lat = v(-dir.z, 0, dir.x).normalize(),
      up = dir.clone().cross(lat).normalize();
    let rad = 0.59 * (j === 0 ? 0.62 : j === line.length - 1 ? 0.79 : 1);
    for (let k = 0; k < 16; k++) {
      let ang = (k * TAU) / 16,
        radius = rad * (1 + 0.13 * Math.cos(ang * 8)),
        p = a
          .clone()
          .addScaledVector(lat, Math.cos(ang) * radius)
          .addScaledVector(up, Math.sin(ang) * radius);
      pa.push(...p.toArray());
      if (j) {
        let i = j * 16 + k,
          n = j * 16 + ((k + 1) % 16);
        ix.push(i - 16, i, n - 16, i, n, n - 16);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pa, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  if (!d.creamMesh) {
    d.creamMesh = mesh(dough.food, g, buttercream);
    d.creamMesh.material.side = T.DoubleSide;
  } else {
    d.creamMesh.geometry.dispose();
    d.creamMesh.geometry = g;
  }
}
function move(e) {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag,
    dx = e.clientX - d.x,
    dy = e.clientY - d.y;
  d.x = e.clientX;
  d.y = e.clientY;
  d.dist += Math.hypot(dx, dy);
  lastTouch = performance.now();
  if (d.kind === "tilt") {
    tilt.set(
      clamp((d.x - d.startX) / (innerWidth * 0.17), -1, 1),
      0,
      clamp((d.y - d.startY) / (innerHeight * 0.14), -1, 1)
    );
  } else if (d.kind === "flip") {
    const step =
      ((Math.abs(dx) * 0.85 + Math.max(0, -dy) * 1.1 + Math.max(0, dy) * 0.35) /
        Math.min(innerWidth, innerHeight)) *
      8;
    idealFlip = Math.min(PI, idealFlip + step);
  } else if (d.kind === "fold") {
    const now = pointAt(d.x, d.y, dough.food.position.y);
    const delta = now.clone().sub(d.prev);
    d.prev = now;
    let dist = foldIndex === 0 ? delta.x : foldIndex === 1 ? -delta.x : -delta.z;
    if (dist > 0) foldSheet(foldIndex, 0.43 * dist);
    if (dough.folds[foldIndex] >= 2.71) {
      foldIndex++;
      drag = null;
      chime(360 + foldIndex * 60, 0.14, 0.023);
      if (foldIndex === 3) change("paper");
    }
  } else if (d.kind === "paper") {
    const p = pointAt(d.x, d.y, 2),
      delta = p.distanceTo(d.prev);
    d.prev = p;
    let close = p.distanceTo(v(platePos.x, 2, platePos.z));
    if (wrapProgress > 0 || close < 12) {
      if (!dough.extra) {
        paperChoices[wrapChoice].scale.setScalar(0.001);
        rustle(0.3, 0.04, 2400);
      }
      wrapProgress = clamp(wrapProgress + delta / 20, 0, 1);
      wrapPaper(wrapChoice, wrapProgress);
      if (wrapProgress >= 1) {
        drag = null;
        change("window");
        chime(640, 0.23, 0.032);
      }
    } else {
      paperChoices[wrapChoice].position.x = p.x;
      paperChoices[wrapChoice].position.z = p.z;
    }
  } else if (d.kind === "window") {
    sashOpen = clamp(sashOpen + Math.abs(dx) / (innerWidth * 0.47), 0, 1);
    sash.position.x = -sashOpen * 152;
    if (sashOpen >= 1) {
      drag = null;
      change("tray");
      rustle(0.23, 0.025, 720);
    }
  } else if (d.kind === "carry") {
    const dest = screen(deliveryPoint()),
      sp = screen(tray.position),
      vx = dest.x - sp.x,
      vy = dest.y - sp.y,
      n = Math.hypot(vx, vy) || 1;
    let advance = (dx * vx + dy * vy) / n;
    carry = clamp(carry + advance / (Math.min(innerWidth, innerHeight) * 0.69), 0, 1);
  } else if (d.kind === "return" && d.dist > 18) restart();
}
function returnItem(obj, home, callback) {
  settle = { obj, home: home.clone(), start: obj.position.clone(), time: 0, callback };
}
function drop(e) {
  if (!drag || drag.id !== e.pointerId) return;
  const d = drag;
  drag = null;
  lastTouch = performance.now();
  const cancelled = e.type === "pointercancel" || e.type === "lostpointercapture";
  if (d.kind === "ladle" && stage === "ladle") {
    if (
      !cancelled &&
      d.dist > 5 &&
      Math.hypot(ladleGoal.x - pan.position.x, ladleGoal.z - pan.position.z) < 12
    ) {
      startPour();
    } else ladleGoal.copy(ladleRest);
  }
  if (d.kind === "tilt") tilt.set(0, 0, 0);
  if (d.kind === "flip" && stage === "flip") {
    if (idealFlip > dough.turned + 0.02) {
      d.release = true;
      drag = d;
    } else change("landFlip");
  }
  if (d.kind === "transfer") {
    const nearPlate = nearby(e, platePos, 13, 12);
    if (!cancelled && toolDepth >= 0.32 && nearPlate) {
      settle = { transfer: true, time: 0, from: dough.sheet.position.clone() };
      chime(395, 0.15, 0.022);
    } else {
      settle = { recover: true, time: 0, from: dough.sheet.position.clone() };
      transferLift = 0;
      toolDepth = 0;
    }
  }
  if (d.kind === "fruit") {
    const at = pointAt(d.x, d.y, platePos.y + 1.5).sub(dough.food.position),
      r = diskLimit(at.x, at.z);
    if (!cancelled && Math.hypot(at.x, at.z) < r + 1.6) {
      const f = d.item,
        lim = (r - 0.55) / Math.max(r - 0.55, Math.hypot(at.x, at.z));
      at.x *= lim;
      at.z *= lim;
      let rad = f.userData.kind === "berry" ? 1.65 : 1.7;
      const pile = surfaceHeight(at.x, at.z);
      let roll = v();
      for (const other of dough.pieces) {
        const diff = at.clone().sub(other.position);
        diff.y = 0;
        const len = diff.length();
        if (len < 2.4 && len > 0.02) roll.addScaledVector(diff.normalize(), 0.55 * (2.4 - len));
      }
      at.add(roll);
      let maxR = r - 0.55;
      if (Math.hypot(at.x, at.z) > maxR) {
        let k = maxR / Math.hypot(at.x, at.z);
        at.x *= k;
        at.z *= k;
      }
      at.y = pile + (f.userData.kind === "berry" ? 0.97 : 0.54);
      dough.food.attach(f);
      const startRotation = f.quaternion.clone(),
        restRotation = new T.Quaternion().setFromEuler(
          new T.Euler(
            f.userData.kind === "berry" ? -1.22 : 0.09,
            Math.atan2(roll.x, roll.z) + 0.2,
            f.userData.kind === "berry" ? 0.17 : 0.08
          )
        );
      f.userData.radius = rad;
      f.userData.height = f.userData.kind === "berry" ? 1.35 : 0.9;
      returnItem(f, at, () => {
        dough.pieces.push(f);
      });
      settle.rotate = [startRotation, restRotation];
      chime(225, 0.09, 0.018);
    } else returnItem(d.item, d.from, () => sendBack(d.item));
  }
  if (d.kind === "cream") bagGoal.copy(bagHome);
  if (d.kind === "paper" && !wrapProgress) paperChoices[wrapChoice].position.copy(d.origin);
  if (d.kind === "tray") {
    if (!cancelled && nearby(e, posOf(tray), 16)) {
      const target = posOf(tray, 0, 1.06, 0);
      returnItem(dough.food, target, () => {
        tray.attach(dough.food);
        change("carry");
      });
      chime(300, 0.15, 0.02);
    } else returnItem(dough.food, d.from);
  }
  if (d.kind === "carry" && carry > 0.95 && !cancelled) {
    carry = 1;
    trayFollow();
    change("happy");
    finished.push(dough.food);
    scene.attach(dough.food);
    chime(523, 0.36, 0.04);
    setTimeout(() => chime(659, 0.38, 0.035), 170);
    setTimeout(() => chime(784, 0.52, 0.032), 370);
  }
  if (d.kind === "return" && !cancelled && d.dist > 6) restart();
}
function startPour() {
  if (stage !== "ladle") return;
  drag = null;
  pourReady = false;
  change("pour");
  ladleGoal.copy(pan.position).add(v(-2.5, 11, 0));
  rustle(0.95, 0.052, 1100);
}
function finishFlip() {
  if (dough.turned < PI) flipSheet(PI - dough.turned, flippingSide);
  dough.sheet.position.y = 0;
  drag = null;
  change("transfer");
  spatGoal.copy(pan.position).add(v(0, 0.53, 2.6));
  chime(246, 0.14, 0.036);
  rustle(0.55, 0.024, 2500);
}
function deliveryPoint() {
  const n = finished.length,
    slots = [
      [0, 0],
      [-27, 0],
      [27, 0],
      [-13.5, -24],
      [13.5, -24],
      [-13.5, 24],
      [13.5, 24]
    ];
  const slot = slots[n % slots.length];
  let y = -19.43;
  if (n >= slots.length) y += Math.floor(n / slots.length) * 5.2;
  return v(52 + slot[0], y, -150 + slot[1]);
}
function trayFollow(dt = 0.033) {
  const destination = deliveryPoint(),
    t = carry,
    xx = mix(trayHome.x, destination.x, t),
    zz = mix(trayHome.z, destination.z, t),
    yy = mix(trayHome.y, destination.y, clamp((t - 0.71) / 0.29, 0, 1)) + Math.sin(t * PI) * 5;
  tray.position.set(xx, yy, zz);
  const before = girl.root.position.clone();
  smoothPos(
    girl.root,
    v(
      xx + mix(20, 43, t) + 35 * Math.exp(-(((t - 0.56) / 0.18) ** 2)),
      -86 + Math.sin(t * PI * 15) * 0.55,
      zz - mix(16, 7, t)
    ),
    dt,
    15
  );
  girl.walk(before.distanceTo(girl.root.position));
  girl.root.rotation.y = mix(girl.root.rotation.y, mix(-1, -1.49, t), 1 - Math.exp(-dt * 9));
  for (let i = 0; i < 2; i++) {
    let wrist = girl.root.worldToLocal(posOf(tray, 12, 1.1, (i ? 1 : -1) * 5));
    girl.pose(i, wrist);
  }
}
let returnTrayFrom = v();
function restart() {
  returnTrayFrom.copy(tray.position);
  drag = null;
  change("return");
  travelHome = 0;
  lastTouch = performance.now();
}
function fresh() {
  carry = 0;
  wrapProgress = 0;
  foldIndex = 0;
  toolDepth = 0;
  tilt.set(0, 0, 0);
  applied.set(0, 0, 0);
  sashOpen = 0;
  sash.position.x = 0;
  ladle.rotation.set(0, 0, 0);
  spatula.rotation.set(0, 1.26, 0);
  for (const p of paperChoices) p.scale.setScalar(1);
  dough = newSheet();
  change("ladle");
  layout();
  girl.root.rotation.y = -0.52;
  girl.walk(0);
  girl.pose(0, v(-12, 68, 8));
  girl.pose(1, v(12, 69, 9));
}
function advanceDrag(dt) {
  if (!drag) return;
  const d = drag;
  d.held += dt;
  if (d.kind === "ladle") {
    let p = pointAt(d.x, d.y, 12.5);
    if (d.dist > 4) {
      const out = Math.hypot(p.x - bowlPos.x, p.z - bowlPos.z);
      ladleGoal.set(p.x, Math.max(12, pan.position.y + 5 + 5 * clamp(out / 25, 0, 1)), p.z);
      if (ladle.position.y < 9.1) {
        ladleGoal.x = ladleRest.x;
        ladleGoal.z = ladleRest.z;
      }
      if (nearby({ clientX: d.x, clientY: d.y }, posOf(pan, 0, 1, 0), 10, 4)) {
        ladleGoal.copy(pan.position).add(v(-2.5, 11, 0));
        if (ladle.position.distanceTo(ladleGoal) < 2.7) startPour();
      }
    } else ladleGoal.copy(ladleRest).y += 2.2;
  }
  if (d.kind === "flip") {
    toolDepth = Math.min(1, toolDepth + dt * 2.7);
    if (toolDepth > 0.28) {
      flipSheet(Math.min(Math.max(0, idealFlip - dough.turned), dt * 5.7), flippingSide);
      liftForFlip();
      if (dough.turned >= PI - 0.003) {
        finishFlip();
        return;
      }
      if (d.release && Math.abs(idealFlip - dough.turned) < 0.001) {
        drag = null;
        change("landFlip");
        return;
      }
    }
    const r = Math.max(...dough.sector);
    spatGoal
      .copy(pan.position)
      .add(
        v(
          flippingSide * r * (1 - toolDepth),
          0.7 + 3.4 * Math.max(0, 1 - toolDepth * 2.65) + dough.sheet.position.y,
          1.35
        )
      );
    spatula.rotation.y = flippingSide * 1.2;
    spatula.rotation.z = -flippingSide * 0.37 * Math.sin(dough.turned);
  }
  if (d.kind === "transfer") {
    toolDepth = Math.min(1, toolDepth + dt * 2.8);
    const p = pointAt(d.x, d.y, 5);
    let off = p.clone().sub(pan.position);
    if (d.dist < 8) off.set(0, 0, 0);
    const rail = platePos.clone().sub(pan.position);
    rail.y = 0;
    off.y = 0;
    const along = rail.multiplyScalar(clamp(off.dot(rail) / rail.lengthSq(), 0, 1));
    off.sub(along).clampLength(0, 2.5).add(along);
    const ext = clamp((toolDepth - 0.35) * 2.65, 0, 1);
    transferLift = mix(transferLift, 5, 1 - Math.exp(-dt * 6));
    const desired = v(off.x * ext, transferLift * ext, off.z * ext);
    dough.sheet.position.lerp(desired, 1 - Math.exp(-dt * 12));
    spatGoal
      .copy(pan.position)
      .add(dough.sheet.position)
      .add(v(0, 0.7, 3.5 * (1 - toolDepth)));
    spatula.rotation.y = 0.52;
  }
  if (d.kind === "fruit") {
    if (d.dist > 3) {
      let p = pointAt(d.x, d.y, platePos.y + 1.5);
      d.goal.set(
        p.x,
        Math.max(6, d.from.y + 1.6) -
          clamp(1 - Math.hypot(p.x - platePos.x, p.z - platePos.z) / 15, 0, 1) * 3,
        p.z
      );
      d.goal.x = clamp(d.goal.x, -73, 74);
      d.goal.z = clamp(d.goal.z, -43, 36);
      if (Math.hypot(d.goal.x - pan.position.x, d.goal.z - pan.position.z) < 16)
        d.goal.y = Math.max(d.goal.y, 15.2);
      if (
        d.item.position.y < 8.3 &&
        Math.hypot(d.item.position.x - d.from.x, d.item.position.z - d.from.z) < 3 &&
        Math.hypot(d.goal.x - d.from.x, d.goal.z - d.from.z) > 4
      ) {
        d.goal.set(d.item.position.x, 9.3, d.item.position.z);
      }
      const current = d.item.position,
        next = current.clone().lerp(d.goal, 1 - Math.exp(-dt * 21));
      const clearance = obstruction(next.x, next.z) + 1.55;
      if (current.y < clearance - 0.08) {
        d.goal.x = current.x;
        d.goal.z = current.z;
      }
      d.goal.y = Math.max(d.goal.y, clearance);
      smoothPos(d.item, d.goal, dt, 21);
    }
  }
  if (d.kind === "cream") {
    if (d.dist > 3) {
      let p = pointAt(d.x, d.y, platePos.y + 1.4),
        x = p.x - platePos.x,
        z = p.z - platePos.z;
      bag.rotation.z = mix(bag.rotation.z, -0.43, 1 - Math.exp(-dt * 12));
      bag.rotation.x = mix(bag.rotation.x, -0.26, 1 - Math.exp(-dt * 12));
      const nozzle = v(0, -7.48, 0).applyQuaternion(bag.quaternion);
      const above = Math.hypot(x, z) < diskLimit(x, z);
      const y = above ? Math.min(5.5, surfaceHeight(x, z) + 1) : Math.max(8, obstruction(p.x, p.z) + 0.6);
      bagGoal.copy(p).sub(nozzle);
      bagGoal.y = dough.food.position.y + y - nozzle.y;
      if (above && dough.pieces.length && bag.position.distanceTo(bagGoal) < 2.2) {
        pipeCream(d, x, z);
        d.beadTime += dt;
        if (d.beadTime > 0.6) {
          rustle(0.18, 0.012, 780);
          d.beadTime = 0;
        }
      }
    }
  }
  if (d.kind === "tray" && d.dist > 4) {
    dough.food.rotation.y = mix(dough.food.rotation.y, -1.09, 1 - Math.exp(-dt * 5));
    let p = pointAt(d.x, d.y, 2);
    smoothPos(dough.food, v(p.x, 6, p.z), dt, 14);
  }
}
function tick(dt) {
  elapsed += dt;
  stageAge += dt;
  advanceDrag(dt);
  const ladleTarget = ladleGoal.clone();
  ladleTarget.x = clamp(ladleTarget.x, -73, 74);
  ladleTarget.z = clamp(ladleTarget.z, -42, 35);
  if (
    ladleGoal.distanceToSquared(ladleRest) < 0.01 &&
    Math.hypot(ladle.position.x - ladleRest.x, ladle.position.z - ladleRest.z) > 1.1
  )
    ladleTarget.y = Math.max(13.7, ladle.position.y);
  smoothPos(ladle, ladleTarget, dt, 10);
  if (!drag && spatGoal.distanceToSquared(spatHome) < 0.01) {
    spatula.rotation.y = mix(spatula.rotation.y, 1.26, 1 - Math.exp(-dt * 6));
    spatula.rotation.z *= Math.exp(-dt * 7);
  }
  smoothPos(spatula, spatGoal, dt, 13);
  smoothPos(bag, bagGoal, dt, 17);
  if (stage === "pour" && !pourReady && ladle.position.distanceTo(ladleGoal) < 1) {
    pourStart();
    pourReady = true;
  }
  if (stage === "pour" && pourReady) {
    ladle.rotation.z = mix(ladle.rotation.z, -1.32, 1 - Math.exp(-dt * 3.6));
    if (pourSheet(dt)) {
      change("spread");
      ladleGoal.copy(ladleRest);
      chime(276, 0.09, 0.016);
    }
  } else if (stage !== "ladle") {
    ladle.rotation.z = mix(ladle.rotation.z, 0, 1 - Math.exp(-dt * 4));
  }
  if (stage === "spread") {
    applied.lerp(tilt, 1 - Math.exp(-dt * 7));
    pan.rotation.z = -applied.x * 0.125;
    pan.rotation.x = applied.z * 0.125;
    pan.position.y = 10.94 + Math.hypot(applied.x, applied.z) * 0.64;
    puddle(dt, applied.x, applied.z, dough.tiltWork > 0.12);
    if (drag?.kind === "tilt" && Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2))
      rustle(0.3, 0.012, 1600);
  } else if (!["ladle", "pour"].includes(stage)) {
    pan.rotation.x *= Math.exp(-dt * 12);
    pan.rotation.z *= Math.exp(-dt * 12);
    pan.position.y = mix(pan.position.y, 10.94, 1 - Math.exp(-dt * 12));
  }
  if (stage === "landFlip") {
    if (dough.turned > PI * 0.45) {
      flipSheet(dt * (2 + 3 * Math.sin(dough.turned)), flippingSide);
      liftForFlip();
      if (dough.turned >= PI - 0.002) finishFlip();
    } else {
      flipSheet(-dt * 2.7, flippingSide);
      liftForFlip();
      if (dough.turned <= 0.001) {
        change("spread");
        spatGoal.copy(spatHome);
        spatula.rotation.set(0, 1.26, 0);
      }
    }
  }
  if (stage === "transfer") {
    for (let i = 0; i < dough.nodes.length; i++) {
      let d = dough.nodes[i];
      d.heat = Math.min(1, d.heat + (dt * 0.19) / (0.6 + d.th));
      dough.geo.attributes.dryness.array[i] = d.heat;
    }
    dough.geo.attributes.dryness.needsUpdate = true;
  }
  if (!drag || drag.kind !== "cream") {
    bag.rotation.z = mix(bag.rotation.z, -1.08, 1 - Math.exp(-dt * 8));
    bag.rotation.x = mix(bag.rotation.x, 0.07, 1 - Math.exp(-dt * 8));
  }
  if (settle) {
    let a = settle;
    a.time += dt;
    let t = clamp(a.time / 0.46, 0, 1),
      s = t * t * (3 - 2 * t);
    if (a.recover) {
      const horizontal = clamp(t / 0.72, 0, 1);
      dough.sheet.position.set(
        a.from.x * (1 - horizontal),
        mix(Math.max(a.from.y, 3.2), 0, clamp((t - 0.72) / 0.28, 0, 1)),
        a.from.z * (1 - horizontal)
      );
      spatGoal
        .copy(pan.position)
        .add(dough.sheet.position)
        .add(v(0, 0.7, 0));
      if (t === 1) {
        settle = null;
        spatGoal.copy(spatHome);
      }
    } else if (a.transfer) {
      const dest = platePos
        .clone()
        .sub(pan.position)
        .add(v(0, 0.04, 0));
      const slide = clamp(t / 0.56, 0, 1);
      dough.sheet.position.set(
        mix(a.from.x, dest.x, slide),
        mix(a.from.y, dest.y, clamp((t - 0.52) / 0.48, 0, 1)),
        mix(a.from.z, dest.z, slide)
      );
      spatGoal
        .copy(pan.position)
        .add(dough.sheet.position)
        .add(v(0, 0.48, 0));
      if (t === 1) {
        placeOnPlate();
        spatGoal.copy(spatHome);
        change("dress");
        settle = null;
      }
    } else {
      if (a.rotate) a.obj.quaternion.slerpQuaternions(a.rotate[0], a.rotate[1], s);
      a.obj.position.lerpVectors(a.start, a.home, s);
      a.obj.position.y += Math.sin(t * PI) * 0.32;
      if (t === 1) {
        settle = null;
        a.callback?.();
      }
    }
  }
  if (stage === "carry") trayFollow(dt);
  if (stage === "return") {
    travelHome += dt;
    const before = girl.root.position.clone();
    smoothPos(girl.root, v(portrait ? 25 : 43, -84, portrait ? -63 : -54), dt, 3.9);
    girl.walk(before.distanceTo(girl.root.position));
    if (travelHome < 0.46) {
      tray.position.x += dt * 40;
      dough.food.position.y = Math.max(returnTrayFrom.y - 0.75, dough.food.position.y - dt * 3.8);
    }
    if (travelHome >= 0.46) {
      const t = clamp((travelHome - 0.46) / 0.89, 0, 1),
        s = t * t * (3 - 2 * t);
      tray.position.lerpVectors(returnTrayFrom.clone().add(v(18, 0, 0)), trayHome, s);
      tray.position.y = mix(returnTrayFrom.y, 5, clamp(t * 3.2, 0, 1)) - 4 * clamp((t - 0.7) / 0.3, 0, 1);
    }
    carry = Math.max(0, 1 - travelHome * 0.8);
    if (travelHome > 1.35) fresh();
  }
  const outside = ["carry", "happy", "return"].includes(stage) ? carry : 0;
  light.position.set(-95, 160, 58 - 145 * outside);
  light.target.position.set(0, 0, -18 - 145 * outside);
  guide(dt);
  cameraPose();
  cam.position.lerp(desiredEye, 1 - Math.exp(-dt * 2.1));
  actualLook.lerp(targetLook, 1 - Math.exp(-dt * 2.1));
  cam.fov = mix(cam.fov, fovGoal, 1 - Math.exp(-dt * 2.1));
  cam.updateProjectionMatrix();
  cam.lookAt(actualLook);
}
function guide(dt) {
  const idle = (performance.now() - lastTouch) / 1000,
    active = !drag && idle > 3.9,
    phase = clamp((idle - 3.9) % 5.1, 0, 2.9) / 2.9,
    w = active ? Math.sin(phase * PI) ** 2 : 0;
  const sweep = 0.5 - 0.5 * Math.cos(clamp((phase - 0.18) / 0.65, 0, 1) * PI);
  let from = platePos.clone(),
    to = platePos.clone();
  const R = Math.max(...dough.sector);
  switch (stage) {
    case "ladle":
      from.copy(posOf(ladle, -7, 12, -2));
      to.copy(posOf(pan, 0, 12, 0));
      break;
    case "spread":
      if (readyFlip()) {
        from.copy(posOf(spatula, 0, 1, 7));
        to.copy(posOf(pan, R * 0.9, 2, 0));
      } else {
        from.copy(posOf(handle, 0, 2, 24));
        to.copy(from).add(v(Math.sin(phase * TAU) * 15, 5, Math.cos(phase * TAU) * 10));
      }
      break;
    case "flip":
      from.copy(posOf(spatula));
      to.copy(posOf(pan, -flippingSide * 6, 12, 0));
      break;
    case "transfer":
      from.copy(posOf(pan, 0, 2, 0));
      break;
    case "dress":
      if (!dough.pieces.length) {
        from.copy(posOf(fruitBowls[0], 0, 6, 0));
        break;
      }
      if (!dough.cream.length) {
        from.copy(posOf(bag, 0, 4, 0));
        to.add(v(Math.sin(phase * TAU) * 4, 2, 0));
        break;
      }
    case "fold":
      from.add(v(foldIndex === 0 ? -R : foldIndex === 1 ? R : 0, 1, foldIndex === 2 ? R : 0));
      to.y += 3;
      break;
    case "paper":
      from.copy(posOf(paperChoices[wrapChoice]));
      break;
    case "window":
      from.copy(posOf(latch));
      to.copy(from).add(v(-33, 1, 0));
      break;
    case "tray":
      to.copy(tray.position);
      break;
  }
  const focus = from.lerp(to, active ? sweep : 0);
  if (active) focus.y += Math.sin(sweep * PI) * 6;
  if (!["carry", "happy", "return"].includes(stage)) {
    const to = girl.root.worldToLocal(focus.clone()),
      look = v(7, 69, 8).lerp(to, w * 0.86);
    girl.pose(1, look);
    girl.head.rotation.y = mix(girl.head.rotation.y, -0.25 - 0.24 * w, 1 - Math.exp(-dt * 4));
    girl.head.rotation.x = 0.105 + 0.06 * w;
  }
  if (stage === "carry" || stage === "happy") {
    const joy = stage === "happy" ? 1 : carry;
    dad.pose(1, v(9, 70 + 10 * joy, 20 + 8 * joy));
    mum.pose(0, v(-10, 70 + 9 * joy, 20 + 5 * joy));
  }
  if (stage === "happy") {
    const lean = 0.125 * (1 - Math.exp(-stageAge * 2));
    mum.body.rotation.x = lean;
    dad.body.rotation.x = lean * 0.87;
    mum.head.rotation.y = -0.18;
    dad.head.rotation.y = 0.23;
    girl.head.rotation.y = 0.26;
    girl.pose(1, v(7, 93 + Math.sin(stageAge * 3) * 2.3, 22));
  }
}
canvas.addEventListener("pointerdown", begin);
canvas.addEventListener("pointermove", move);
canvas.addEventListener("pointerup", drop);
canvas.addEventListener("pointercancel", drop);
canvas.addEventListener("lostpointercapture", drop);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
resize();
addEventListener("resize", resize);
renderer.render(scene, cam);
function frame(now) {
  let dt = clamp((now - last) / 1000, 0.0001, 0.12);
  last = now;
  const steps = Math.ceil(dt / 0.04);
  for (let i = 0; i < steps; i++) tick(dt / steps);
  renderer.render(scene, cam);
  if (loadedTextures >= sourceTextureCount || elapsed > 1.5) shop.classList.add("ready");
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
