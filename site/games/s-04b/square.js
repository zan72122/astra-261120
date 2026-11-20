"use strict";
const plaza = group(),
  floorY = -86;
const paving = makeTex(512, 512, (c) => {
  c.fillStyle = "#b9a890";
  c.fillRect(0, 0, 512, 512);
  for (let j = 0; j < 12; j++) {
    for (let i = -1; i < 5; i++) {
      let x = i * 128 + (j % 2) * 64,
        y = (j * 512) / 12,
        shade = Math.round(rand() * 15);
      c.fillStyle = "rgb(" + [220 - shade, 206 - shade, 180 - shade] + ")";
      c.fillRect(x + 1, y + 1, 126, 512 / 12 - 2);
      c.fillStyle = "#f2e4ce";
      c.fillRect(x + 2, y + 1, 124, 1);
    }
  }
});
paving.wrapS = paving.wrapT = T.RepeatWrapping;
paving.repeat.set(15, 15);
box(plaza, 0, -88.03, -600, 3400, 4, 3300, mat(0xefddc6, 0.92, 0, { map: paving }));
const green = 0x6f938a,
  deepGreen = 0x49695e,
  stone = 0xedcd9d,
  brick = 0xbb846b,
  roof = 0x697e78;
function arch(p, x, y, z, w, h, col) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - w / 2);
  s.absarc(0, h - w / 2, w / 2, 0, PI, false);
  s.lineTo(-w / 2, 0);
  return mesh(
    p,
    new T.ExtrudeGeometry(s, { depth: 2, bevelEnabled: false, curveSegments: 13 }),
    col,
    x,
    y,
    z
  );
}
function archWindow(p, x, y, z, w, h) {
  arch(p, x, y - 1, z - 1, w + 7, h + 6, 0xdebb8d);
  arch(p, x, y, z + 2, w, h, deepGreen);
  arch(p, x, y + 2, z + 4, w - 7, h - 8, 0x91b4b2);
  box(p, x, y + (h - w / 2) / 2, z + 8, 2.2, h - w / 2, 2.3, green);
  box(p, x, y + h - w / 2, z + 8, w - 2, 2.7, 2.4, deepGreen);
  box(p, x, y + h * 0.34, z + 7, w - 2, 2, 2, green);
  box(p, x, y - 2, z + 4, w + 12, 4, 10, stone);
  for (let i = 0; i < 9; i++) {
    const a = ((i + 0.5) * PI) / 9,
      xx = x + Math.cos(a) * (w / 2 + 2),
      yy = y + h - w / 2 + Math.sin(a) * (w / 2 + 2);
    let q = box(p, xx, yy, z + 2, 6.3, (w * PI) / 19, 4, stone);
    q.rotation.z = a;
  }
}
function clockFace(p, x, y, z, r) {
  const g = group(p, x, y, z);
  g.rotation.x = PI / 2; // clock dial faces the plaza
  cyl(g, 0, 0.5, 0, r + 2, r + 2, 3, deepGreen);
  cyl(g, 0, -1.4, 0, r, r, 1, cream);
  ring(g, 0, -2, 0, r, 0.8, brass);
  for (let i = 0; i < 12; i++) {
    let a = (i * PI) / 6;
    const q = box(g, Math.sin(a) * r * 0.81, -2.2, Math.cos(a) * r * 0.81, 1, 0.5, r * 0.13, deepGreen);
    q.rotation.y = a;
  }
  rod(g, v(0, -2.8, 0), v(r * 0.48, -2.8, r * 0.37), 0.79, deepGreen);
  rod(g, v(0, -2.9, 0), v(-r * 0.61, -2.9, r * 0.39), 0.53, deepGreen);
  ball(g, 0, -3.1, 0, 1.4, 0.5, 1.4, brass);
  g.rotation.x = -PI / 2;
}
function roofGable(p, x, y, z, w, h, d, c) {
  const s = new T.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(0, h);
  s.lineTo(w / 2, 0);
  s.closePath();
  mesh(p, new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }), c, x, y, z);
}
const station = group(plaza, -38, -86, -575);
box(station, 0, 68, 0, 424, 136, 85, 0xe8c99e);
box(station, 0, 10, 42, 430, 20, 4, 0xbfad94);
box(station, 0, 133, 2, 438, 9, 97, 0xf3dfb8);
for (let x = -200; x <= 200; x += 66) {
  archWindow(station, x, 16, 43, 37, 83);
  box(station, x - 29, 65, 44, 8, 126, 6, 0xdfc3a2);
  for (let k = 0; k < 8; k++) {
    box(station, x - 29, k * 14 + 6, 47, 9, 2, 2, stone);
  }
}
roofGable(station, 0, 138, -50, 450, 43, 102, roof);
for (const s of [-1, 1]) {
  const beam = box(station, s * 112, 160, 52, 230, 4.8, 6, deepGreen);
  beam.rotation.z = -s * 0.19;
}
box(station, 0, 113, 48, 84, 79, 10, 0xf0d5ad);
roofGable(station, 0, 151, 38, 100, 32, 21, 0xf3dfb7);
for (const s of [-1, 1]) {
  const q = box(station, s * 25, 168, 59, 61, 4, 9, green);
  q.rotation.z = -s * 0.57;
}
clockFace(station, 0, 143, 60, 17);
for (const x of [-182, -116, 116, 182]) {
  box(station, x, 85, 64, 51, 3.5, 30, green);
  for (const s of [-1, 1]) rod(station, v(x + s * 23, 67, 48), v(x + s * 23, 84, 78), 1.2, deepGreen);
}
// Distant low townhouses border the station square.
for (let i = 0; i < 10; i++) {
  const x = -1000 + i * 207,
    h = 94 + rand() * 76,
    col = [0xc9b8a1, 0xe5c9a9, 0xdcb6a5, 0xc6c9ad][i % 4];
  box(plaza, x, floorY + h / 2, -1690, 174, h, 90, col);
  roofGable(plaza, x, floorY + h, -1747, 187, 53, 112, 0x87958b);
  for (let j = -1; j < 2; j++) {
    box(plaza, x + j * 47, floorY + h - 33, -1643, 25, 35, 3, 0x728f8c);
    box(plaza, x + j * 47, floorY + h - 33, -1640, 2, 35, 3, stone);
  }
}
const bark = 0x765f49;
const crowns = Array.from({ length: 3 }, (_, variant) => {
  const tx = makeTex(256, 256, (c) => {
    const leaves = [];
    for (let n = 0; n < 950; n++) {
      const a = rand() * TAU,
        r = Math.sqrt(rand()),
        edge = 1 + 0.07 * Math.sin(5 * a + variant) + 0.05 * Math.cos(9 * a);
      let x = 128 + Math.cos(a) * r * 112 * edge,
        y = 128 + Math.sin(a) * r * 100 * edge;
      leaves.push({
        x,
        y,
        r: 3.4 + rand() * 6.3,
        a: rand() * PI,
        shade: rand() * 0.23 + 0.3 * (1 - y / 256) + 0.22 * (1 - r) + 0.19 * (1 - x / 256)
      });
    }
    leaves.sort((a, b) => b.y - a.y);
    for (const l of leaves) {
      let f = l.shade;
      c.fillStyle = "rgb(" + [58 + 104 * f, 86 + 100 * f, 50 + 65 * f].map(Math.round) + ")";
      c.beginPath();
      c.ellipse(l.x, l.y, l.r, l.r * 0.55, l.a, 0, TAU);
      c.fill();
      if (l.r > 8) {
        c.strokeStyle = "rgba(227,226,151,.23)";
        c.lineWidth = 0.7;
        c.beginPath();
        c.moveTo(l.x - l.r * 0.62 * Math.cos(l.a), l.y - l.r * 0.62 * Math.sin(l.a));
        c.lineTo(l.x + l.r * 0.56 * Math.cos(l.a), l.y + l.r * 0.56 * Math.sin(l.a));
        c.stroke();
      }
    }
  });
  return new T.MeshBasicMaterial({
    map: tx,
    color: [0xf6f2cf, 0xfff6cc, 0xe7e8cb][variant],
    side: T.DoubleSide,
    alphaTest: 0.43
  });
});
function tree(p, x, z, H, R) {
  const t = group(p, x, floorY, z);
  const forkY = H * 0.54;
  rod(t, v(0, 0, 0), v(1.4, forkY, 1), H * 0.022, bark, H * 0.013);
  let forks = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + rand() * 0.45,
      r = R * (0.48 + rand() * 0.31),
      tip = v(Math.cos(a) * r, H * (0.72 + rand() * 0.17), Math.sin(a) * r),
      middle = v(tip.x * 0.53, H * (0.57 + rand() * 0.1), tip.z * 0.52);
    rod(t, v(1, H * (0.38 + rand() * 0.17), 1), middle, H * 0.012, bark, H * 0.008);
    rod(t, middle, tip, H * 0.008, bark, H * 0.0035);
    forks.push(tip);
  }
  for (let i = 0; i < 73; i++) {
    const a = rand() * TAU,
      r = Math.sqrt(rand()) * R,
      s = R * (0.48 + rand() * 0.36),
      xx = Math.cos(a) * r,
      zz = Math.sin(a) * r,
      yy = H * 0.77 + R * (0.83 * Math.sqrt(Math.max(0, 1 - (r * r) / (R * R))) + rand() * 0.59 - 0.29);
    const card = mesh(t, new T.PlaneGeometry(s * 1.28, s), crowns[i % 3], xx, yy, zz);
    card.rotation.set((rand() - 0.5) * 0.29, (rand() - 0.5) * 1.05, (rand() - 0.5) * 0.66);
  }
  shade(p, x, floorY + 0.15, z, R * 2.45, R * 1.75);
}
tree(plaza, -185, -299, 179, 70);
tree(plaza, 190, -350, 212, 78);
tree(plaza, 325, -500, 175, 68);
tree(plaza, -336, -530, 202, 83);
for (let i = 0; i < 7; i++)
  if (i !== 3 && i !== 4) tree(plaza, -765 + i * 255, -1080, 170 + rand() * 65, 64 + rand() * 20);
