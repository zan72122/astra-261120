"use strict";
const counter = group(),
  island = group(counter);
for (let i = 0; i < 9; i++) {
  const board = box(island, 0, -1.6, -40.5 + i * 10.1, 187, 3.1, 10.05, oak);
  board.material = i % 3 === 1 ? mat(0xf4dfbe, 0.51, 0, { map: tex.oak }) : oak;
}
box(island, 0, -5.5, 40.65, 188, 5.4, 1.6, woodDark);
box(island, 0, -42, 38.8, 182, 73, 3, 0x82a38e);
for (let x = -86; x <= 90; x += 16) box(island, x, -40, 40.4, 1, 68, 0.8, 0x6f917e);
const stove = group(counter, -2, 0, 10);
for (const x of [-14, 14]) for (const z of [-8.9, 8.9]) cyl(stove, x, 0.62, z, 1.5, 1.7, 1.25, darkMetal);
slab(stove, 0, 1.55, 0, 37.5, 1.25, 26.3, 2.7, 0x96a38c);
slab(stove, 0, 4.7, 0, 38, 5.9, 26.7, 2.6, mat(0xb4c4a8, 0.37, 0.17), 0.65);
slab(stove, 0, 7.64, 0, 37.7, 0.76, 26.4, 2.4, 0xe6d5aa, 0.22);
slab(stove, -1, 8.05, -0.2, 27, 0.46, 23, 2.7, darkMetal, 0.16);
cyl(stove, -1, 8.76, 0, 8, 9, 1.3, darkMetal);
ring(stove, -1, 9.1, 0, 8.3, 0.45, steel);
for (let i = 0; i < 6; i++) {
  let a = (i * TAU) / 6;
  const q = box(stove, -1 + Math.sin(a) * 8.6, 9.76, Math.cos(a) * 8.6, 1.1, 2.2, 7.3, 0x363b38);
  q.rotation.y = a;
}
for (let i = 0; i < 8; i++) {
  const q = slab(stove, -13 + i * 1.18, 4.55, 13.29, 0.47, 0.17, 2.8, 0.18, 0x525a4c, 0.04);
  q.rotation.x = PI / 2;
}
for (const x of [-17.3, 17.3])
  for (const z of [-10.9, 10.9]) {
    cyl(stove, x, 8.09, z, 0.32, 0.32, 0.09, steel);
    box(stove, x, 8.15, z, 0.35, 0.04, 0.08, darkMetal);
  }
const knob = group(stove, 10.7, 4.8, 13.65);
knob.rotation.x = PI / 2;
cyl(knob, 0, 0, 0, 2.7, 2.7, 0.75, brass);
cyl(knob, 0, 0.98, 0, 2.12, 2.22, 1.7, 0x546859, 32);
box(knob, 0, 1.91, 0, 0.44, 0.31, 2.4, cream);
ball(stove, 6.56, 5.9, 13.41, 0.38, 0.38, 0.19, 0xc45b3c);
for (const x of [-16.6, 16.6]) {
  ball(stove, x, 4.65, 13.33, 0.35, 0.35, 0.15, brass);
  box(stove, x, 4.64, 13.51, 0.38, 0.08, 0.03, 0x756957);
}
shade(stove, 0, 0.017, 1, 48, 34);
const pan = group(scene, -3, 10.94, 10);
lathe(
  pan,
  0,
  0,
  0,
  [
    [0.01, 0],
    [11.65, 0],
    [12.18, 0.18],
    [13.16, 0.79],
    [13.85, 1.65],
    [14.05, 2.03],
    [13.98, 2.23],
    [13.77, 2.28],
    [13.57, 2.12],
    [13.12, 1.45],
    [12.68, 1],
    [11.89, 0.68],
    [0.01, 0.67]
  ],
  iron,
  112
);
ring(pan, 0, 2.18, 0, 13.86, 0.16, steel);
const cookingFace = mesh(pan, new T.CircleGeometry(11.85, 96), iron, 0, 0.683, 0);
cookingFace.rotation.x = -PI / 2;
const handle = group(pan, 0, 0.64, 0);
handle.rotation.y = 0.57;
rod(handle, v(0, 0.4, 12.1), v(0, 2.05, 17), 1.34, steel, 1.0);
const grip = group(handle, 0, 2.02, 16.7);
grip.rotation.x = 1.45;
lathe(
  grip,
  0,
  0,
  0,
  [
    [0.75, 0],
    [1.04, 0.65],
    [1.34, 1.15],
    [1.48, 3.4],
    [1.36, 8.1],
    [1.2, 11.5],
    [0.88, 12.3],
    [0.26, 12.48]
  ],
  walnut,
  36
);
cyl(grip, 0, 0.62, 0, 1.19, 1.16, 1.15, brass);
for (const s of [-1, 1]) ball(pan, 0.56 * 6 + s * 1, 0.94, 10.6, 0.46, 0.16, 0.46, steel);
function bowl(p, x, y, z, r, h, c) {
  const g = group(p, x, y, z);
  lathe(
    g,
    0,
    0,
    0,
    [
      [0.01, 0.03],
      [r * 0.39, 0.03],
      [r * 0.42, 0.37],
      [r * 0.54, h * 0.16],
      [r * 0.71, h * 0.34],
      [r * 0.86, h * 0.59],
      [r * 0.98, h * 0.89],
      [r, h * 0.98],
      [r - 0.03, h + 0.08],
      [r * 0.966, h + 0.13],
      [r * 0.939, h * 0.95],
      [r * 0.81, h * 0.61],
      [r * 0.65, h * 0.4],
      [r * 0.4, h * 0.23],
      [0.01, h * 0.22]
    ],
    c,
    72
  );
  ring(g, 0, h * 0.98, 0, r * 0.987, r * 0.026, c);
  return g;
}
const bowlPos = v(-29, 0, 9),
  mixBowl = bowl(counter, bowlPos.x, 0.18, bowlPos.z, 10.4, 8.5, steel);
