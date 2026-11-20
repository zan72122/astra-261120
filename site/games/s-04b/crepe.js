"use strict";
// Material coordinates belong to the sheet for its entire life, including the underside.
const spokes = 92,
  rings = 32;
const doughMaterial = mat(0xffffff, 0.47, 0, { side: T.DoubleSide, vertexColors: true });
doughMaterial.onBeforeCompile = (sh) => {
  sh.uniforms.toastMap = { value: tex.bake };
  sh.vertexShader =
    "attribute float dryness;attribute float film;varying float vDry;varying float vFilm;varying vec2 vSheet;\n" +
    sh.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvDry=dryness;vFilm=film;vSheet=uv;"
    );
  sh.fragmentShader =
    "uniform sampler2D toastMap;varying float vDry;varying float vFilm;varying vec2 vSheet;\n" +
    sh.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
vec2 cell=floor(vSheet*34.0);float seed=fract(sin(dot(cell,vec2(17.117,95.31)))*11631.731);
vec2 spot=fract(vSheet*34.)-vec2(.3+.3*seed,.37+.16*seed);
if(seed>.83 && length(spot)<clamp((.19-vFilm)*1.72,0.,.22)*smoothstep(.02,.4,vDry))discard;
vec3 brown=texture2D(toastMap,vSheet).rgb;
diffuseColor.rgb*=mix(vec3(1.,.914,.735),brown,clamp(vDry,0.,1.));`
    );
};
function newSheet() {
  let positions = [],
    uv = [],
    indices = [],
    colors = [],
    nodes = [],
    dry = [],
    film = [];
  let count = spokes * (rings + 1);
  for (let side = 0; side < 2; side++)
    for (let j = 0; j <= rings; j++)
      for (let k = 0; k < spokes; k++) {
        const u = Math.max(0.0004, j / rings),
          a = (TAU * k) / spokes,
          cs = Math.cos(a),
          sn = Math.sin(a),
          x = u * 3.17 * cs,
          z = u * 3.17 * sn;
        positions.push(x, 2.77 - side * (1 - u * u) * 2.21, z);
        uv.push(0.5 + cs * u * 0.5, 0.5 + sn * u * 0.5);
        colors.push(1, 1, 1);
        dry.push(0);
        film.push(1);
        nodes.push({
          u,
          a,
          k,
          cs,
          sn,
          side,
          fall: false,
          land: false,
          vy: 0,
          vx: 0,
          vz: 0,
          th: 0.38,
          heat: 0,
          turn: 0,
          fold: [0, 0, 0]
        });
        if (j < rings) {
          let b = side * count + j * spokes + k,
            n = side * count + j * spokes + ((k + 1) % spokes);
          if (side === 0) indices.push(b, n, b + spokes, n, n + spokes, b + spokes);
          else indices.push(b, b + spokes, n, n, b + spokes, n + spokes);
        }
        if (!side && j === rings) {
          let b = j * spokes + k,
            n = j * spokes + ((k + 1) % spokes);
          indices.push(b, b + count, n, n, b + count, n + count);
        }
      }
  const geo = new T.BufferGeometry();
  for (const [key, arr, dim] of [
    ["position", positions, 3],
    ["uv", uv, 2],
    ["color", colors, 3],
    ["dryness", dry, 1],
    ["film", film, 1]
  ])
    geo.setAttribute(key, new T.Float32BufferAttribute(arr, dim));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.attributes.position.setUsage(T.DynamicDrawUsage);
  const sheet = mesh(ladle, geo, doughMaterial);
  sheet.frustumCulled = false;
  const food = group(scene);
  return {
    sheet,
    food,
    nodes,
    count,
    geo,
    pos: geo.attributes.position.array,
    sector: Array(spokes).fill(5.35),
    pool: Array(spokes).fill(0.15),
    landed: 0,
    poured: 0,
    lastSlopeX: 0,
    lastSlopeZ: 0,
    tiltWork: 0,
    turned: 0,
    folds: [0, 0, 0],
    pieces: [],
    cream: [],
    extra: null,
    activePaper: null
  };
}
let dough = newSheet();
function dirtySheet() {
  const g = dough.geo;
  g.attributes.position.needsUpdate = true;
  g.attributes.dryness.needsUpdate = true;
  g.attributes.film.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
}
function pourStart() {
  pan.updateWorldMatrix(true, false);
  pan.attach(dough.sheet);
  const matrix = dough.sheet.matrix.clone();
  dough.geo.applyMatrix4(matrix);
  dough.sheet.position.set(0, 0, 0);
  dough.sheet.rotation.set(0, 0, 0);
  dough.sheet.scale.setScalar(1);
}
const pv = v(),
  lip = v();
function pourSheet(dt) {
  const d = dough;
  d.poured += dt;
  const lipW = ladle.localToWorld(lip.set(2.1, 2.65, 0));
  pan.worldToLocal(lipW);
  let landed = 0;
  for (let i = 0; i < d.nodes.length; i++) {
    const n = d.nodes[i],
      q = i * 3,
      p = d.pos,
      th = 0.2 + 0.95 * (1 - n.u * n.u);
    if (d.poured < n.u * 0.88) {
      pv.set(n.u * 3.17 * n.cs, 2.77 - n.side * (1 - n.u * n.u) * 2.21, n.u * 3.17 * n.sn);
      pan.worldToLocal(ladle.localToWorld(pv));
      p[q] = pv.x;
      p[q + 1] = pv.y;
      p[q + 2] = pv.z;
      continue;
    }
    n.vy -= dt * 105;
    if (!n.fall) {
      n.fall = true;
      n.vy = -2;
    }
    if (!n.land) {
      let y = p[q + 1];
      let fraction = clamp((y - 0.68) / Math.max(2, lip.y - 0.68), 0, 1);
      let width = 1 - fraction;
      let tx = n.cs * n.u * 5.35 * width + lip.x * fraction,
        tz = n.sn * n.u * 5.35 * width + lip.z * fraction;
      p[q] += clamp(tx - p[q], -dt * 32, dt * 32);
      p[q + 2] += clamp(tz - p[q + 2], -dt * 32, dt * 32);
      p[q + 1] = Math.max(0.7 + th * (1 - n.side), y + n.vy * dt);
      if (p[q + 1] <= 0.701 + th * (1 - n.side)) n.land = true;
    }
    if (n.land) {
      landed++;
      p[q] += clamp(n.cs * n.u * 5.35 - p[q], -dt * 10, dt * 10);
      p[q + 2] += clamp(n.sn * n.u * 5.35 - p[q + 2], -dt * 10, dt * 10);
      n.th = th;
    }
  }
  d.landed = landed;
  dirtySheet();
  return landed === d.nodes.length && d.poured > 1.35;
}
function puddle(dt, tx, tz, heatOn) {
  const d = dough,
    g = d.geo,
    p = d.pos,
    stress = Math.hypot(tx, tz);
  const flick = clamp((Math.hypot(tx - d.lastSlopeX, tz - d.lastSlopeZ) / dt - 1.05) * 0.27, 0, 1);
  d.lastSlopeX = tx;
  d.lastSlopeZ = tz;
  d.tiltWork += stress * dt;
  const old = d.sector.slice();
  let mean = 0;
  for (let k = 0; k < spokes; k++) {
    const a = (k * TAU) / spokes,
      down = tx * Math.cos(a) + tz * Math.sin(a);
    const fan = flick * stress * clamp(1 + down / Math.max(stress, 0.001), 0, 1) * 0.58;
    const spread = Math.max(0, down + 0.21 * stress + fan);
    const neighbors = old[(k + 1) % spokes] + old[(k + spokes - 1) % spokes] - 2 * old[k];
    d.sector[k] = clamp(
      old[k] + dt * (spread * (2.4 + 0.34 * (12.75 - old[k])) + 0.07 * stress * neighbors),
      5.35,
      12.72
    );
    d.pool[k] = clamp(d.pool[k] + dt * (down * 0.23 - d.pool[k] * stress * 0.05), 0, 1.4);
    mean += (5.35 / d.sector[k]) ** 2 / spokes;
  }
  // Integrate the polar cells first, then distribute exactly one ladleful over their area.
  let volume = 0;
  for (let i = 0; i < d.count; i++) {
    const n = d.nodes[i],
      u = n.u,
      R = d.sector[n.k],
      down = Math.max(0, tx * n.cs + tz * n.sn);
    const scale = mix(mean, (5.35 / R) ** 2, Math.min(1, u * 3));
    const meniscus = (0.05 + 0.21 * down + 0.17 * d.pool[n.k]) * Math.exp(-(((u - 0.93) / 0.067) ** 2));
    n.th = Math.max(
      0.026,
      (0.2 + 0.95 * (1 - u * u)) * scale +
        0.35 * d.pool[n.k] * u ** 4 +
        meniscus +
        0.028 * Math.sin(n.a * 7 + u * 12) * u
    );
    const inner = Math.max(0, u - 0.5 / rings),
      outer = Math.min(1, u + 0.5 / rings);
    volume += ((n.th * PI) / spokes) * R * R * (outer * outer - inner * inner);
  }
  const portion = (PI * 5.35 ** 2 * 0.675) / volume;
  for (let i = 0; i < d.nodes.length; i++) {
    const n = d.nodes[i],
      q = i * 3,
      R = d.sector[n.k],
      u = n.u,
      r = R * u;
    if (n.side) n.th = d.nodes[i - d.count].th;
    else n.th *= portion;
    const speed = 1 - Math.exp(-dt * (7.3 + stress * 3));
    p[q] += (n.cs * r - p[q]) * speed;
    p[q + 2] += (n.sn * r - p[q + 2]) * speed;
    if (heatOn)
      n.heat = Math.min(
        1,
        n.heat + ((dt * (0.09 + 0.23 * u * u)) / (0.57 + n.th)) * (0.68 + 0.32 * Math.min(1, d.tiltWork))
      );
    const lift = 0.27 * u ** 7 * Math.max(0, n.heat - 0.38) * (0.5 + 0.5 * Math.sin(n.a * 9 + 0.7));
    p[q + 1] = 0.697 + lift + (1 - n.side) * n.th;
    g.attributes.dryness.array[i] = n.heat;
    g.attributes.film.array[i] = n.th;
  }
  dirtySheet();
}
function flipSheet(delta, side) {
  const d = dough,
    p = d.pos;
  d.turned = clamp(d.turned + delta, 0, PI);
  for (let i = 0; i < d.nodes.length; i++) {
    const n = d.nodes[i],
      q = i * 3;
    let front = 0.5 + 0.5 * n.cs * n.u * side;
    const local = clamp(d.turned + 0.37 * Math.sin(d.turned) * (front - 0.5) * 2, 0, PI),
      a = local - n.turn;
    n.turn = local;
    const x = p[q],
      y = p[q + 1] - (0.7 + n.th * 0.5);
    p[q] = x * Math.cos(a) - side * y * Math.sin(a);
    p[q + 1] = 0.7 + n.th * 0.5 + y * Math.cos(a) + side * x * Math.sin(a);
  }
  dirtySheet();
}
function liftForFlip() {
  let a = dough.turned;
  dough.sheet.position.y = Math.sin(a) * Math.max(...dough.sector) + 0.24 * Math.sin(a * 2);
}
function placeOnPlate() {
  dough.food.position.set(platePos.x, platePos.y + 0.72, platePos.z);
  dough.food.attach(dough.sheet);
  dough.sheet.position.set(0, -0.69, 0);
  dough.sheet.rotation.set(0, 0, 0);
}
function surfaceHeight(x, z) {
  const k = Math.round((((Math.atan2(z, -x) + TAU) % TAU) / TAU) * spokes) % spokes,
    j = clamp(Math.round((Math.hypot(x, z) / dough.sector[k]) * rings), 0, rings);
  let h = 0.035 + dough.nodes[j * spokes + k].th;
  for (const f of dough.pieces) {
    const dx = x - f.position.x,
      dz = z - f.position.z,
      rad = f.userData.radius;
    if (dx * dx + dz * dz < rad * rad)
      h = Math.max(h, f.position.y + f.userData.height * (1 - (dx * dx + dz * dz) / (rad * rad)) - 0.15);
  }
  for (const c of dough.cream) {
    let r = Math.hypot(c.x - x, c.z - z);
    if (r < 0.85) h = Math.max(h, c.y + 0.55 * (1 - r / 0.85));
  }
  return h;
}
function diskLimit(x, z) {
  let a = (Math.atan2(z, -x) + TAU) % TAU,
    k = Math.round((a / TAU) * spokes) % spokes;
  return dough.sector[k];
}
function foldSheet(idx, amount) {
  const d = dough,
    p = d.pos;
  d.folds[idx] = clamp(d.folds[idx] + amount, 0, 2.72);
  const side = idx === 0 ? -1 : 1,
    R = Math.max(...d.sector);
  for (let i = 0; i < d.nodes.length; i++) {
    let n = d.nodes[i],
      q = i * 3;
    if (!n.foldDist) n.foldDist = [];
    let nx = idx < 2 ? side * 0.946 : 0,
      nz = idx < 2 ? 0.325 : 1;
    const crease = R * (idx < 2 ? 0.177 : 0.385);
    if (n.foldDist[idx] == null) n.foldDist[idx] = p[q] * nx + p[q + 2] * nz - crease;
    let dist = n.foldDist[idx];
    if (dist <= 0) continue;
    const bend = clamp(dist / (1.05 + n.th * 1.5), 0, 1);
    let angle = d.folds[idx] * bend,
      dA = angle - n.fold[idx];
    if (dA === 0) continue;
    n.fold[idx] = angle;
    let current = p[q] * nx + p[q + 2] * nz - crease,
      h = p[q + 1] - 0.74,
      dx = current * Math.cos(dA) - h * Math.sin(dA) - current;
    p[q] += nx * dx;
    p[q + 2] += nz * dx;
    if (angle > PI * 0.55) {
      const half = Math.max(0.62, (R * 0.65 - p[q + 2]) * 0.38 + 0.35);
      const outside = Math.max(0, Math.abs(p[q]) - half);
      p[q] -= Math.sign(p[q]) * outside * clamp(Math.abs(amount) * 8, 0, 1);
    }
    const hill = surfaceHeight(p[q], p[q + 2]);
    p[q + 1] = Math.max(
      0.74 + (1 - n.side) * 0.1 + idx * 0.11,
      0.74 + h * Math.cos(dA) + current * Math.sin(dA),
      hill + 0.74 + n.side * 0.09
    );
  }
  for (const f of d.pieces) {
    const nx = idx < 2 ? side * 0.946 : 0,
      nz = idx < 2 ? 0.325 : 1,
      edge = f.position.x * nx + f.position.z * nz;
    if (edge > (idx < 2 ? 2.4 : 4.75)) {
      f.position.x -= nx * amount * 0.22;
      f.position.z -= nz * amount * 0.22 + amount * 0.1;
      f.rotation.z += amount * 0.08 * side;
    }
  }
  dirtySheet();
}
function wrapPaper(choice, progress) {
  const d = dough;
  if (!d.extra) {
    let coords = [],
      uv = [],
      indices = [];
    for (let j = 0; j <= 14; j++)
      for (let i = 0; i <= 32; i++) {
        coords.push(0, 0, 0);
        uv.push(i / 32, j / 14);
        let k = j * 33 + i;
        if (j < 14 && i < 32) indices.push(k, k + 33, k + 1, k + 1, k + 33, k + 34);
      }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(coords, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    d.extra = mesh(d.food, g, wrapMaterials[choice].clone());
    d.extra.material.side = T.DoubleSide;
    d.extra.frustumCulled = false;
  }
  if (!d.paperProfile) {
    d.paperProfile = [];
    for (let row = 0; row <= 14; row++) {
      let h = row / 14,
        R = Math.max(...d.sector),
        z = R * (0.77 - h * 0.975),
        min = Infinity,
        max = -Infinity,
        high = 0.6;
      for (let i = 0; i < d.count; i++) {
        let q = i * 3;
        if (Math.abs(d.pos[q + 2] - z) > 0.72) continue;
        min = Math.min(min, d.pos[q]);
        max = Math.max(max, d.pos[q]);
        high = Math.max(high, d.pos[q + 1] - 0.69);
      }
      for (const f of d.pieces)
        if (Math.abs(f.position.z - z) < 1.8) {
          min = Math.min(min, f.position.x - 1.2);
          max = Math.max(max, f.position.x + 1.2);
          high = Math.max(high, f.position.y + f.userData.height);
        }
      if (!Number.isFinite(min)) {
        min = -0.68;
        max = 0.68;
      }
      d.paperProfile.push({
        center: (min + max) * 0.5,
        radius: row === 0 ? 0.24 : Math.max(0.39, (max - min) * 0.5 + 0.25),
        height: high + 0.24
      });
    }
  }
  let outer = d.extra.geometry.attributes.position;
  const R = Math.max(...d.sector),
    widest = (choice ? 1.13 : 1) * (3.35 + Math.min(1.25, d.pieces.length * 0.12));
  for (let j = 0; j <= 14; j++)
    for (let i = 0; i <= 32; i++) {
      let h = j / 14,
        u = i / 16 - 1,
        profile = d.paperProfile[j],
        r = profile.radius + (choice ? 0.22 : 0),
        a = u * progress * PI * 1.04,
        w = mix(1.3, widest, h) * PI,
        x = profile.center + (1 - progress) * u * w + r * Math.sin(a),
        y = 0.025 + profile.height * 0.52 * (1 - Math.cos(a)) + 0.1 * Math.abs(u) * progress,
        z = R * (0.77 - h * 0.975) + Math.abs(u) * 1.1 * h;
      outer.setXYZ(j * 33 + i, x, y, z);
    }
  outer.needsUpdate = true;
  d.extra.geometry.computeVertexNormals();
}
