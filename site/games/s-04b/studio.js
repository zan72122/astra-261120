"use strict";
const T = THREE,
  PI = Math.PI,
  TAU = PI * 2,
  clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
  mix = (a, b, t) => a + (b - a) * t,
  v = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
let seed = 6412;
function rand() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const scene = new T.Scene(),
  cam = new T.PerspectiveCamera(49, 1, 0.55, 3500),
  renderer = new T.WebGLRenderer({
    canvas: document.querySelector("#world"),
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
scene.background = new T.Color(0xc7dfdf);
scene.fog = new T.Fog(0xe6e3d3, 435, 3400);
const materials = new Map(),
  tex = {};
let loadedTextures = 0;
const sourceTextureCount = Object.keys(surfaces).length;
for (const key in surfaces) {
  const t = new T.TextureLoader().load(surfaces[key], () => {
    loadedTextures++;
  });
  t.colorSpace = T.SRGBColorSpace;
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.anisotropy = 4;
  tex[key] = t;
}
function mat(color, rough = 0.72, metal = 0, opts = {}) {
  return new T.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...opts });
}
function m(c) {
  if (typeof c === "object") return c;
  if (!materials.has(c)) materials.set(c, mat(c));
  return materials.get(c);
}
const oak = mat(0xfff1d9, 0.5, 0, { map: tex.oak }),
  woodDark = mat(0xb18a65, 0.63, 0, { map: tex.oak }),
  walnut = mat(0xae7853, 0.48, 0, { map: tex.oak }),
  steel = mat(0xb1b8b5, 0.26, 0.78),
  brass = mat(0xc49a56, 0.33, 0.64),
  cream = mat(0xfff1d1, 0.31, 0.04),
  celadon = mat(0x9bbeb0, 0.29, 0.12),
  darkMetal = mat(0x394348, 0.35, 0.58),
  iron = mat(0xffffff, 0.76, 0.23, { map: tex.iron }),
  linen = mat(0xfffaf0, 0.94, 0, { map: tex.cloth, side: T.DoubleSide }),
  paperMat = mat(0xfff1d2, 0.9, 0, { map: tex.paper, side: T.DoubleSide });
function group(parent = scene, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function mesh(p, geo, material, x = 0, y = 0, z = 0) {
  const a = new T.Mesh(geo, m(material));
  a.position.set(x, y, z);
  a.castShadow = a.receiveShadow = true;
  p.add(a);
  return a;
}
const unitBox = new T.BoxGeometry(),
  unitBall = new T.SphereGeometry(1, 20, 16),
  smallBall = new T.SphereGeometry(1, 10, 7),
  tinyBall = new T.SphereGeometry(1, 8, 5);
function box(p, x, y, z, w, h, d, c) {
  const a = mesh(p, unitBox, c, x, y, z);
  a.scale.set(w, h, d);
  return a;
}
function ball(p, x, y, z, w, h, d, c) {
  const size = Math.max(w, h, d),
    a = mesh(p, size < 1.55 ? tinyBall : size < 4.6 ? smallBall : unitBall, c, x, y, z);
  a.scale.set(w, h, d);
  return a;
}
function cyl(p, x, y, z, rt, rb, h, c, n = 48) {
  return mesh(p, new T.CylinderGeometry(rt, rb, h, n), c, x, y, z);
}
function lathe(p, x, y, z, profile, c, n = 64) {
  return mesh(
    p,
    new T.LatheGeometry(
      profile.map(([r, h]) => new T.Vector2(r, h)),
      n
    ),
    c,
    x,
    y,
    z
  );
}
function ring(p, x, y, z, r, t, c) {
  const a = mesh(p, new T.TorusGeometry(r, t, 8, 72), c, x, y, z);
  a.rotation.x = PI / 2;
  return a;
}
function rod(p, a, b, r, c, r2 = r) {
  const d = b.clone().sub(a),
    obj = cyl(p, 0, 0, 0, r2, r, d.length(), c, 14);
  obj.position.copy(a).addScaledVector(d, 0.5);
  obj.quaternion.setFromUnitVectors(v(0, 1), d.normalize());
  return obj;
}
function path(p, points, r, c, n = 22) {
  return mesh(
    p,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(points.map((a) => (Array.isArray(a) ? v(...a) : a))),
      n,
      r,
      7,
      false
    ),
    c
  );
}
function roundShape(w, h, r) {
  const s = new T.Shape(),
    a = w / 2,
    b = h / 2;
  s.moveTo(-a + r, -b);
  s.lineTo(a - r, -b);
  s.quadraticCurveTo(a, -b, a, -b + r);
  s.lineTo(a, b - r);
  s.quadraticCurveTo(a, b, a - r, b);
  s.lineTo(-a + r, b);
  s.quadraticCurveTo(-a, b, -a, b - r);
  s.lineTo(-a, -b + r);
  s.quadraticCurveTo(-a, -b, -a + r, -b);
  return s;
}
function slab(p, x, y, z, w, h, d, r, c, bevel = 0.22) {
  const geo = new T.ExtrudeGeometry(roundShape(w - 2 * bevel, d - 2 * bevel, r), {
    depth: Math.max(0.04, h - bevel * 2),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 6
  });
  geo.rotateX(-PI / 2);
  return mesh(p, geo, c, x, y - h / 2 + bevel, z);
}
function makeTex(w, h, draw) {
  const a = document.createElement("canvas");
  a.width = w;
  a.height = h;
  draw(a.getContext("2d"), w, h);
  const tx = new T.CanvasTexture(a);
  tx.colorSpace = T.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}