ring(mixBowl, 0, 0.3, 0, 4.2, 0.22, steel);
ring(mixBowl, 0, 7.76, 0, 9.98, 0.13, steel);
shade(mixBowl, 0, -0.156, 0, 25, 23);
const raw = mat(0xffedc2, 0.36);
lathe(
  mixBowl,
  0,
  0,
  0,
  [
    [0.01, 6.53],
    [8.95, 6.53],
    [9.06, 6.58],
    [8.93, 6.65],
    [7.7, 6.61],
    [0.01, 6.57]
  ],
  raw
);
for (let i = 0; i < 22; i++) {
  let a = rand() * TAU,
    r = Math.sqrt(rand()) * 8.2;
  ball(mixBowl, Math.cos(a) * r, 6.6, Math.sin(a) * r, 0.09 + rand() * 0.09, 0.036, 0.12, 0xf4dfb6);
}
const ladle = group(scene, -27, 5.65, 8.6);
lathe(
  ladle,
  0,
  0,
  0,
  [
    [0.01, 0],
    [1.3, 0.24],
    [2.38, 0.87],
    [3.12, 1.85],
    [3.42, 2.87],
    [3.41, 3.1],
    [3.27, 3.15],
    [3.15, 2.65],
    [2.88, 1.85],
    [2.1, 1.06],
    [1.15, 0.55],
    [0.01, 0.4]
  ],
  steel
);
ring(ladle, 0, 3.02, 0, 3.37, 0.13, steel);
path(
  ladle,
  [
    [-2.7, 1.6, -0.3],
    [-3.5, 3.75, -0.6],
    [-4.9, 6.9, -1.1],
    [-7.93, 12.45, -2.1]
  ],
  0.45,
  steel
);
rod(ladle, v(-6.7, 10.04, -1.7), v(-10.49, 17.35, -2.82), 0.76, walnut, 0.85);
rod(ladle, v(-6.63, 9.88, -1.7), v(-7.1, 10.83, -1.85), 0.79, brass);
ball(ladle, -10.49, 17.35, -2.82, 0.85, 0.84, 0.83, walnut);
batch(ladle);
const platePos = v(28.9, 0.18, 7.35);
function plate(p, r) {
  lathe(
    p,
    0,
    0,
    0,
    [
      [0.01, 0],
      [r * 0.54, 0],
      [r * 0.57, 0.26],
      [r * 0.73, 0.4],
      [r * 0.94, 1.38],
      [r, 1.68],
      [r, 1.88],
      [r * 0.97, 1.99],
      [r * 0.9, 1.74],
      [r * 0.77, 1.05],
      [r * 0.7, 0.73],
      [0.01, 0.7]
    ],
    cream,
    90
  );
  ring(p, 0, 1.88, 0, r * 0.958, 0.124, 0x698e83);
  ring(p, 0, 1.67, 0, r * 0.899, 0.062, 0x83a090);
}
const servePlate = group(counter, ...platePos.toArray());
plate(servePlate, 13.2);
shade(servePlate, 0, -0.158, 0, 32, 29);
const spatHome = v(20, 0.48, 22.7),
  spatula = group(scene, ...spatHome.toArray());
