'use strict';
const Atelier = (() => {
  const T = THREE,
    pi = Math.PI,
    tau = pi * 2;
  let seed = 93741;
  const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  function grainTexture(wood = false) {
    const w = wood ? 384 : 96,
      h = wood ? 192 : 96,
      a = new Uint8Array(w * h * 4);
    const knots = [
      [0.26, 0.36],
      [0.77, 0.73],
      [0.92, 0.16],
    ];
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const x = i / w,
          y = j / h;
        let f;
        if (wood) {
          let curve = y + 0.012 * Math.sin(tau * x) + 0.006 * Math.sin(2 * tau * x + 9 * y);
          for (const [kx, ky] of knots) {
            const d = Math.exp(-((x - kx) ** 2 * 32 + (y - ky) ** 2 * 580));
            curve += 0.055 * d * Math.sin((y - ky) * 21);
          }
          const g =
            0.5 +
            0.5 *
              Math.sin(
                tau *
                  (curve * 36 +
                    0.36 * Math.sin(tau * (curve * 8 + x)) +
                    0.17 * Math.sin(tau * (curve * 13 - x * 2))),
              );
          f =
            216 +
            13 * Math.sin(tau * curve * 5) +
            8 * Math.sin(tau * (curve * 17 + x)) -
            35 * g ** 7 +
            rand() * 12;
        } else f = 210 + rand() * 43;
        const k = (j * w + i) * 4;
        a[k] = f;
        a[k + 1] = wood ? f * (0.97 - 0.028 * Math.sin(18 * y)) : f;
        a[k + 2] = wood ? f * 0.92 : f;
        a[k + 3] = 255;
      }
    const tex = new T.DataTexture(a, w, h);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    tex.magFilter = T.LinearFilter;
    tex.minFilter = T.LinearMipMapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }
  const noise = grainTexture(),
    woodTex = grainTexture(true);
  woodTex.colorSpace = T.SRGBColorSpace;
  function mat(color, rough = 0.6, metal = 0, extra = {}) {
    return new T.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: metal,
      roughnessMap: noise,
      ...extra,
    });
  }
  const m = {
    forest: mat(0x244e42, 0.43, 0.14),
    jade: mat(0x497865, 0.4, 0.16),
    dark: mat(0x17392f, 0.48, 0.19),
    mint: mat(0x8faaa0, 0.58),
    cream: mat(0xf4e4be, 0.28, 0.12),
    linen: mat(0xe5d3aa, 0.94),
    paper: mat(0xf5e7c6, 0.8),
    brass: mat(0xb69a60, 0.35, 0.72),
    bronze: mat(0x776148, 0.48, 0.63),
    steel: mat(0xc6cfce, 0.27, 0.9),
    blade: mat(0xd7e0df, 0.19, 0.93),
    black: mat(0x263633, 0.65, 0.26),
    milk: mat(0xfff0ce, 0.13, 0.04),
    ice: mat(0xfdeac0, 0.63),
    layer: mat(0xd6b77e, 0.69),
    banana: mat(0xffdf8d, 0.59),
    seed: mat(0xaf8249, 0.71),
    wood: mat(0xb1865b, 0.65, 0, { map: woodTex, bumpMap: woodTex, bumpScale: 0.022 }),
    woodDark: mat(0x78533b, 0.55, 0, { map: woodTex, bumpMap: woodTex, bumpScale: 0.015 }),
    red: mat(0xb5694d, 0.85),
    skin: mat(0xc58f6e, 0.74),
    nail: mat(0xd3a18a, 0.57),
    leaf: mat(0x688661, 0.62),
    leafLine: mat(0xb0b68a, 0.57),
    bulb: mat(0xffe6b2, 0.26, 0, { emissive: 0xffca7e, emissiveIntensity: 1.5 }),
    wire: mat(0x3b4034, 0.74),
    woven: mat(0xc39b62, 0.81),
    blue: mat(0x799495, 0.75),
  };
  function group(parent, x = 0, y = 0, z = 0) {
    const g = new T.Group();
    if (parent) parent.add(g);
    g.position.set(x, y, z);
    return g;
  }
  function mesh(parent, geo, material, x = 0, y = 0, z = 0) {
    const o = new T.Mesh(geo, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const ballGeo = new T.SphereGeometry(1, 24, 16),
    boxGeo = new T.BoxGeometry();
  function ball(p, x, y, z, a, b, c, m) {
    const o = mesh(p, ballGeo, m, x, y, z);
    o.scale.set(a, b, c);
    return o;
  }
  function box(p, x, y, z, a, b, c, m) {
    const o = mesh(p, boxGeo, m, x, y, z);
    o.scale.set(a, b, c);
    return o;
  }
  function cyl(p, x, y, z, top, bot, h, m, n = 64) {
    return mesh(p, new T.CylinderGeometry(top, bot, h, n), m, x, y, z);
  }
  function ring(p, x, y, z, r, t, m, n = 96) {
    const o = mesh(p, new T.TorusGeometry(r, t, 10, n), m, x, y, z);
    o.rotation.x = pi / 2;
    return o;
  }
  function lathe(p, points, m, n = 64) {
    return mesh(
      p,
      new T.LatheGeometry(
        points.map((q) => new T.Vector2(...q)),
        n,
      ),
      m,
    );
  }
  function line(p, pts, r, m, n = 24) {
    return mesh(
      p,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(pts.map((q) => new T.Vector3(...q))),
        n,
        r,
        7,
        false,
      ),
      m,
    );
  }
  function rounded(p, x, y, z, w, h, d, r, m) {
    const sh = new T.Shape(),
      a = w / 2,
      b = d / 2;
    r = Math.min(r, a - 0.001, b - 0.001);
    sh.moveTo(-a + r, -b);
    sh.lineTo(a - r, -b);
    sh.quadraticCurveTo(a, -b, a, -b + r);
    sh.lineTo(a, b - r);
    sh.quadraticCurveTo(a, b, a - r, b);
    sh.lineTo(-a + r, b);
    sh.quadraticCurveTo(-a, b, -a, b - r);
    sh.lineTo(-a, -b + r);
    sh.quadraticCurveTo(-a, -b, -a + r, -b);
    const bevel = Math.min(0.032, h * 0.25);
    const geo = new T.ExtrudeGeometry(sh, {
      depth: h - 2 * bevel,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      curveSegments: 8,
    });
    geo.rotateX(-pi / 2);
    return mesh(p, geo, m, x, y - h / 2 + bevel, z);
  }
  // Bake static parts sharing a finish, preserving distinct moving assemblies.
  function batch(g) {
    g.updateWorldMatrix(true, true);
    const inv = g.matrixWorld.clone().invert(),
      sets = new Map(),
      remove = [];
    g.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material)) return;
      const id = o.material.uuid + '-' + o.castShadow;
      if (!sets.has(id))
        sets.set(id, { mat: o.material, p: [], n: [], uv: [], indices: [], cast: o.castShadow });
      const s = sets.get(id),
        q = o.geometry,
        idx = q.index;
      const trans = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld),
        norm = new T.Matrix3().getNormalMatrix(trans);
      const pos = q.attributes.position,
        n = q.attributes.normal,
        uv = q.attributes.uv,
        v = new T.Vector3(),
        offset = s.p.length / 3;
      for (let j = 0; j < pos.count; j++) {
        v.fromBufferAttribute(pos, j).applyMatrix4(trans);
        s.p.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, j).applyMatrix3(norm).normalize();
        s.n.push(v.x, v.y, v.z);
        s.uv.push(uv ? uv.getX(j) : 0, uv ? uv.getY(j) : 0);
      }
      for (let j = 0; j < (idx ? idx.count : pos.count); j++)
        s.indices.push(offset + (idx ? idx.getX(j) : j));
      remove.push(o);
    });
    for (const o of remove) o.removeFromParent();
    for (const { mat, p, n, uv, indices, cast } of sets.values()) {
      const q = new T.BufferGeometry();
      q.setIndex(indices);
      q.setAttribute('position', new T.Float32BufferAttribute(p, 3));
      q.setAttribute('normal', new T.Float32BufferAttribute(n, 3));
      q.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      const o = mesh(g, q, mat);
      o.castShadow = cast;
    }
  }
  function leaf(p, x, y, z, length, width, material = m.leaf) {
    const g = group(p, x, y, z),
      v = [],
      uv = [],
      idx = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16,
        w = width * Math.sin(pi * t) ** 0.78,
        mid = 0.07 * Math.sin(pi * t);
      for (let j = -1; j <= 1; j++) {
        v.push(j * w, mid + Math.abs(j) * 0.045 * Math.sin(4 * t), -length * t);
        uv.push((j + 1) / 2, t);
      }
      if (i < 16)
        for (let j = 0; j < 2; j++) {
          let k = i * 3 + j;
          idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3);
        }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    mesh(g, geo, material);
    line(
      g,
      [
        [0, 0.011, 0],
        [0, 0.085, -length * 0.5],
        [0, 0.016, -length],
      ],
      0.012,
      m.leafLine,
      12,
    );
    return g;
  }
  function slice(p, scale = 1) {
    const g = group(p),
      profile = [
        [0.001, 0],
        [0.4, 0],
        [0.45, 0.045],
        [0.47, 0.19],
        [0.465, 0.26],
        [0.433, 0.285],
        [0.001, 0.285],
      ];
    const geo = new T.LatheGeometry(
      profile.map((q) => new T.Vector2(...q)),
      54,
    );
    const a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i),
        z = a.getZ(i),
        th = Math.atan2(z, x),
        f = 1 + 0.046 * Math.cos(th * 5 + 0.3) + 0.021 * Math.sin(th * 3);
      a.setXYZ(i, x * f, a.getY(i) + (0.028 * x) / 0.47, z * f);
    }
    geo.computeVertexNormals();
    mesh(g, geo, m.banana);
    const flesh = ball(g, 0, 0.281, 0, 0.43, 0.016, 0.432, mat(0xffe8ae, 0.54));
    flesh.rotation.z = 0.059;
    for (let j = 0; j < 3; j++) {
      const th = 0.2 + (j * tau) / 3;
      for (let k = 0; k < 6; k++) {
        const ang = th + (k - 2.5) * 0.1,
          r = 0.052 + (0.103 * (k % 3)) / 2,
          x = r * Math.sin(ang),
          z = r * Math.cos(ang);
        let o = ball(g, x, 0.298 + x * 0.06, z, 0.016 + (k % 2) * 0.006, 0.007, 0.026, m.seed);
        o.rotation.y = ang;
      }
      for (let k = -1; k <= 1; k++) {
        const t = th + k * 0.32;
        line(
          g,
          [
            [0.16 * Math.sin(t), 0.296 + 0.009 * Math.sin(t), 0.16 * Math.cos(t)],
            [
              0.27 * Math.sin(t + 0.07),
              0.296 + 0.016 * Math.sin(t + 0.07),
              0.27 * Math.cos(t + 0.07),
            ],
            [
              0.385 * Math.sin(t + 0.15),
              0.29 + 0.022 * Math.sin(t + 0.15),
              0.385 * Math.cos(t + 0.15),
            ],
          ],
          0.0055,
          m.banana,
          8,
        );
      }
    }
    g.scale.setScalar(scale);
    batch(g);
    return g;
  }
  function jug(p) {
    const g = group(p),
      prof = [
        [0.02, 0.02],
        [0.34, 0.025],
        [0.43, 0.065],
        [0.48, 0.16],
        [0.5, 0.42],
        [0.44, 0.87],
        [0.425, 0.99],
        [0.436, 1.025],
        [0.427, 1.05],
        [0.397, 1.035],
        [0.386, 0.96],
        [0.406, 0.65],
        [0.44, 0.36],
        [0.37, 0.13],
        [0.03, 0.115],
      ];
    const geo = new T.LatheGeometry(
        prof.map((q) => new T.Vector2(...q)),
        80,
      ),
      a = geo.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i),
        z = a.getZ(i),
        y = a.getY(i),
        l = Math.hypot(x, z),
        nose = Math.max(0, x / (l || 1)) ** 9 * Math.max(0, (y - 0.67) / 0.38);
      a.setXYZ(i, x + 0.34 * nose, y + 0.04 * nose, z * (1 - 0.35 * nose));
    }
    geo.computeVertexNormals();
    mesh(g, geo, m.cream);
    const rim = [];
    for (let j = 0; j <= 80; j++) {
      const t = (j / 80) * tau,
        k = Math.max(0, Math.cos(t)) ** 9;
      rim.push([
        0.428 * Math.cos(t) + 0.334 * k,
        1.042 + 0.04 * k,
        0.428 * Math.sin(t) * (1 - 0.35 * k),
      ]);
    }
    line(g, rim, 0.021, m.forest, 80);
    ring(g, 0, 0.127, 0, 0.468, 0.018, m.forest);
    line(
      g,
      [
        [-0.425, 0.847, 0],
        [-0.685, 0.89, 0],
        [-0.83, 0.72, 0],
        [-0.8, 0.48, 0],
        [-0.66, 0.31, 0],
        [-0.47, 0.3, 0],
      ],
      0.078,
      m.forest,
      40,
    );
    ring(g, 0, 0.205, 0, 0.485, 0.009, m.brass);
    // A small sprig pressed into the front enamel.
    for (let j = 0; j < 3; j++) {
      const o = ball(
        g,
        (j - 1) * 0.069,
        0.49 + Math.abs(j - 1) * 0.064,
        0.489,
        0.034,
        0.097,
        0.009,
        m.jade,
      );
      o.rotation.z = (j - 1) * -0.57;
    }
    batch(g);
    const surface = new T.CircleGeometry(1, 64);
    surface.rotateX(-pi / 2);
    g.userData.liquid = mesh(g, surface, m.milk, 0, 0.913, 0);
    g.userData.liquid.castShadow = false;
    return g;
  }
  function spiral(p, r = 0.3, length = 0.82, turns = 2.6) {
    const g = group(p),
      v = [],
      uv = [],
      inds = [],
      n = 120;
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        a = u * turns * tau + 0.54,
        rad = r * (0.135 + 0.865 * u),
        thick = r * 0.068;
      for (let j = 0; j < 4; j++) {
        const front = j < 2,
          rr = rad + (j === 0 || j === 3 ? -thick : thick),
          wobble = 0.013 * Math.sin(a * 3 + 0.5) + 0.008 * Math.sin(a * 7);
        v.push(
          Math.cos(a) * rr,
          (front ? length / 2 : -length / 2) + (front ? wobble : -0.009 * Math.cos(a * 4)),
          Math.sin(a) * rr,
        );
        uv.push(u, j / 3);
      }
      if (i < n)
        for (let j = 0; j < 4; j++) {
          const k = i * 4 + j,
            l = i * 4 + ((j + 1) % 4);
          inds.push(k, k + 4, l, l, k + 4, l + 4);
        }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(inds);
    geo.computeVertexNormals();
    const ice = m.ice.clone();
    ice.side = T.DoubleSide;
    mesh(g, geo, ice);
    return g;
  }
  function cup(p, filled = true) {
    const g = group(p),
      prof = [
        [0.01, 0],
        [0.39, 0.012],
        [0.416, 0.045],
        [0.549, 0.72],
        [0.552, 0.759],
        [0.528, 0.764],
        [0.509, 0.704],
        [0.383, 0.065],
        [0.01, 0.061],
      ];
    lathe(g, prof, m.paper);
    ring(g, 0, 0.748, 0, 0.543, 0.025, m.paper);
    ring(g, 0, 0.04, 0, 0.416, 0.017, m.cream);
    lathe(
      g,
      [
        [0.442, 0.155],
        [0.499, 0.465],
      ],
      m.forest,
    );
    lathe(
      g,
      [
        [0.447, 0.19],
        [0.451, 0.211],
      ],
      m.brass,
    );
    for (let k = 0; k < 11; k++) {
      const t = (k * tau) / 11,
        theta = t + 0.15;
      const p1 = [Math.sin(t) * 0.467, 0.285, Math.cos(t) * 0.467],
        p2 = [Math.sin(theta) * 0.482, 0.379, Math.cos(theta) * 0.482];
      line(g, [p1, [(p1[0] + p2[0]) / 2, 0.33, (p1[2] + p2[2]) / 2], p2], 0.01, m.leafLine, 6);
    }
    const rolls = [
      [-0.19, 0.02, 0.27, 0.84, 0.19],
      [0.19, 0.12, 0.241, 0.76, -0.17],
      [0.07, -0.244, 0.221, 0.79, -0.12],
    ];
    for (const [x, z, r, h, t] of filled ? rolls : []) {
      const s = spiral(g, r, h, 2.55);
      s.position.set(x, 0.66 + (x < 0 ? 0.08 : 0), z);
      s.rotation.set(0.13, t, t);
    }
    batch(g);
    return g;
  }
  function scraper(p) {
    const g = group(p);
    const sh = new T.Shape();
    sh.moveTo(-0.62, 0);
    sh.quadraticCurveTo(-0.684, 0, -0.68, 0.06);
    sh.lineTo(-0.64, 0.72);
    sh.quadraticCurveTo(-0.64, 0.81, -0.54, 0.834);
    sh.lineTo(-0.16, 0.97);
    sh.lineTo(0.16, 0.97);
    sh.lineTo(0.54, 0.834);
    sh.quadraticCurveTo(0.64, 0.81, 0.64, 0.72);
    sh.lineTo(0.68, 0.06);
    sh.quadraticCurveTo(0.684, 0, 0.62, 0);
    sh.closePath();
    const geo = new T.ExtrudeGeometry(sh, {
      depth: 0.025,
      bevelEnabled: true,
      bevelThickness: 0.011,
      bevelSize: 0.012,
      bevelSegments: 2,
    });
    geo.rotateX(pi / 2);
    mesh(g, geo, m.blade, 0, 0.035, 0);
    line(
      g,
      [
        [-0.64, 0.032, 0.008],
        [0, 0.032, 0.008],
        [0.64, 0.032, 0.008],
      ],
      0.009,
      m.steel,
      4,
    );
    rounded(g, 0, 0.062, 1.01, 0.29, 0.079, 0.35, 0.07, m.steel);
    rounded(g, 0, 0.113, 1.65, 0.31, 0.184, 1.32, 0.149, m.woodDark);
    for (const z of [1.19, 1.89]) cyl(g, 0, 0.218, z, 0.046, 0.046, 0.014, m.brass, 24);
    for (const x of [-0.104, 0.109])
      line(
        g,
        [
          [x, 0.206, 1.16],
          [x * 0.7, 0.218, 1.63],
          [x, 0.204, 2.09],
        ],
        0.004,
        m.bronze,
        12,
      );
    batch(g);
    return g;
  }
  function banana(p) {
    const g = group(p),
      v = [],
      idx = [],
      uv = [],
      n = 34,
      b = 11;
    for (let i = 0; i <= n; i++) {
      const t = i / n,
        a = -1.29 + 2.48 * t,
        rr = 0.183 * Math.max(0.07, Math.sin(pi * t) ** 0.52),
        x = 1.01 * Math.sin(a),
        z = 0.75 * (Math.cos(a) - 0.38),
        y = 0.17 + 0.17 * (1 - Math.cos(a));
      for (let j = 0; j < b; j++) {
        const u = (tau * j) / b,
          r = rr * (1 + 0.065 * Math.cos(5 * u));
        v.push(
          x + Math.sin(a) * r * Math.cos(u),
          y + r * Math.sin(u),
          z + Math.cos(a) * r * Math.cos(u),
        );
        uv.push(t, j / b);
      }
      if (i < n)
        for (let j = 0; j < b; j++) {
          const k = i * b + j,
            l = i * b + ((j + 1) % b);
          idx.push(k, l, k + b, l, l + b, k + b);
        }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(v, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const peel = mat(0xe9bc59, 0.55, 0, { side: T.DoubleSide });
    mesh(g, geo, peel);
    ball(g, -0.977, 0.31, -0.075, 0.092, 0.067, 0.055, m.woodDark);
    line(
      g,
      [
        [0.945, 0.303, -0.017],
        [1.036, 0.37, -0.075],
        [1.1, 0.42, -0.15],
      ],
      0.054,
      m.leafLine,
      8,
    );
    return g;
  }
  function hand(p, guide = false) {
    const g = group(p),
      skin = guide ? mat(0xf5ddb2, 0.64) : m.skin;
    // Wrist points away from the camera, fingertips curl toward the cup.
    ball(g, 0, 0.015, -0.25, 0.218, 0.12, 0.39, skin);
    ball(g, 0, 0, 0.035, 0.238, 0.134, 0.28, skin);
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.106,
        len = [0.3, 0.355, 0.331, 0.26][i];
      line(
        g,
        [
          [x, 0.015, 0.12],
          [x * 1.06, 0.012, 0.234],
          [x * 1.1, -0.035, 0.17 + len * 0.65],
          [x * 1.07, -0.094, 0.17 + len],
        ],
        0.055 - (i === 3 ? 0.008 : 0),
        skin,
        11,
      );
      ball(g, x * 1.07, -0.093, 0.17 + len, 0.055, 0.052, 0.066, skin);
      ball(g, x * 1.07, -0.064, 0.182 + len, 0.036, 0.022, 0.037, guide ? skin : m.nail);
    }
    line(
      g,
      [
        [-0.156, 0.015, -0.008],
        [-0.261, -0.011, 0.059],
        [-0.324, -0.069, 0.16],
        [-0.32, -0.104, 0.251],
      ],
      0.076,
      skin,
      13,
    );
    ball(g, -0.32, -0.104, 0.251, 0.074, 0.068, 0.073, skin);
    batch(g);
    return g;
  }
  return {
    T,
    pi,
    tau,
    rand,
    noise,
    mat,
    m,
    group,
    mesh,
    ball,
    box,
    cyl,
    ring,
    lathe,
    line,
    rounded,
    leaf,
    batch,
    slice,
    jug,
    cup,
    spiral,
    scraper,
    banana,
    hand,
  };
})();