function bench(p, x, z) {
  const g = group(p, x, floorY, z);
  for (const side of [-1, 1]) {
    let xx = side * 47;
    for (const zz of [-11, 12]) rod(g, v(xx, 0, zz), v(xx, 37, zz * 0.74), 2.1, deepGreen);
    rod(g, v(xx, 34, -8), v(xx, 72, -17), 1.8, deepGreen);
    path(
      g,
      [
        [xx, 34, -10],
        [xx, 48, -7],
        [xx, 49, 10],
        [xx, 44, 12],
        [xx, 33, 11]
      ],
      1.35,
      deepGreen
    );
  }
  for (let n = 0; n < 4; n++) {
    box(g, 0, 35, -11 + n * 6.6, 116, 3.2, 5.95, woodDark);
  }
  for (let n = 0; n < 3; n++) {
    const q = box(g, 0, 49 + n * 8, -14 - n * 0.95, 116, 6.7, 3.2, woodDark);
    q.rotation.x = -0.14;
    for (let s of [-1, 1]) ball(g, s * 47, 49 + n * 8, -12 - n, 0.65, 0.65, 0.38, brass);
  }
  shade(p, x, floorY + 0.2, z, 150, 56);
  return g;
}
bench(plaza, 50, -210);
bench(plaza, -161, -277);
function lamp(x, z) {
  const g = group(plaza, x, floorY, z);
  lathe(
    g,
    0,
    0,
    0,
    [
      [11, 0],
      [11, 3],
      [8, 5],
      [7, 15],
      [4, 19],
      [3, 29],
      [2.5, 145],
      [4, 146],
      [4, 150]
    ],
    deepGreen,
    18
  );
  lathe(
    g,
    0,
    150,
    0,
    [
      [3, 0],
      [8, 4],
      [10, 24],
      [8, 27],
      [2, 31]
    ],
    0xf4dfac,
    6
  );
  lathe(
    g,
    0,
    173,
    0,
    [
      [11, 0],
      [12, 2],
      [5, 6],
      [2, 10],
      [0, 14]
    ],
    deepGreen,
    6
  );
  for (let j = 0; j < 6; j++) {
    const a = (j * PI) / 3;
    rod(
      g,
      v(7 * Math.sin(a), 154, 7 * Math.cos(a)),
      v(10 * Math.sin(a), 174, 10 * Math.cos(a)),
      0.75,
      deepGreen
    );
  }
}
lamp(-84, -325);
lamp(195, -277);
for (let i = -5; i <= 5; i++) {
  let x = i * 71;
  box(plaza, x, -54, -407, 4, 63, 4, deepGreen);
  ball(plaza, x, -21, -407, 3, 3.8, 3, deepGreen);
  if (i < 5) {
    for (let n = 0; n < 2; n++) box(plaza, x + 35, -37 - n * 23, -407, 71, 2.7, 2.5, green);
  }
}
const dad = makePerson(scene, 13, -99, -206, "dad", 0.18, 0.98),
  mum = makePerson(scene, 52, -99, -208, "mum", -0.35, 0.94);