const blade = new T.Shape();
blade.moveTo(-2.4, -6.8);
blade.quadraticCurveTo(-3.3, -6.8, -3.1, -5.6);
blade.lineTo(-2.7, 0.8);
blade.quadraticCurveTo(-2.53, 2.4, -0.55, 3.3);
blade.lineTo(0.55, 3.3);
blade.quadraticCurveTo(2.53, 2.4, 2.7, 0.8);
blade.lineTo(3.1, -5.6);
blade.quadraticCurveTo(3.3, -6.8, 2.4, -6.8);
blade.closePath();
const bg = new T.ExtrudeGeometry(blade, {
  depth: 0.12,
  bevelThickness: 0.05,
  bevelSize: 0.08,
  bevelSegments: 2
});
bg.rotateX(PI / 2);
mesh(spatula, bg, steel);
for (let i = -1; i < 2; i++) slab(spatula, i * 1.25, 0.04, -2.2, 0.29, 0.05, 4.9, 0.13, 0x7f8074, 0.015);
path(
  spatula,
  [
    [0, 0, 2.7],
    [0, 0.3, 4.4],
    [0, 1.1, 5.6],
    [0, 1.3, 8.3]
  ],
  0.44,
  steel
);
rod(spatula, v(0, 1.29, 7.1), v(0, 1.43, 15.9), 0.77, walnut, 0.98);
rod(spatula, v(0, 1.3, 7.1), v(0, 1.32, 8), 0.81, brass);
ball(spatula, 0, 1.43, 15.9, 0.98, 0.96, 0.72, walnut);
spatula.rotation.y = 0.73;
batch(spatula);
const berryTex = makeTex(256, 256, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#e94728");
  g.addColorStop(0.35, "#e53620");
  g.addColorStop(0.72, "#c92519");
  g.addColorStop(1, "#fa6241");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  for (let j = 0; j < 9; j++)
    for (let i = 0; i < 14; i++) {
      let x = (i + (j % 2) * 0.5) * 18.3 + rand() * 4,
        y = 12 + j * 27 + rand() * 7;
      c.fillStyle = "#b72b1b";
      c.beginPath();
      c.ellipse(x, y, 2.4, 4.2, 0.13, 0, TAU);
      c.fill();
      c.fillStyle = "#f6b669";
      c.beginPath();
      c.ellipse(x + 0.25, y - 0.8, 1.35, 2.7, 0.12, 0, TAU);
      c.fill();
    }
});
function sectionTexture(banana) {
  return makeTex(192, 192, (c) => {
    let g = c.createRadialGradient(96, 92, 3, 96, 96, 99);
    for (const [n, k] of banana
      ? [
          [0, "#e6bf7c"],
          [0.2, "#f3da9d"],
          [0.8, "#ffebaf"],
          [1, "#e9c788"]
        ]
      : [
          [0, "#fff0c3"],
          [0.32, "#ffc5a0"],
          [0.7, "#ed6c4e"],
          [0.95, "#d92d21"],
          [1, "#bc281d"]
        ])
      g.addColorStop(n, k);
    c.fillStyle = g;
    c.fillRect(0, 0, 192, 192);
    for (let i = 0; i < 180; i++) {
      const a = rand() * TAU,
        r = rand() * 85;
      c.strokeStyle = banana ? "rgba(188,147,89,.16)" : "rgba(255,221,169,.39)";
      c.lineWidth = rand() * 1.5 + 0.5;
      c.beginPath();
      c.moveTo(96 + Math.cos(a) * r, 94 + Math.sin(a) * r);
      c.lineTo(
        96 + Math.cos(a + 0.01) * (r + rand() * 17 + 3),
        94 + Math.sin(a + 0.01) * (r + rand() * 14 + 3)
      );
      c.stroke();
    }
    if (banana)
      for (let i = 0; i < 12; i++) {
        let a = ((i % 3) * TAU) / 3 + 0.3 + rand() * 0.33,
          r = 5 + rand() * 19;
        c.fillStyle = "#b8925e";
        c.beginPath();
        c.ellipse(96 + Math.cos(a) * r, 96 + Math.sin(a) * r, 2.3, 1.2, a, 0, TAU);
        c.fill();
      }
  });
}
const berrySkin = mat(0xffffff, 0.37, 0, { map: berryTex }),
  berryFace = mat(0xffffff, 0.58, 0, { map: sectionTexture(false) }),
  bananaFace = mat(0xffffff, 0.66, 0, { map: sectionTexture(true) }),
  bananaSkin = mat(0xf4daa0, 0.64),
  leaf = mat(0x638144, 0.77, 0, { side: T.DoubleSide });