const contactTex = makeTex(128, 128, (c) => {
  let g = c.createRadialGradient(64, 64, 9, 64, 64, 64);
  g.addColorStop(0, "rgba(45,29,14,.65)");
  g.addColorStop(0.55, "rgba(65,42,24,.37)");
  g.addColorStop(1, "rgba(75,44,24,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
});
const shadeMat = new T.MeshBasicMaterial({
  map: contactTex,
  transparent: true,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1
});
function shade(p, x, y, z, w, d) {
  const s = mesh(p, new T.PlaneGeometry(w, d), shadeMat, x, y, z);
  s.rotation.x = -PI / 2;
  s.castShadow = false;
  s.receiveShadow = false;
  return s;
}
// Batch immobile geometry in local space to keep the plaza inexpensive on mobile GPUs.
function batch(root) {
  root.updateWorldMatrix(true, true);
  const inv = root.matrixWorld.clone().invert(),
    sets = new Map();
  root.traverse((o) => {
    if (o.isMesh && !o.material.transparent && !Array.isArray(o.material)) {
      const k = o.material;
      if (!sets.has(k)) sets.set(k, []);
      sets.get(k).push(o);
    }
  });
  for (const [material, list] of sets) {
    if (list.length < 2) continue;
    let pp = [],
      nn = [],
      uu = [],
      ii = [],
      cc = [],
      offset = 0;
    for (const o of list) {
      let g = o.geometry,
        M = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld),
        N = new T.Matrix3().getNormalMatrix(M);
      const pos = g.attributes.position,
        nor = g.attributes.normal,
        uv = g.attributes.uv,
        col = g.attributes.color,
        vec = v();
      for (let j = 0; j < pos.count; j++) {
        vec.fromBufferAttribute(pos, j).applyMatrix4(M);
        pp.push(vec.x, vec.y, vec.z);
        vec.fromBufferAttribute(nor, j).applyNormalMatrix(N);
        nn.push(vec.x, vec.y, vec.z);
        uu.push(uv ? uv.getX(j) : 0, uv ? uv.getY(j) : 0);
        if (col) cc.push(col.getX(j), col.getY(j), col.getZ(j));
      }
      const idx = g.index;
      for (let j = 0; j < (idx ? idx.count : pos.count); j++) ii.push(offset + (idx ? idx.getX(j) : j));
      offset += pos.count;
      o.removeFromParent();
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(pp, 3));
    g.setAttribute("normal", new T.Float32BufferAttribute(nn, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uu, 2));
    if (cc.length) g.setAttribute("color", new T.Float32BufferAttribute(cc, 3));
    g.setIndex(ii);
    mesh(root, g, material);
  }
}
const light = new T.DirectionalLight(0xffe1b9, 2.6);
light.position.set(-95, 160, 58);
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, { left: -107, right: 107, top: 110, bottom: -85, near: 3, far: 430 });
light.shadow.camera.updateProjectionMatrix();
light.shadow.bias = -0.00035;
light.shadow.normalBias = 0.075;
light.target.position.set(0, 0, -18);
scene.add(light, light.target, new T.HemisphereLight(0xfff0df, 0xb09b89, 1.34));
const skyFill = new T.DirectionalLight(0xc4e7fa, 0.74);
skyFill.position.set(50, 85, -105);
scene.add(skyFill);
function environment() {
  const faces = [];
  for (let i = 0; i < 6; i++) {
    const ca = document.createElement("canvas");
    ca.width = ca.height = 128;
    const c = ca.getContext("2d"),
      g = c.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, "#ebf2ef");
    g.addColorStop(0.41, "#e4efee");
    g.addColorStop(0.46, "#535f5b");
    g.addColorStop(0.57, "#8e7965");
    g.addColorStop(1, "#c49769");
    c.fillStyle = i === 2 ? "#fff5dd" : i === 3 ? "#b49a75" : g;
    c.fillRect(0, 0, 128, 128);
    if (i === 0 || i === 4) {
      c.fillStyle = "#fff9e5";
      c.fillRect(22, 12, 31, 73);
      c.fillRect(59, 12, 31, 73);
    }
    faces.push(ca);
  }
  const map = new T.CubeTexture(faces);
  map.colorSpace = T.SRGBColorSpace;
  map.needsUpdate = true;
  scene.environment = map;
  scene.environmentIntensity = 0.46;
}
environment();