// Seated posture places the feet on the paving, with knees forward of the bench.
for (const person of [dad, mum]) {
  person.body.position.y = -8;
  for (const s of [-1, 1]) {
    rod(
      plaza,
      v(person.root.position.x + s * 6, -43, -205),
      v(person.root.position.x + s * 7, -43, -181),
      5.6,
      person === dad ? 0x606b65 : 0xb5a886
    );
    ball(
      plaza,
      person.root.position.x + s * 7,
      -43,
      -181,
      5.48,
      5.1,
      5.4,
      person === dad ? 0x606b65 : 0xb5a886
    );
    rod(
      plaza,
      v(person.root.position.x + s * 7, -43, -181),
      v(person.root.position.x + s * 7, -80, -179),
      3.9,
      person === dad ? 0x606b65 : skinMat
    );
    ball(plaza, person.root.position.x + s * 7, -82, -175, 4.4, 3.2, 7, 0x6a493a);
  }
}
const familyTable = group(plaza, 52, -86, -150);
cyl(familyTable, 0, 64, 0, 36, 36, 3.6, woodDark, 80);
cyl(familyTable, 0, 33, 0, 3.4, 4.1, 60, deepGreen);
lathe(
  familyTable,
  0,
  0,
  0,
  [
    [18, 0],
    [18, 2],
    [8, 4],
    [4, 10]
  ],
  deepGreen
);
shade(plaza, 52, -85.8, -150, 87, 74);
const chef = makePerson(scene, -51, -86, -73, "chef", 0.8, 1.02),
  girl = makePerson(scene, 45, -84, -51, "girl", -0.52, 0.855);