function fruit(kind, whole = false) {
  const g = new T.Group();
  if (kind === "berry") {
    const sides = whole ? 26 : 18;
    const berryProfile = (t) => Math.pow(Math.sin(PI * t), 0.64) * (0.62 + 0.77 * t);
    const q = param(
      g,
      sides,
      18,
      (u, t) => {
        const a = whole ? TAU * u : u * PI + PI / 2,
          r = 1.71 * berryProfile(1 - t);
        return [Math.sin(a) * r, 1.98 - 4.25 * t, Math.cos(a) * r * 0.83];
      },
      berrySkin
    );
    q.material.side = T.DoubleSide;
    if (!whole) {
      let pos = [],
        uv = [],
        ix = [];
      for (let i = 0; i <= 32; i++) {
        let t = i / 32,
          r = 1.71 * berryProfile(1 - t);
        for (let s of [-1, 1]) {
          pos.push(s * r, 1.98 - 4.25 * t, 0.018);
          uv.push(0.5 + (s * r) / 3.62, 1 - t);
        }
        if (i < 32) {
          let k = 2 * i;
          ix.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
        }
      }
      let geom = new T.BufferGeometry();
      geom.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      geom.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
      geom.setIndex(ix);
      geom.computeVertexNormals();
      mesh(g, geom, berryFace);
    }
    if (whole) {
      for (let i = 0; i < 5; i++) {
        const a = (i * TAU) / 5;
        let l = ball(g, Math.sin(a) * 0.56, 1.65, Math.cos(a) * 0.52, 0.34, 0.17, 0.88, leaf);
        l.rotation.y = a;
        l.rotation.x = 0.22;
      }
      rod(g, v(0, 1.7, 0), v(0.15, 2.4, -0.18), 0.13, leaf, 0.09);
    }
  } else {
    const q = cyl(g, 0, 0, 0, 1.68, 1.73, 1.04, bananaSkin, 28);
    q.scale.z = 0.86;
    for (const s of [-1, 1]) {
      const disk = mesh(g, new T.CircleGeometry(1.665, 28), bananaFace, 0, s * 0.526, 0);
      disk.rotation.x = (-s * PI) / 2;
      disk.scale.y = 0.86;
    }
  }
  return g;
}
const berrySource = v(-18, 0, -21),
  bananaSource = v(1.5, 0, -24),
  fruitBowls = [],
  fruitStock = [[], []];
function fruitBowl(loc, kind, col) {
  const r = kind === "berry" ? 8.0 : 7.2,
    g = bowl(counter, loc.x, 0.1, loc.z, r, 5.4, col);
  ring(g, 0, 4.86, 0, r * 0.967, 0.105, cream);
  shade(g, 0, 0.021, 0, r * 2.6, r * 2.3);
  for (let i = 0; i < 34; i++) {
    let layer = Math.floor(i / 13),
      a = (i % 13) * 2.4 + layer,
      rr = Math.sqrt(((i % 13) + 0.6) / 13) * (r - 1.9) * (1 - 0.15 * layer);
    const b = fruit(kind, kind === "berry" && i % 3 === 0 && i < 26);
    b.position.set(Math.sin(a) * rr, 3.3 + layer * 1.62 + rand() * 0.8, Math.cos(a) * rr);
    b.rotation.set(
      kind === "berry" ? -0.38 - rand() * 1.15 : rand() * 0.9,
      rand() * TAU,
      rand() * 1.3 - 0.65
    );
    g.add(b);
    if (i >= 26) fruitStock[kind === "berry" ? 0 : 1].push(b);
  }
  fruitBowls.push(g);
  return g;
}
fruitBowl(berrySource, "berry", celadon);
fruitBowl(bananaSource, "banana", cream);
const bagHome = v(30.5, 3.1, -15),
  bag = group(scene, ...bagHome.toArray());
bag.rotation.set(0.07, -0.4, -1.08);
lathe(
  bag,
  0,
  0,
  0,
  [
    [0.45, -5.3],
    [0.9, -4.3],
    [1.7, -1],
    [2.85, 3.1],
    [3.24, 6.9],
    [2.7, 8.4],
    [0.85, 9.2],
    [0.72, 9.7],
    [1.7, 10.7],
    [2.2, 11.8]
  ],
  0xffffe8,
  36
);
lathe(
  bag,
  0,
  0,
  0,
  [
    [0.32, -7.5],
    [0.34, -7.13],
    [0.83, -4.8],
    [1.05, -3.75]
  ],
  steel,
  22
);
ring(bag, 0, 9.5, 0, 0.89, 0.3, 0xbf6652);
batch(bag);
const wrapMaterials = [false, true].map((green) =>
  mat(0xffffff, 0.91, 0, {
    side: T.DoubleSide,
    map: makeTex(256, 256, (c) => {
      c.fillStyle = "#f6e9ce";
      c.fillRect(0, 0, 256, 256);
      if (!green) {
        for (let i = 0; i < 256; i += 32) {
          c.fillStyle = "rgba(192,71,56,.55)";
          c.fillRect(i, 0, 14, 256);
          c.fillRect(0, i, 256, 14);
          c.fillStyle = "rgba(147,72,53,.23)";
          c.fillRect(i + 19, 0, 1, 256);
          c.fillRect(0, i + 19, 256, 1);
        }
      } else {
        for (let y = 0; y < 5; y++)
          for (let x = 0; x < 5; x++) {
            let xx = x * 56 + (y % 2) * 23,
              yy = y * 54;
            c.strokeStyle = "#749383";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(xx - 4, yy + 10);
            c.quadraticCurveTo(xx + 4, yy + 4, xx + 5, yy - 10);
            c.stroke();
            for (let j = 0; j < 3; j++) {
              c.fillStyle = j === 1 ? "#bd8a73" : "#91a798";
              c.beginPath();
              c.ellipse(xx + 2 + j, yy + 5 - j * 5, 2.1, 4.7, j % 2 ? 0.8 : -0.6, 0, TAU);
              c.fill();
            }
          }
      }
    })
  })
);
const paperChoices = [];
for (let i = 0; i < 2; i++) {
  const g = group(scene, 40 + i * 5, 0.36 + i * 0.3, -15 + i * 6);
  g.rotation.y = -0.24 + i * 0.16;
  const p = box(g, 0, 0.13, 0, 11 + i * 3, 0.22, 17, wrapMaterials[i]);
  paperChoices.push(g);
}
// A folded towel with a soft rolled edge drapes over the counter.
const towel = group(counter, -29, 0.15, 28);
towel.rotation.y = -0.19;
const towelGeo = param(
  towel,
  28,
  40,
  (u, t) => {
    let h = 0.36 + 0.31 * Math.sin(u * PI * 7 + 0.7 * Math.sin(t * 5)) * (0.4 + t);
    return [(u - 0.5) * 17, h - Math.max(0, t - 0.84) * 15, (t - 0.5) * 23];
  },
  linen
);
towelGeo.material.side = T.DoubleSide;
function herbPot(x, z, r) {
  let g = group(counter, x, 0.05, z);
  lathe(
    g,
    0,
    0,
    0,
    [
      [0.05, 0],
      [r * 0.65, 0],
      [r * 0.91, r * 1.4],
      [r, r * 1.42],
      [r, r * 1.63],
      [r * 0.88, r * 1.63]
    ],
    0xc77e59
  );
  cyl(g, 0, r * 1.5, 0, r * 0.87, r * 0.8, 0.24, 0x7f6249);
  for (let j = 0; j < 22; j++) {
    let a = rand() * TAU,
      l = r * (0.6 + rand()),
      yy = r * (1.9 + rand() * 1.65),
      xx = Math.sin(a) * l,
      zz = Math.cos(a) * l;
    rod(g, v(0, r * 1.5, 0), v(xx, yy, zz), 0.1, leaf);
    for (let k = 0; k < 3; k++) {
      let q = ball(
        g,
        xx * (0.65 + k * 0.16),
        yy - (2 - k) * 0.8,
        zz * (0.65 + k * 0.16),
        0.8 + rand() * 0.45,
        0.22,
        1.4 + rand() * 0.5,
        [0x5d8247, 0x799b58, 0x87a262][j % 3]
      );
      q.rotation.set(0.26, a + k * 1.8, 0.22);
    }
  }
  shade(counter, x, 0.02, z, r * 3, r * 3);
}
herbPot(-46, -22, 3.6);
herbPot(53, -42, 3.5);
const creamJug = bowl(counter, -33, 0, -18, 4.0, 7.3, cream);
ring(creamJug, 0, 6.9, 0, 3.9, 0.12, celadon);
const whisk = group(creamJug, 0, 6.7, 0);
whisk.rotation.z = -0.36;
rod(whisk, v(0, -3, 0), v(0, 5, 0), 0.57, walnut, 0.61);
for (let i = 0; i < 6; i++) {
  const a = (PI * i) / 6;
  path(
    whisk,
    [
      [0, 4, 0],
      [Math.sin(a) * 1.8, 7.4, Math.cos(a) * 1.8],
      [Math.sin(a) * 1.3, 10.2, Math.cos(a) * 1.3],
      [0, 10.9, 0],
      [-Math.sin(a) * 1.3, 10.2, -Math.cos(a) * 1.3],
      [-Math.sin(a) * 1.8, 7.4, -Math.cos(a) * 1.8],
      [0, 4, 0]
    ],
    0.105,
    steel,
    22
  );
}
const trayHome = v(70, 1.0, -35),
  tray = group(scene, ...trayHome.toArray());