const windowFrame = group(scene, 0, 0, -103),
  sash = group(windowFrame);
for (const x of [-81, 83]) {
  box(windowFrame, x, 36, 0, 6, 150, 8, 0x799685);
  box(windowFrame, x - 1, 36, 4.4, 1.2, 150, 1.2, 0xc3c6a3);
}
box(windowFrame, 0, -1, -1, 170, 3.5, 9, woodDark);
for (const x of [-77, 76]) box(sash, x, 36, 0, 2.9, 72, 2.2, 0xb2ad8a);
box(sash, 0, 1.2, 0, 153, 1.8, 2, 0xaa9c79);
box(sash, 0, 72, 0, 153, 2.2, 2.2, 0xb2ad8a);
box(windowFrame, 0, -43, -1.5, 167, 83, 4, 0x759480);
box(windowFrame, 0, -5, 2, 168, 4, 2.2, 0xb7bc9b);
for (let x = -78; x < 83; x += 13) box(windowFrame, x, -44, 0.85, 0.64, 70, 0.55, 0x637f6f);
box(sash, -22, 36, 0, 1.45, 72, 1.85, 0xb2ad8a);
const glass = mat(0xc9e2d6, 0.13, 0.08, { transparent: true, opacity: 0.042, depthWrite: false });
const pane = box(sash, 0, 36, 0, 151, 70, 0.24, glass);
pane.castShadow = false;
const latch = group(sash, 36, 4.8, 2.7);
slab(latch, 0, 0, 0, 6, 1.1, 3, 1, brass);
path(
  latch,
  [
    [-2, 0, 0.7],
    [-2, 3, 0.7],
    [2, 3, 0.7],
    [2, 0, 0.7]
  ],
  0.58,
  brass
);
// Recessed timber doors, divided panes, and brick courses catch the oblique sun.
station.rotation.y = 0.12;
station.scale.set(2.24, 2.05, 2.12);
station.position.set(-61, -86, -1560);
const brickTex = makeTex(512, 256, (c) => {
  c.fillStyle = "#d2b79b";
  c.fillRect(0, 0, 512, 256);
  for (let j = 0; j < 20; j++)
    for (let i = -1; i < 9; i++) {
      let value = rand() * 21;
      c.fillStyle = "rgb(" + [197 + value, 151 + value, 118 + value].map(Math.round) + ")";
      c.fillRect(i * 64 + (j % 2) * 32 + 1, j * 12.8 + 1, 62, 11.3);
    }
});
const brickwork = mat(0xffffff, 0.93, 0, { map: brickTex });
box(station, 0, 67, 42, 422, 128, 1.1, brickwork);
for (let x = -200; x <= 200; x += 66) {
  for (let s of [-1, 1]) {
    box(station, x + s * 7.4, 27, 51.8, 11.6, 23, 1.2, 0x537c70);
    box(station, x + s * 7.4, 27, 52.6, 8.5, 18.5, 0.8, 0x688e7c);
  }
  for (let y of [43, 56, 69]) box(station, x, y, 51, 34, 1.3, 1.7, 0x668a7e);
  for (let s of [-1, 1]) box(station, x + s * 8, 60, 51, 1.1, 42, 1.7, 0x65877a);
}