slab(tray, 0, 0, 0, 31, 1.55, 22, 3, woodDark, 0.35);
slab(tray, 0, 0.75, 0, 28, 0.42, 19.2, 2, 0xe9c594, 0.14);
for (let s of [-1, 1])
  path(
    tray,
    [
      [s * 13.6, 0.7, -4.3],
      [s * 14.2, 2.6, -4.2],
      [s * 14.2, 2.6, 4.2],
      [s * 13.6, 0.7, 4.3]
    ],
    0.37,
    brass
  );
// The small standing menu uses the same original illustration as the hanging sign.
const menuHome = group(scene, 46, 0, -12.5);
menuHome.rotation.y = -0.27;
const menuBoard = group(menuHome, 0, 10.5, 0);
menuBoard.rotation.x = -0.13;
slab(menuHome, 0, 0.7, 0, 17, 1.35, 5.1, 1, walnut, 0.26);
box(menuBoard, 0, 0, 0, 15, 20.4, 0.9, walnut);
box(menuBoard, 0, 0, 0.51, 13.9, 19.1, 0.19, 0xf5e5bd);
const stamp = new T.CanvasTexture(document.querySelector("#emblem"));
stamp.colorSpace = T.SRGBColorSpace;
const print = mesh(
  menuBoard,
  new T.PlaneGeometry(13.3, 14.2),
  new T.MeshBasicMaterial({ map: stamp, transparent: true, depthWrite: false }),
  0,
  0.6,
  0.65
);
print.castShadow = false;
for (let s of [-1, 1]) {
  let yy = s * 8.25;
  box(menuBoard, 0, yy, 0.66, 9.2, 0.12, 0.02, 0xc0815e);
  for (let t of [-1, 1]) {
    ball(menuBoard, t * 5.5, yy, 0.68, 0.24, 0.24, 0.06, brass);
  }
}
batch(menuHome);
const emblemTex = makeTex(220, 96, (c) => {
  c.fillStyle = "#628377";
  c.beginPath();
  c.roundRect(3, 4, 214, 88, 40);
  c.fill();
  c.lineWidth = 3;
  c.strokeStyle = "#efe2bd";
  c.stroke();
  c.beginPath();
  c.ellipse(110, 48, 73, 35, 0, 0, TAU);
  c.lineWidth = 1.3;
  c.stroke();
  c.save();
  c.translate(110, 45);
  c.scale(0.78, 0.78);
  c.fillStyle = "#f5ddac";
  c.beginPath();
  c.moveTo(-19, -9);
  c.bezierCurveTo(-27, -23, -9, -27, 0, -18);
  c.bezierCurveTo(22, -33, 34, -14, 15, 11);
  c.quadraticCurveTo(2, 29, -2, 26);
  c.quadraticCurveTo(-13, 14, -19, -9);
  c.fill();
  c.fillStyle = "#698777";
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3 - i; j++) {
      c.beginPath();
      c.ellipse(-11 + j * 10 + i * 5, -10 + i * 10, 1.5, 2.3, 0, 0, TAU);
      c.fill();
    }
  c.fillStyle = "#d3c49a";
  c.beginPath();
  c.moveTo(-19, -19);
  c.lineTo(-4, -19);
  c.lineTo(-8, -29);
  c.lineTo(1, -22);
  c.lineTo(8, -30);
  c.lineTo(7, -21);
  c.lineTo(19, -18);
  c.lineTo(3, -15);
  c.closePath();
  c.fill();
  c.restore();
});
const label = mesh(
  stove,
  new T.PlaneGeometry(6.8, 2.9),
  new T.MeshStandardMaterial({
    map: emblemTex,
    transparent: true,
    roughness: 0.48,
    metalness: 0.22,
    depthWrite: false
  }),
  -2.4,
  4.8,
  13.47
);
label.castShadow = false;
// A bowl supported in both hands keeps the greengrocer part of the work.
const heldBerries = bowl(chef.body, 0, 82.1, 25.3, 10.5, 6.2, celadon);
ring(heldBerries, 0, 5.45, 0, 10.1, 0.15, cream);
for (let i = 0; i < 23; i++) {
  let b = fruit("berry", i % 3 !== 1),
    a = i * 2.399,
    r = Math.sqrt(((i % 15) + 0.5) / 15) * 8.1;
  b.position.set(Math.cos(a) * r, 5.3 + (i > 14 ? 2.1 : 0), Math.sin(a) * r);
  b.rotation.set(rand() - 0.8, rand() * TAU, rand() - 0.5);
  heldBerries.add(b);
}
batch(heldBerries);
chef.pose(0, v(-8.1, 84.5, 24.7));
chef.pose(1, v(8.3, 84.5, 24.7));
const jar = group(counter, -47, 0, 7.2);
lathe(
  jar,
  0,
  0,
  0,
  [
    [0.01, 0],
    [2.5, 0.1],
    [3.15, 0.7],
    [3.15, 6.6],
    [2.9, 7.65],
    [1.45, 8.45],
    [1.4, 9.4]
  ],
  mat(0xa65f29, 0.18, 0.08),
  48
);
cyl(jar, 0, 9.55, 0, 1.65, 1.65, 0.9, brass);
lathe(
  jar,
  0,
  0,
  0,
  [
    [3.17, 2.25],
    [3.18, 5.53]
  ],
  0xf1dfb8,
  48
);
ring(jar, 0, 2.63, 0, 3.17, 0.075, 0xb78653);
ring(jar, 0, 5.2, 0, 3.17, 0.075, 0xb78653);
function ceramicSprig(p, x, z, a) {
  const sprig = group(p, x, 1.69, z);
  sprig.rotation.y = a;
  for (let side of [-1, 1])
    for (let j = 0; j < 3; j++) {
      const petal = ball(
        sprig,
        side * (0.39 + j * 0.25),
        j * 0.07,
        j * 0.64 - 0.7,
        0.18,
        0.045,
        0.49,
        0x7d9e88
      );
      petal.rotation.y = side * 0.63;
    }
  ball(sprig, 0, 0.06, 0.23, 0.37, 0.07, 0.46, 0xc7876e);
}
for (let i = 0; i < 3; i++) {
  const a = (i * TAU) / 3 + 0.25;
  ceramicSprig(servePlate, Math.cos(a) * 11.65, Math.sin(a) * 11.65, -a);
}

batch(tray);
batch(pan);
for (const o of [mixBowl, servePlate, stove]) {
  scene.attach(o);
  batch(o);
}
fruitBowls.forEach((b, i) => {
  scene.attach(b);
  for (const f of fruitStock[i]) b.remove(f);
  batch(b);
  for (const f of fruitStock[i]) {
    b.add(f);
    batch(f);
  }
});
batch(counter);