for (let i = 0; i < 2; i++) box(station, 0, 119 + i * 5, 44, 429, 2.7, 7, stone);
for (let i = -9; i <= 9; i++) {
  const x = i * 23,
    h = 43 * (1 - Math.abs(x) / 225);
  box(station, x, 137 + h / 2, -1, 1.25, h, 103, 0x72877c);
}
for (let x of [-170, 160]) {
  cyl(station, x, 159, -24, 6, 6, 48, 0xb8876d, 4);
  box(station, x, 181, -24, 14, 4, 14, stone);
}
function flowerBed(p, x, y, z, w) {
  const g = group(p, x, y, z);
  slab(g, 0, 0, 0, w, 8, 13, 1, 0xad7354, 0.45);
  slab(g, 0, 3.6, 0, w + 2, 2.5, 15, 1, 0xc38a67, 0.4);
  box(g, 0, 5, 0, w - 2, 0.6, 11, 0x71523d);
  for (let i = 0; i < Math.ceil(w * 0.85); i++) {
    let xx = (rand() - 0.5) * (w - 4),
      zz = (rand() - 0.5) * 8,
      yy = 7 + rand() * 5;
    let leaf = ball(g, xx, yy, zz, 2.6, 2.1, 2.3, [0x658849, 0x779349, 0x557944][i % 3]);
    if (i % 2 === 0) {
      for (let j = 0; j < 3; j++)
        ball(
          g,
          xx + Math.cos(j * 2.09),
          yy + 2.5 + j * 0.24,
          zz + Math.sin(j * 2.09),
          1.35,
          1.3,
          1.25,
          [0xc56452, 0xcb7361, 0xe79980][i % 3]
        );
    }
  }
}
flowerBed(plaza, -79, -76, -249, 49);
flowerBed(plaza, 120, -76, -223, 43);
for (let x of [-135, -2, 131]) flowerBed(station, x, 12, 54, 40);
const bike = group(plaza, -129, -86, -419);
bike.rotation.y = -0.19;
for (let x of [-25, 25]) {
  const tire = mesh(bike, new T.TorusGeometry(15, 1.5, 9, 48), darkMetal, x, 16, 0);
  const rim = mesh(bike, new T.TorusGeometry(13.9, 0.48, 6, 48), steel, x, 16, 0);
  for (let i = 0; i < 12; i++) {
    let a = (i * PI) / 6;
    rod(bike, v(x, 16, 0), v(x + 13.9 * Math.cos(a), 16 + 13.9 * Math.sin(a), 0), 0.15, steel);
  }
}
for (let pts of [
  [-25, 16, -4, 14],
  [-25, 16, -10, 36],
  [-10, 36, -4, 14],
  [-4, 14, 15, 35],
  [-10, 36, 15, 35],
  [25, 16, 14, 40]
])
  rod(bike, v(pts[0], pts[1], 0), v(pts[2], pts[3], 0), 0.85, 0x8a9b86);
ball(bike, -10, 38, 0, 4.5, 1, 2.25, walnut);
path(
  bike,
  [
    [14, 38, 0],
    [13, 43, 0],
    [15, 44, 4],
    [18, 44, 5]
  ],
  0.7,
  steel
);

batch(plaza);
batch(sash);
