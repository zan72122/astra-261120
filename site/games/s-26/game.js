'use strict';
(() => {
  const {
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
  } = Atelier;
  const sim = IceKitchen.create(),
    s = sim.s,
    sound = kitchenSound(),
    canvas = document.querySelector('canvas');
  window.__GAME__ = { step: (dt) => sim.step(dt), getState: () => sim.getState() };
  const render = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  render.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  render.shadowMap.enabled = true;
  render.shadowMap.type = T.PCFSoftShadowMap;
  render.toneMapping = T.ACESFilmicToneMapping;
  render.toneMappingExposure = 1.14;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(31, 1, 0.18, 85);
  scene.background = new T.Color(0x343e38);
  scene.fog = new T.FogExp2(0x46524b, 0.032);
  const key = new T.DirectionalLight(0xffe1b3, 3.05);
  key.position.set(-4.1, 8.8, -3.5);
  key.target.position.set(0, 0, 0.1);
  scene.add(key, key.target);
  key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 28 });
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.normalBias = 0.018;
  key.shadow.bias = -0.00025;
  key.shadow.radius = 3.5;
  scene.add(new T.HemisphereLight(0xf8e9cc, 0x738d84, 1.15));
  // Local reflection field: dark green canvas, warm counter and the long roof fixture.
  function environment() {
    const W = 256,
      H = 128,
      a = new Uint16Array(W * H * 4),
      half = T.DataUtils.toHalfFloat;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const u = x / W,
          v = y / H,
          theta = (u - 0.5) * tau,
          up = Math.sin((v - 0.5) * pi);
        const blur = (v, c, r) => Math.exp(-(((v - c) / r) ** 2));
        const sky = 0.18 + Math.max(0, up) * 0.24 + blur(up, 0.05, 0.22) * 0.18;
        const stripe =
          blur(v, 0.73 + 0.034 * Math.cos(theta), 0.018) * Math.exp(-(((u - 0.25) / 0.18) ** 6));
        const window = blur(u, 0.78, 0.116) * blur(v, 0.68, 0.18);
        const bounce = blur(v, 0.33, 0.14) * (0.2 + 0.12 * Math.cos(theta * 4));
        const side = blur(u, 0.12, 0.09) * blur(v, 0.52, 0.15);
        const k = (y * W + x) * 4;
        a[k] = half(sky * 0.91 + bounce + stripe * 5.8 + window * 1.4 + side * 0.29);
        a[k + 1] = half(sky * 1.04 + bounce * 0.69 + stripe * 4.7 + window * 1.34 + side * 0.12);
        a[k + 2] = half(sky + bounce * 0.42 + stripe * 3.5 + window * 1.17 + side * 0.05);
        a[k + 3] = half(1);
      }
    const tex = new T.DataTexture(a, W, H, T.RGBAFormat, T.HalfFloatType);
    tex.mapping = T.EquirectangularReflectionMapping;
    tex.magFilter = tex.minFilter = T.LinearFilter;
    tex.needsUpdate = true;
    scene.environment = tex;
  }
  environment();
  const details = [];
  const table = group(scene),
    machine = group(scene),
    back = group(scene);
  const hPlate = 0.155;
  for (let i = 0; i < 10; i++) {
    const wood = m.wood.clone();
    wood.color.multiplyScalar(0.83 + rand() * 0.29);
    rounded(table, 0, -0.38, (i - 4.5) * 0.91, 16, 0.3, 0.899, 0.045, wood);
  }
  box(table, 0, -0.87, 4.45, 15.95, 0.79, 0.21, m.woodDark);
  box(table, 0, -1.89, 4.37, 15.76, 1.3, 0.13, m.forest);
  for (let i = -7; i <= 7; i++) box(table, i, -1.86, 4.452, 0.028, 1.22, 0.028, m.dark);
  box(table, 0, -1.31, 4.49, 15.92, 0.1, 0.11, m.brass);
  for (const x of [-6.7, -3.1, 3.1, 6.7]) box(table, x, -2.52, 4.27, 0.19, 3.2, 0.23, m.woodDark);
  for (let i = 0; i < 36; i++) {
    const x = (rand() - 0.5) * 15,
      z = (rand() - 0.5) * 8;
    line(
      table,
      [
        [x, -0.222, z],
        [x + 0.13, -0.222, z + 0.004],
        [x + 0.2 + rand() * 0.32, -0.222, z - 0.001],
      ],
      0.003,
      m.woodDark,
      4,
    );
  }
  // Enamel chiller, gasket and stepped stainless rim.
  rounded(machine, 0, -0.07, 0.03, 5.92, 0.39, 5.77, 0.39, m.dark);
  rounded(machine, 0, 0.037, 0.015, 5.86, 0.225, 5.72, 0.35, m.jade);
  rounded(machine, 0, 0.162, 0.012, 5.78, 0.053, 5.64, 0.32, m.forest);
  cyl(machine, 0, 0.193, 0, 2.715, 2.73, 0.085, m.black, 128);
  ring(machine, 0, 0.232, 0, 2.658, 0.066, m.steel, 128);
  ring(machine, 0, 0.238, 0, 2.585, 0.027, m.bronze, 128);
  const steel = mat(0xbcc8c7, 0.36, 0.86);
  function brushed() {
    const W = 256,
      a = new Uint8Array(W * W * 4);
    for (let y = 0; y < W; y++)
      for (let x = 0; x < W; x++) {
        const r = Math.hypot(x - W / 2, y - W / 2),
          ang = Math.atan2(y - W / 2, x - W / 2),
          k = 4 * (y * W + x),
          v = 201 + 17 * Math.sin(r * 2.3 + 0.37 * Math.sin(ang * 3)) + rand() * 24;
        a[k] = a[k + 1] = a[k + 2] = v;
        a[k + 3] = 255;
      }
    const tex = new T.DataTexture(a, W, W);
    tex.magFilter = T.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }
  steel.roughnessMap = brushed();
  steel.bumpMap = steel.roughnessMap;
  steel.bumpScale = 0.004;
  const dish = lathe(
    machine,
    [
      [0.001, hPlate],
      [2.4, hPlate],
      [2.49, 0.164],
      [2.52, 0.177],
      [2.55, 0.204],
      [2.566, 0.236],
      [2.576, 0.251],
    ],
    steel,
    144,
  );
  dish.material.side = T.DoubleSide;
  const plate = mesh(machine, new T.CircleGeometry(2.503, 144), steel, 0, hPlate + 0.001, 0);
  plate.rotation.x = -pi / 2;
  const scratch = mat(0xabab9e, 0.5, 0.72, { transparent: true, opacity: 0.19, depthWrite: false });
  for (let j = 0; j < 39; j++) {
    const r = 0.32 + 2.13 * rand(),
      ang = rand() * tau,
      len = 0.085 + rand() * 0.73,
      pts = [];
    for (let k = 0; k <= 10; k++) {
      const a = ang + (len * k) / 10;
      pts.push([r * Math.cos(a), hPlate + 0.003, r * Math.sin(a)]);
    }
    line(machine, pts, 0.0015 + rand() * 0.0018, scratch, 10);
  }
  for (const x of [-2.62, 2.62])
    for (const z of [-2.49, 2.49]) {
      cyl(machine, x, 0.205, z, 0.07, 0.071, 0.029, m.brass, 24);
      const slot = box(machine, x, 0.222, z, 0.084, 0.007, 0.014, m.bronze);
      slot.rotation.y = x * z * 0.13;
    }
  for (let i = -4; i <= 4; i++)
    rounded(machine, i * 0.22, -0.055, 2.914, 0.112, 0.053, 0.015, 0.006, m.black);
  batch(machine);
  batch(table);
  // A woven bamboo tray of fresh bananas on the preparation counter.
  const tray = group(scene);
  details.push(() => {
    const weave = mat(0xb38c56, 0.78);
    lathe(
      tray,
      [
        [0.01, 0.01],
        [0.84, 0.018],
        [0.973, 0.12],
        [1.06, 0.273],
        [1.044, 0.3],
        [0.99, 0.275],
        [0.91, 0.15],
        [0.02, 0.13],
      ],
      m.woven,
      72,
    );
    for (let j = 0; j < 6; j++)
      ring(tray, 0, 0.091 + j * 0.038, 0, 0.936 + j * 0.024, 0.021, j % 2 ? weave : m.woven, 80);
    for (let j = 0; j < 40; j++) {
      const a = (j * tau) / 40;
      line(
        tray,
        [
          [0.79 * Math.sin(a), 0.061, 0.79 * Math.cos(a)],
          [0.99 * Math.sin(a + 0.018), 0.153, 0.99 * Math.cos(a + 0.018)],
          [1.056 * Math.sin(a), 0.301, 1.056 * Math.cos(a)],
        ],
        0.016,
        m.woven,
        8,
      );
    }
    const l = leaf(tray, -0.75, 0.221, 0.56, 1.8, 0.44);
    l.rotation.y = -0.73;
    for (let j = 0; j < 3; j++) {
      const b = banana(tray);
      b.position.set(-0.08 + j * 0.073, 0.19 + j * 0.065, -0.5 + j * 0.32);
      b.rotation.set(0.09 * j, 0.12 + j * 0.15, -0.035 * j);
      b.scale.setScalar(0.88 + j * 0.025);
    }
    batch(tray);
  });
  function towel(p, w, d, color) {
    const g = group(p),
      clothMat = m.linen.clone();
    clothMat.side = T.DoubleSide;
    const S = 96,
      data = new Uint8Array(S * S * 4);
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        const stripe =
          (i > 6 && i < 10) || (i > 13 && i < 16) || (i > 78 && i < 82) || (i > 85 && i < 89);
        const mult = 0.91 + 0.035 * (i % 2) + 0.024 * (j % 2) + 0.024 * rand(),
          k = 4 * (j * S + i);
        const tint = stripe ? color : [237, 224, 191];
        for (let c = 0; c < 3; c++) data[k + c] = tint[c] * mult;
        data[k + 3] = 255;
      }
    const tex = new T.DataTexture(data, S, S);
    tex.colorSpace = T.SRGBColorSpace;
    tex.magFilter = T.LinearFilter;
    tex.needsUpdate = true;
    clothMat.map = tex;
    clothMat.color.set(0xffffff);
    for (let j = 0; j < 3; j++) {
      const geo = new T.PlaneGeometry(w - j * 0.028, d - j * 0.019, 19, 26);
      geo.rotateX(-pi / 2);
      const a = geo.attributes.position;
      for (let i = 0; i < a.count; i++) {
        const x = a.getX(i),
          z = a.getZ(i);
        a.setY(
          i,
          0.027 * Math.cos(x * 7 + z * 0.8) +
            0.025 * Math.sin(z * 4.3 + x * 2) +
            0.028 * Math.sin(x * 9 + 1.4) * Math.cos(z * 1.8),
        );
      }
      geo.computeVertexNormals();
      const o = mesh(g, geo, clothMat, -0.018 * j, 0.044 + j * 0.038, -0.026 * j);
      o.rotation.y = -0.019 * j;
    }
    for (let i = 0; i < 29; i++) {
      const x = (i / 28 - 0.5) * w;
      line(
        g,
        [
          [x, 0.1, d / 2 - 0.07],
          [x + 0.01, 0.076, d / 2 + 0.025],
          [x + 0.012 * Math.cos(i), 0.071, d / 2 + 0.08 + 0.022 * rand()],
        ],
        0.008,
        m.linen,
        4,
      );
    }
    batch(g);
    return g;
  }
  const cloth = towel(scene, 1.87, 2.22, [88, 126, 113]);
  const jugObj = jug(scene),
    bladeObj = scraper(scene),
    bananaObj = slice(scene, 1.14),
    sampleCup = cup(scene),
    cupObj = cup(scene, false);
  const milkDrop = ball(scene, 0, 0, 0, 0.057, 0.11, 0.057, m.milk);
  const milkStream = mesh(scene, new T.CylinderGeometry(1, 1, 1, 18, 1), m.milk);
  milkStream.visible = false;
  const pitcherBase = new T.Vector3(),
    cupBase = new T.Vector3();
  const coaster = group(scene);
  cyl(coaster, 0, 0.035, 0, 0.64, 0.6, 0.07, m.woodDark);
  ring(coaster, 0, 0.071, 0, 0.573, 0.011, m.brass);
  batch(coaster);
  // Long wooden spoon and a little fluted brass saucer.
  const spoonGroup = group(scene);
  lathe(
    spoonGroup,
    [
      [0.025, 0.01],
      [0.45, 0.012],
      [0.59, 0.082],
      [0.602, 0.11],
      [0.579, 0.118],
      [0.466, 0.055],
      [0.025, 0.045],
    ],
    m.brass,
  );
  for (let j = 0; j < 2; j++) {
    const sp = group(spoonGroup, j * 0.24 - 0.14, 0.087 + j * 0.037, -0.11);
    sp.rotation.y = -0.27 + j * 0.23;
    ball(sp, 0, 0.015, -0.205, 0.149, 0.047, 0.225, m.woodDark);
    rounded(sp, 0, 0.025, 0.292, 0.09, 0.05, 0.83, 0.04, m.woodDark);
  }
  batch(spoonGroup);
  const floorMat = mat(0x525d56, 0.89),
    floor = box(back, 0, -3.89, -3, 40, 0.24, 38, floorMat);
  for (let i = -10; i < 11; i++) {
    box(back, i * 1.72, -3.756, -3, 0.018, 0.008, 32, m.black);
    box(back, 0, -3.756, i * 1.6, 36, 0.008, 0.017, m.black);
  }
  // Distant night stalls beneath the canopy.
  for (let j = 0; j < 10; j++) {
    const x = (j - 4.5) * 2.5,
      z = -10 - rand() * 4;
    box(back, x, -1.2, z, 2.32, 4.8, 0.42, j % 2 ? m.woodDark : m.dark);
    box(back, x, 1.0, z + 0.2, 2.45, 0.25, 1.57, j % 3 ? m.forest : m.red);
    for (let a = 0; a < 3; a++)
      ball(back, x - 0.78 + a * 0.7, 0.45 + rand() * 0.26, z + 0.6, 0.077, 0.115, 0.077, m.bulb);
  }
  batch(back);
  const mother = group(scene);
  const apron = mat(0xc5b08c, 0.91),
    shirt = mat(0x618578, 0.81);
  ball(mother, 0, 0.32, -0.5, 0.89, 0.77, 0.51, shirt);
  ball(mother, 0, 0.43, -0.165, 0.686, 0.75, 0.237, apron);
  const pocket = rounded(mother, 0, 0.39, 0.051, 0.66, 0.039, 0.43, 0.07, m.linen);
  pocket.rotation.x = pi / 2;
  for (const side of [-1, 1]) {
    const strap = box(mother, side * 0.36, 0.89, -0.062, 0.132, 0.72, 0.061, m.woodDark);
    strap.rotation.z = side * 0.16;
    ball(mother, side * 0.401, 0.686, 0.046, 0.051, 0.053, 0.019, m.brass);
  }
  // Dark hair is swept up behind the ears as she leans over the worktop.
  const hair = mat(0x343028, 0.66),
    hairGlint = mat(0x484034, 0.67);
  ball(mother, 0, 1.01, -0.43, 0.219, 0.33, 0.22, m.skin);
  const head = group(mother, 0, 1.48, -0.44);
  head.rotation.set(0.49, -0.2, -0.045);
  ball(head, 0, 0, 0, 0.406, 0.51, 0.376, m.skin);
  const capGeo = new T.SphereGeometry(1, 40, 24, 0, tau, 0, pi * 0.64),
    hp = capGeo.attributes.position;
  for (let j = 0; j < hp.count; j++) {
    const z = hp.getZ(j),
      y = hp.getY(j);
    hp.setY(j, y + 0.52 * Math.max(0, z) ** 1.1 * (1 - Math.max(0, y)));
  }
  capGeo.computeVertexNormals();
  const capMesh = mesh(head, capGeo, hair, 0, 0.015, -0.022);
  capMesh.scale.set(0.423, 0.527, 0.392);
  ball(head, -0.06, 0.285, -0.316, 0.267, 0.243, 0.227, hair);
  ring(head, -0.06, 0.304, -0.31, 0.235, 0.017, m.forest);
  for (const k of [-1, 1]) {
    ball(head, k * 0.369, -0.036, -0.01, 0.07, 0.125, 0.075, m.skin);
    ball(head, k * 0.378, -0.114, 0.018, 0.029, 0.031, 0.025, m.brass);
    line(
      head,
      [
        [k * 0.079, 0.028, 0.365],
        [k * 0.143, 0.02, 0.349],
        [k * 0.202, 0.033, 0.314],
      ],
      0.012,
      hair,
      12,
    );
    line(
      head,
      [
        [k * 0.077, 0.091, 0.361],
        [k * 0.151, 0.11, 0.335],
        [k * 0.211, 0.09, 0.3],
      ],
      0.016,
      hairGlint,
      12,
    );
  }
  ball(head, 0, -0.075, 0.351, 0.073, 0.089, 0.071, m.skin);
  line(
    head,
    [
      [-0.074, -0.202, 0.327],
      [0, -0.213, 0.338],
      [0.076, -0.199, 0.326],
    ],
    0.009,
    mat(0xa97660, 0.73),
    11,
  );
  batch(mother);
  const mamaArm = group(scene),
    leftArm = group(scene);
  function arm(g, mirror) {
    const sleeve = ball(g, 0, 0.082, -0.62, 0.256, 0.235, 0.508, shirt);
    sleeve.rotation.x = 0.2;
    ball(g, 0, 0.013, -0.28, 0.207, 0.16, 0.26, m.skin);
    const cuff = ball(g, 0, 0.041, -0.36, 0.244, 0.19, 0.14, m.mint);
    cuff.rotation.x = 0.17;
    const palm = hand(g);
    palm.rotation.y = mirror * 0.13;
    palm.scale.x = mirror;
    batch(g);
  }
  arm(mamaArm, -1);
  arm(leftArm, 1);
  const shoulders = [ball(scene, 0, 0, 0, 1, 1, 1, shirt), ball(scene, 0, 0, 0, 1, 1, 1, shirt)];
  const childHand = hand(scene);
  childHand.scale.setScalar(0.8);
  function joinSleeve(arm, upper, side) {
    const shoulder = mother.localToWorld(new T.Vector3(side * 0.64, 0.55, -0.42));
    const elbow = arm.localToWorld(new T.Vector3(0, 0.08, -0.86)),
      dir = elbow.clone().sub(shoulder);
    upper.position.copy(shoulder).lerp(elbow, 0.5);
    upper.scale.set(0.241, dir.length() * 0.5 + 0.13, 0.238);
    upper.quaternion.setFromUnitVectors(axis, dir.normalize());
  }
  function shade() {
    const g = group(scene),
      width = 0.94,
      N = 19;
    for (let i = 0; i < N; i++) {
      const x = (i - (N - 1) / 2) * width,
        cloth = i % 2 === 0 ? m.forest : m.linen;
      // Convex canvas roof with a scalloped valance and a stitched, rolled hem.
      const geom = new T.PlaneGeometry(width, 0.9, 3, 10),
        p = geom.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const bx = p.getX(k),
          by = p.getY(k),
          r = (by + 0.45) / 0.9;
        p.setXYZ(k, bx, 0.35 + r * 0.72 + 0.035 * Math.cos((bx / width) * tau), -0.09 - r * 0.86);
      }
      geom.computeVertexNormals();
      const fabric = cloth.clone();
      fabric.side = T.DoubleSide;
      mesh(g, geom, fabric, x, 0, 0);
      const sh = new T.Shape();
      sh.moveTo(-width / 2, 0.395);
      sh.lineTo(width / 2, 0.395);
      sh.lineTo(width / 2, 0.12);
      sh.bezierCurveTo(width * 0.35, -0.11, -width * 0.35, -0.11, -width / 2, 0.12);
      sh.closePath();
      const skirt = new T.ExtrudeGeometry(sh, {
        depth: 0.038,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.009,
        bevelSegments: 2,
        curveSegments: 12,
      });
      mesh(g, skirt, cloth, x, 0, 0.005);
      const hem = [];
      for (let j = 0; j <= 12; j++) {
        const t = j / 12;
        hem.push([x + (t - 0.5) * width, 0.121 - 0.17 * Math.sin(pi * t) ** 0.8, 0.052]);
      }
      line(g, hem, 0.012, m.woven, 16);
    }
    box(g, 0, 0.37, -0.025, N * width, 0.088, 0.12, m.woodDark);
    box(g, 0, -0.16, -0.31, 17.6, 0.12, 0.12, m.woodDark);
    box(g, -1.68, -0.183, -0.22, 2.24, 0.08, 0.13, m.brass);
    box(g, -1.68, -0.204, -0.15, 2.12, 0.046, 0.075, m.bulb);
    const pts = [];
    for (let j = 0; j <= 60; j++) {
      const x = -8.7 + (j * 17.4) / 60;
      pts.push([x, -0.22 - 0.145 * Math.cos(x * 0.83), -0.27]);
    }
    line(g, pts, 0.014, m.wire, 72);
    for (let j = -9; j <= 9; j++) {
      const x = j * 0.9 + 0.16,
        y = -0.23 - 0.145 * Math.cos(x * 0.83);
      cyl(g, x, y - 0.053, -0.27, 0.046, 0.044, 0.11, m.bronze, 12);
      ball(g, x, y - 0.152, -0.27, 0.067, 0.092, 0.067, m.bulb);
    }
    batch(g);
    return g;
  }
  const awning = shade();
  const posts = group(scene);
  for (const x of [-6.8, 6.8]) {
    cyl(posts, x, 1, -3.55, 0.09, 0.11, 7.9, m.woodDark);
    for (let j = 0; j < 6; j++) ring(posts, x, 1.78 + j * 0.039, -3.55, 0.097, 0.016, m.woven, 24);
  }
  batch(posts);
  function lamp() {
    const g = group(scene),
      amber = mat(0xe1a15c, 0.74, 0, { emissive: 0xed9b48, emissiveIntensity: 0.27 });
    cyl(g, 0, 0.61, 0, 0.013, 0.014, 0.48, m.wire, 8);
    lathe(
      g,
      [
        [0.1, -0.4],
        [0.29, -0.35],
        [0.398, -0.21],
        [0.43, 0.02],
        [0.39, 0.24],
        [0.28, 0.35],
        [0.128, 0.39],
      ],
      amber,
      40,
    );
    for (let j = 0; j < 9; j++) {
      const y = (j - 4) * 0.078,
        r = 0.43 * Math.sqrt(Math.max(0.14, 1 - (y / 0.44) ** 2));
      ring(g, 0, y, 0, r, 0.009, m.bronze, 40);
    }
    cyl(g, 0, 0.39, 0, 0.14, 0.15, 0.05, m.brass, 24);
    cyl(g, 0, -0.382, 0, 0.136, 0.13, 0.044, m.brass, 24);
    line(
      g,
      [
        [0, -0.38, 0],
        [0, -0.5, 0.006],
        [0.014, -0.62, 0.011],
      ],
      0.018,
      m.red,
      6,
    );
    batch(g);
    return g;
  }
  const lanternL = lamp(),
    lanternR = lamp();
  // The four enamel inlays on the wooden rail show the recipe without words.
  const rail = group(scene),
    inlays = [],
    railBase = group(rail);
  rounded(railBase, 0, 0, 0, 4.42, 0.155, 0.92, 0.39, m.woodDark);
  rounded(railBase, 0, 0.079, 0, 4.31, 0.041, 0.844, 0.37, m.brass);
  rounded(railBase, 0, 0.109, 0, 4.24, 0.045, 0.771, 0.326, m.dark);
  for (const x of [-1.99, 1.99]) {
    cyl(railBase, x, 0.138, 0, 0.03, 0.03, 0.012, m.brass, 16);
  }
  function motif(g, i, finish) {
    const stroke = (pts, r = 0.024) =>
      line(
        g,
        pts.map(([x, z]) => [x, 0.022, z]),
        r,
        finish,
        14,
      );
    if (i === 0) {
      stroke(
        [
          [-0.17, -0.14],
          [-0.15, 0.14],
          [-0.105, 0.192],
          [0.115, 0.19],
          [0.159, 0.14],
          [0.148, -0.09],
          [0.21, -0.178],
          [-0.17, -0.14],
        ],
        0.023,
      );
      stroke(
        [
          [-0.167, -0.095],
          [-0.237, -0.103],
          [-0.245, 0.021],
          [-0.149, 0.065],
        ],
        0.022,
      );
      stroke(
        [
          [-0.067, 0.112],
          [0.027, 0.113],
        ],
        0.015,
      );
    } else if (i === 1) {
      const d = group(g);
      d.rotation.y = -0.55;
      line(
        d,
        [
          [-0.145, 0.022, -0.194],
          [0.151, 0.022, -0.194],
          [0.129, 0.022, 0.012],
          [0.049, 0.022, 0.069],
          [-0.04, 0.022, 0.07],
          [-0.14, 0.022, 0.002],
          [-0.145, 0.022, -0.194],
        ],
        0.025,
        finish,
        9,
      );
      rounded(d, 0, 0.023, 0.157, 0.065, 0.044, 0.207, 0.024, finish);
    } else if (i === 2) {
      const pts = [];
      for (let j = 0; j <= 55; j++) {
        const t = j / 55,
          r = 0.014 + 0.178 * t;
        pts.push([r * Math.cos(t * tau * 1.66), r * Math.sin(t * tau * 1.66)]);
      }
      stroke(pts, 0.024);
    } else {
      stroke(
        [
          [-0.18, -0.059],
          [-0.129, 0.156],
          [-0.1, 0.187],
          [0.122, 0.187],
          [0.177, -0.059],
          [-0.18, -0.059],
        ],
        0.022,
      );
      stroke(
        [
          [-0.112, -0.077],
          [-0.122, -0.146],
          [-0.073, -0.19],
          [-0.019, -0.14],
          [0.003, -0.09],
          [0.025, -0.178],
          [0.096, -0.202],
          [0.14, -0.146],
          [0.12, -0.08],
        ],
        0.021,
      );
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * 1.015,
      g = group(rail, x, 0.144, 0),
      base = m.jade.clone(),
      ink = m.cream.clone();
    cyl(g, 0, 0.006, 0, 0.306, 0.306, 0.029, base, 56);
    ring(g, 0, 0.023, 0, 0.305, 0.012, m.brass, 56);
    const sym = group(g, 0, 0.032, 0);
    motif(sym, i, ink);
    batch(sym);
    inlays.push({ base, ink });
    if (i < 3)
      for (const d of [-0.058, 0.058])
        cyl(railBase, x + 0.507 + d, 0.137, 0, 0.017, 0.017, 0.009, m.brass, 12);
  }
  batch(railBase);
  const extra = group(scene);
  details.push(() => {
    const pot = group(extra, 5.83, -0.217, 0.54);
    lathe(
      pot,
      [
        [0.02, 0],
        [0.32, 0],
        [0.37, 0.08],
        [0.394, 0.74],
        [0.41, 0.79],
        [0.386, 0.8],
        [0.365, 0.74],
        [0.02, 0.65],
      ],
      m.jade,
    );
    ring(pot, 0, 0.74, 0, 0.394, 0.022, m.brass);
    for (let j = 0; j < 6; j++) {
      const g = group(pot, (rand() - 0.5) * 0.38, 0.54, (rand() - 0.5) * 0.34);
      g.rotation.set((rand() - 0.5) * 0.5, rand() * tau, (rand() - 0.5) * 0.6);
      cyl(g, 0, 0.36, 0, 0.038, 0.047, 0.82, m.woodDark, 12);
      ball(g, 0, 0.87, 0, 0.126, 0.217, 0.046, m.wood);
    }
    const napkins = group(extra, 4.68, -0.196, 2.31);
    napkins.rotation.y = -0.17;
    for (let j = 0; j < 5; j++)
      rounded(
        napkins,
        j * 0.011,
        j * 0.033,
        0,
        1.38,
        0.028,
        0.98,
        0.048,
        j % 2 ? m.paper : m.linen,
      );
    const garnish = leaf(napkins, -0.52, 0.178, 0.34, 1.05, 0.19);
    garnish.rotation.y = -0.8;
    const foreground = group(extra, -6.66, -0.2, 3.9);
    for (let j = 0; j < 6; j++) {
      const l = leaf(foreground, 0.12 * j, 0.056 * j, 0, 1.42 + rand() * 0.9, 0.27 + rand() * 0.16);
      l.rotation.y = -1.6 + 0.39 * j;
      l.rotation.x = -0.15 - rand() * 0.2;
    }
    batch(extra);
  });
  // A soft contact penumbra under raised utensils supplements the roof lamp's shadow.
  const shadowMap = (() => {
    const side = 64,
      a = new Uint8Array(side * side * 4);
    for (let j = 0; j < side; j++)
      for (let i = 0; i < side; i++) {
        const k = 4 * (j * side + i),
          r = ((i - 31.5) / 31.5) ** 2 + ((j - 31.5) / 31.5) ** 2;
        a[k] = a[k + 1] = a[k + 2] = 255;
        a[k + 3] = Math.round(235 * Math.max(0, 1 - r) ** 2.5);
      }
    const tex = new T.DataTexture(a, side, side);
    tex.needsUpdate = true;
    tex.magFilter = T.LinearFilter;
    return tex;
  })();
  function shadePad(w, d, alpha) {
    const g = new T.PlaneGeometry(w, d);
    g.rotateX(-pi / 2);
    const o = mesh(
      scene,
      g,
      mat(0x393429, 0.94, 0, {
        map: shadowMap,
        transparent: true,
        opacity: alpha,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    o.castShadow = false;
    return o;
  }
  const jugShadow = shadePad(1.44, 1.15, 0.35),
    fruitShadow = shadePad(1.32, 1.25, 0.25);
  // The film is a displaced triangulated surface. Its meniscus and roughness
  // come from the same per-cell state used by the conservative flow solver.
  const count = sim.N * sim.N,
    filmGeo = new T.BufferGeometry(),
    fp = new Float32Array(count * 3),
    fa = new Float32Array(count * 4),
    fi = [];
  for (let k = 0; k < count; k++) {
    const c = s.cells[k];
    fp[3 * k] = c.x;
    fp[3 * k + 1] = hPlate + 0.009;
    fp[3 * k + 2] = c.z;
    if (k % sim.N < sim.N - 1 && k < count - sim.N - 1) {
      fi.push(k, k + sim.N, k + 1, k + 1, k + sim.N, k + sim.N + 1);
    }
  }
  filmGeo.setIndex(fi);
  filmGeo.setAttribute('position', new T.BufferAttribute(fp, 3).setUsage(T.DynamicDrawUsage));
  filmGeo.setAttribute('film', new T.BufferAttribute(fa, 4).setUsage(T.DynamicDrawUsage));
  filmGeo.computeVertexNormals();
  const filmMat = mat(0xffedc8, 0.2, 0.035);
  filmMat.onBeforeCompile = (sh) => {
    sh.vertexShader =
      'attribute vec4 film; varying vec4 vFilm; varying vec2 vPan;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvFilm=film; vPan=position.xz;',
      );
    sh.fragmentShader =
      'varying vec4 vFilm; varying vec2 vPan;\n' +
      sh.fragmentShader
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
 if(vFilm.x<.055)discard;
 float pulpy=clamp(vFilm.z*4.0,0.,.65);
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.94,.61,.20),pulpy);
 diffuseColor.rgb*=.98+.02*sin(dot(vPan,vec2(89.,21.)))*sin(dot(vPan,vec2(14.,74.))); `,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          '#include <roughnessmap_fragment>\nroughnessFactor=.085+.74*vFilm.y;',
        )
        .replace(
          '#include <opaque_fragment>',
          `float stripeDistance=(vPan.y+.36+.12*vPan.x+.19*sin(vPan.x*1.3)+.035*vFilm.x)/.065;float roof=exp(-stripeDistance*stripeDistance);
 outgoingLight+=vec3(.65,.54,.36)*roof*pow(1.-vFilm.y,3.)*smoothstep(.055,.55,vFilm.x);
 #include <opaque_fragment>`,
        );
  };
  const film = mesh(scene, filmGeo, filmMat);
  film.castShadow = false;
  film.frustumCulled = false;
  const filmUV = new Float32Array(count * 2);
  for (let k = 0; k < count; k++) {
    filmUV[k * 2] = (s.cells[k].x + sim.R) / (2 * sim.R);
    filmUV[k * 2 + 1] = (s.cells[k].z + sim.R) / (2 * sim.R);
  }
  filmGeo.setAttribute('uv', new T.BufferAttribute(filmUV, 2));
  const bits = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), m.banana, 330);
  scene.add(bits);
  bits.count = 0;
  bits.castShadow = true;
  const tmp = new T.Object3D();
  function updateFilm() {
    let b = 0,
      total = 0;
    for (let k = 0; k < count; k++) {
      const c = s.cells[k],
        i = k * 4;
      fa[i] = c.h;
      fa[i + 1] = c.ice;
      fa[i + 2] = c.fruit;
      fa[i + 3] = c.temp;
      fp[k * 3 + 1] = hPlate + 0.009 + Math.min(17, c.h) * 0.01;
      total += c.h;
      if (c.fruit > 0.006 && c.h > 0.045 && k % 2 === 0 && b < 330) {
        const r = s.fruit.grain * 0.005 * (0.68 + 0.32 * Math.min(1, c.fruit * 12));
        tmp.position.set(
          c.x + 0.021 * Math.sin(k),
          fp[k * 3 + 1] + 0.009,
          c.z + 0.016 * Math.cos(k),
        );
        tmp.scale.set(r * 1.24, r * 0.52, r * 0.8);
        tmp.rotation.set(0.01, k * 2, 0.15);
        tmp.updateMatrix();
        bits.setMatrixAt(b++, tmp.matrix);
      }
    }
    bits.count = b;
    bits.instanceMatrix.needsUpdate = true;
    film.visible = total > 0.01;
    if (film.visible) {
      filmGeo.attributes.position.needsUpdate = filmGeo.attributes.film.needsUpdate = true;
      filmGeo.computeVertexNormals();
    }
  }
  const curlObj = group(scene),
    curlBody = spiral(curlObj, 1, 1.35, 2.8);
  curlBody.rotation.z = pi / 2;
  curlObj.rotation.order = 'YXZ';
  const ribbon = curlBody.children[0].geometry,
    ribPos = ribbon.attributes.position,
    ribUV = ribbon.attributes.uv;
  ribPos.setUsage(T.DynamicDrawUsage);
  function windRibbon(ro) {
    const r = ro.radius,
      angular = Math.max(0.12, ro.angle),
      core = Math.min(0.89, 0.041 / r);
    for (let j = 0; j < ribPos.count; j++) {
      const u = ribUV.getX(j),
        face = j % 4,
        a = 0.54 + u * angular,
        rad = core + (1 - core) * u;
      const thickness = Math.min(0.1, 0.012 / r + ((1 - core) / (angular / tau + 1)) * 0.17);
      const rr = rad + (face === 0 || face === 3 ? -thickness : thickness);
      ribPos.setXYZ(
        j,
        Math.cos(a) * rr,
        (face < 2 ? 0.675 : -0.675) + 0.011 * Math.cos(a * 3 + 0.27),
        Math.sin(a) * rr,
      );
    }
    ribPos.needsUpdate = true;
    ribbon.computeVertexNormals();
    ribbon.computeBoundingSphere();
  }
  const curlSpecks = new T.InstancedMesh(new T.IcosahedronGeometry(1, 1), m.banana, 90);
  curlObj.add(curlSpecks);
  const edgeBead = group(scene);
  for (let j = 0; j < 5; j++)
    ball(edgeBead, (j - 2) * 0.117, 0.009, Math.sin(j * 0.8) * 0.012, 0.087, 0.016, 0.052, m.ice);
  batch(edgeBead);
  const clothWipe = group(scene);
  details.push(() => towel(clothWipe, 0.89, 0.77, [139, 155, 134]));
  const guide = group(scene),
    fingerMat = mat(0xf2e4c8, 0.54);
  ball(guide, 0.026, 0.08, 0.0, 0.155, 0.084, 0.177, fingerMat);
  for (let j = 0; j < 3; j++)
    ball(guide, 0.005 + j * 0.068, 0.085, -0.113, 0.048, 0.073, 0.094, fingerMat);
  ball(guide, -0.086, 0.073, -0.197, 0.054, 0.055, 0.186, fingerMat);
  const thumb = ball(guide, -0.143, 0.076, -0.008, 0.06, 0.071, 0.11, fingerMat);
  thumb.rotation.y = 0.55;
  ball(guide, 0.037, 0.1, 0.18, 0.104, 0.068, 0.117, m.mint);
  batch(guide);
  guide.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.depthWrite = false;
      o.castShadow = false;
    }
  });
  const guidePad = shadePad(0.73, 0.57, 0.18);
  // Small, stationary beads condense on genuinely exposed steel.
  const dewObj = new T.InstancedMesh(new T.SphereGeometry(1, 7, 4), mat(0xc9d4cf, 0.19, 0.35), 84),
    beads = [];
  for (let j = 0; j < 84; j++) {
    const a = rand() * tau,
      r = 2.16 + rand() * 0.31,
      x = r * Math.cos(a),
      z = r * Math.sin(a),
      idx = Math.round((z + sim.R) / sim.dx) * sim.N + Math.round((x + sim.R) / sim.dx);
    beads.push({ x, z, idx, sz: 0.004 + rand() * 0.014 });
  }
  scene.add(dewObj);
  // A low-intensity bloom confined to the practical lamp globes.
  const haloM = mat(0xffc578, 1, 0, {
    map: shadowMap,
    transparent: true,
    opacity: 0.15,
    emissive: 0xffc58a,
    emissiveIntensity: 1,
    blending: T.AdditiveBlending,
    depthWrite: false,
  });
  const haloGeo = new T.PlaneGeometry(0.43, 0.43);
  for (let j = -9; j <= 9; j++) {
    const x = j * 0.9 + 0.16;
    const halo = mesh(
      awning,
      haloGeo,
      haloM,
      x,
      -0.382 - 0.145 * Math.cos(x * 0.83) + 0.047,
      -0.226,
    );
    halo.rotation.x = -0.94;
    halo.castShadow = halo.receiveShadow = false;
  }
  const dust = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    mat(0xdfcdae, 0.92, 0, { transparent: true, opacity: 0.32, depthWrite: false }),
    28,
  );
  scene.add(dust);
  const mist = s.mist.map(() => {
    const o = mesh(
      scene,
      new T.PlaneGeometry(1, 1),
      mat(0xe3e7da, 0.98, 0, { map: shadowMap, transparent: true, opacity: 0, depthWrite: false }),
    );
    o.rotation.x = -1.17;
    o.castShadow = false;
    return o;
  });
  let narrow = false,
    aspect = 1,
    homeBladeX = 0,
    homeBladeZ = 0;
  function resize() {
    const w = innerWidth,
      h = innerHeight;
    aspect = w / h;
    narrow = aspect < 0.87;
    render.setSize(w, h, false);
    camera.aspect = aspect;
    const span = narrow ? Math.max(7.22, aspect * 9.5) : Math.max(9.8, aspect * 8.67);
    const dist = span / (2 * Math.tan((camera.fov * pi) / 360) * aspect),
      slope = narrow ? 0.805 : 0.807,
      cz = Math.sqrt(1 - slope * slope);
    const target = new T.Vector3(0, 0.05, narrow ? 0.1 : 0.09);
    camera.position.copy(target).add(new T.Vector3(0, dist * slope, dist * cz));
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    pitcherBase.set(narrow ? -2.23 : -3.64, narrow ? 0.217 : -0.047, narrow ? 1.52 : 0.43);
    sampleCup.position.set(narrow ? 1.15 : 3.54, narrow ? 0.208 : -0.133, narrow ? -2.56 : -1.59);
    sampleCup.rotation.set(0.035, 0.16, 0.009);
    sampleCup.scale.setScalar(1.16);
    cupBase.set(narrow ? 2.14 : 2.7, narrow ? -0.19 : -0.17, narrow ? -3.36 : -3.32);
    homeBladeX = narrow ? 1.59 : 1.92;
    homeBladeZ = narrow ? 0.99 : 0.66;
    tray.position.set(narrow ? -2.17 : -4.03, -0.19, narrow ? -3.3 : -2.3);
    tray.rotation.y = -0.32;
    tray.scale.setScalar(narrow ? 0.83 : 1.05);
    cloth.position.set(narrow ? -3.06 : -3.88, -0.213, narrow ? 2.72 : 0.94);
    cloth.rotation.y = narrow ? -0.32 : 0.22;
    coaster.position.copy(sampleCup.position);
    coaster.position.y -= 0.078;
    spoonGroup.position.set(narrow ? 3.16 : 4.41, -0.204, narrow ? 2.71 : 0.42);
    spoonGroup.rotation.y = 0.58;
    mother.position.set(narrow ? 0.72 : 2.5, 0.27, -4.21);
    mother.rotation.y = -0.12;
    rail.position.set(0, -0.142, narrow ? 3.67 : 3.53);
    rail.rotation.x = 0.055;
    awning.position.set(0, narrow ? 3.06 : 2.48, narrow ? -5.52 : -3.05);
    // Anchor the valance to the upper field across wider and taller views.
    const targetV = narrow ? 0.907 : 0.921;
    for (let i = 0; i < 5; i++) {
      const v = awning.position.clone().project(camera);
      camera.updateMatrixWorld();
      const high = awning.position
        .clone()
        .add(new T.Vector3(0, 1, 0))
        .project(camera);
      if (i > 0) awning.position.y += Math.max(-3, Math.min(3, (targetV - v.y) / (high.y - v.y)));
    }
    lanternL.position.set(
      narrow ? -3.22 : -5.86,
      awning.position.y - 0.46,
      awning.position.z - 0.3,
    );
    lanternR.position.set(narrow ? 3.35 : 5.74, awning.position.y - 0.49, awning.position.z - 0.26);
  }
  resize();
  addEventListener('resize', resize);
  const ray = new T.Raycaster(),
    ndc = new T.Vector2(),
    plane = new T.Plane(new T.Vector3(0, 1, 0), -hPlate);
  let captured = null,
    grabOffset = new T.Vector2(),
    lastFilm = -1;
  const worldHit = new T.Vector3();
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((e.clientY - rect.top) / rect.height) * 2,
    );
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, worldHit);
    return worldHit;
  }
  function hit(obj) {
    return obj.visible && ray.intersectObject(obj, true).length > 0;
  }
  function near(obj, x, z, r) {
    return Math.hypot(obj.position.x - x, obj.position.z - z) < r;
  }
  function pointerDown(e) {
    if (captured !== null) return;
    sound.init();
    const v = point(e),
      p = s.phase;
    const atBlade = hit(bladeObj),
      atCup = hit(cupObj);
    let allowed = false,
      x = v.x,
      z = v.z;
    if (p === 'ready') allowed = hit(jugObj) || hit(milkDrop) || near(jugObj, x, z, 0.67);
    if (p === 'spread' || p === 'edge') {
      const i = Math.round((x + sim.R) / sim.dx),
        j = Math.round((z + sim.R) / sim.dx),
        cell = i >= 0 && i < sim.N && j >= 0 && j < sim.N ? s.cells[j * sim.N + i] : null;
      allowed =
        atBlade ||
        hit(bananaObj) ||
        Boolean(cell && cell.h > 0.07) ||
        (Math.hypot(x - s.edge.x, z - s.edge.z) < 0.4 && p === 'edge');
    }
    if (p === 'curl') allowed = atBlade || hit(curlObj) || near(curlObj, x, z, 0.81);
    if (p === 'tip') allowed = atBlade || hit(curlObj);
    if (p === 'offer') allowed = atCup || hit(mamaArm);
    if (!allowed) {
      const target = hit(jugObj)
        ? 'jug'
        : atBlade
          ? 'blade'
          : atCup
            ? 'cup'
            : hit(bananaObj)
              ? 'banana'
              : '';
      if (target) sim.input('miss', target);
      return;
    }
    captured = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    if (atBlade && (p === 'spread' || p === 'edge' || p === 'curl')) {
      grabOffset.set(s.tool.x - x, s.tool.z - z);
      x = s.tool.x;
      z = s.tool.z;
    } else grabOffset.set(0, 0);
    sound.tap(s);
    sim.input('down', x, z, e.pointerType === 'mouse' ? 0.48 : e.pressure || 0.48);
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', (e) => {
    const v = point(e);
    if (s.phase === 'offer') sim.input('look', ndc.x, ndc.y);
    if (captured === e.pointerId)
      sim.input(
        'move',
        v.x + grabOffset.x,
        v.z + grabOffset.y,
        e.pointerType === 'mouse' ? 0.48 : e.pressure || 0.48,
      );
  });
  function release(e) {
    if (captured === e.pointerId) {
      sim.input('up');
      captured = null;
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    }
  }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
    canvas.addEventListener(event, release);
  let muted = false;
  document.querySelector('button').onclick = (e) => {
    sound.init();
    muted = !muted;
    sound.mute(muted);
    e.currentTarget.classList.toggle('muted', muted);
    e.currentTarget.setAttribute('aria-pressed', String(muted));
    e.currentTarget.setAttribute('aria-label', muted ? '音を出す' : '音を消す');
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      sim.input('up');
      captured = null;
      sound.mute(true);
    } else sound.mute(muted);
  });
  const lerp = (a, b, u) => a + (b - a) * u,
    cap = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
    ease = (v) => {
      v = cap(v);
      return v * v * (3 - 2 * v);
    };
  const axis = new T.Vector3(0, 1, 0),
    spout = new T.Vector3(),
    land = new T.Vector3(),
    diff = new T.Vector3();
  function bridge(obj, start, end, r) {
    diff.subVectors(end, start);
    obj.position.copy(start).lerp(end, 0.5);
    obj.scale.set(r, diff.length(), r);
    obj.quaternion.setFromUnitVectors(axis, diff.normalize());
  }
  function guideHand() {
    guide.visible = s.guide > 0.015;
    guidePad.visible = guide.visible;
    if (!guide.visible) return;
    const wave = s.guideAge,
      move = ease((wave - 0.7) / 1.7),
      show = ease(wave / 0.52) * (1 - ease((wave - 2.93) / 0.79));
    const g = guide.position,
      p = s.phase;
    if (p === 'ready') {
      g.copy(jugObj.position);
      g.add(new T.Vector3(0.07, 0.79 + 0.25 * (1 - move), 0.36 + 0.42 * (1 - move)));
    } else if (p === 'spread') {
      g.set(
        lerp(bladeObj.position.x, s.fruit.x, move),
        0.62 - 0.25 * move,
        lerp(bladeObj.position.z + 0.44, s.fruit.z + 0.31, move),
      );
    } else if (p === 'edge' || p === 'curl') {
      g.set(
        p === 'edge' ? s.edge.x : s.roll.x,
        0.55,
        p === 'edge' ? s.edge.z + 0.39 - move * 0.51 : s.roll.z + 0.42 - move * 0.76,
      );
    } else if (p === 'tip') {
      g.copy(bladeObj.position);
      g.y += 0.43 + 0.17 * move;
      g.z += 0.56 - 0.26 * move;
    } else {
      g.copy(cupObj.position);
      g.y += 0.81;
      g.z += 0.79 - move * 0.32;
    }
    guide.rotation.set(-0.46 - 0.18 * move, 0.14, -0.16);
    guide.scale.setScalar(1.4);
    guide.traverse((o) => {
      if (o.isMesh) o.material.opacity = s.guide * show * 0.84;
    });
    guidePad.position.set(g.x, hPlate + 0.022, g.z);
    guidePad.material.opacity = 0.13 * show * s.guide;
  }
  function draw() {
    const p = s.phase,
      t = s.tool,
      f = s.fruit,
      ro = s.roll,
      arriving = p === 'clean' && s.age > 13.82;
    const wobble = (tag) => (s.jostled === tag ? s.jostle : 0);
    const pour = s.tilt,
      jlift = ease(pour);
    jugObj.position.copy(pitcherBase);
    jugObj.position.x = lerp(pitcherBase.x, -1.05, jlift);
    jugObj.position.z = lerp(pitcherBase.z, 0.25, jlift);
    jugObj.position.y += 0.99 * jlift;
    jugObj.rotation.set(0.016, lerp(0.22, -0.06, pour), -0.86 * pour + wobble('jug'));
    jugObj.scale.setScalar(1.15);
    const surface = jugObj.userData.liquid,
      remaining = p === 'clean' ? ease((s.age - 11.8) / 3.0) : 1 - s.poured / s.amount;
    const liquidY = 0.148 + 0.765 * remaining,
      liquidR = 0.393 + 0.036 * (1 - remaining);
    surface.position.y = liquidY;
    surface.scale.set(liquidR, 1, liquidR);
    const surfacePos = surface.geometry.attributes.position;
    for (let i = 0; i < surfacePos.count; i++) {
      const rise = surfacePos.getX(i) * liquidR * Math.tan(0.86 * pour);
      surfacePos.setY(i, Math.min(1.026 - liquidY, rise));
    }
    surfacePos.needsUpdate = true;
    surface.geometry.computeVertexNormals();
    jugObj.updateMatrixWorld();
    spout.set(0.753, 1.059, 0);
    jugObj.localToWorld(spout);
    land.set(-0.36 + 0.17 * Math.sin(s.age * 0.83), hPlate + 0.028, 0.18 + 0.14 * Math.cos(s.age));
    milkDrop.visible = p === 'ready' || (p === 'pour' && s.drop < 1);
    milkDrop.position.copy(spout);
    milkDrop.position.y -= 0.063;
    milkDrop.scale.set(
      0.054 + s.beadLoad * 0.044,
      0.039 + s.beadStretch,
      0.054 + s.beadLoad * 0.044,
    );
    if (p === 'pour') {
      milkDrop.position.lerp(land, ease(s.drop));
      milkDrop.scale.y *= 1 + 0.7 * Math.sin(pi * s.drop);
    }
    milkStream.visible = s.flow > 0.025;
    if (milkStream.visible) {
      bridge(milkStream, spout, land, 0.043 * Math.sqrt(s.flow / 21));
    }
    jugShadow.position.set(jugObj.position.x, pitcherBase.y + 0.003, jugObj.position.z);
    jugShadow.material.opacity = 0.38 - 0.27 * pour;
    bananaObj.visible = (f.crush < 0.994 && p !== 'clean') || arriving;
    const squash = arriving ? 0 : f.crush,
      scale = 1.14 * (1 + 0.225 * squash);
    bananaObj.scale.set(scale, 1.14 * (1 - 0.989 * squash), scale);
    bananaObj.position.set(
      f.x,
      hPlate + 0.016 + (arriving ? (1 - ease((s.age - 13.82) / 1.05)) * 0.76 : 0),
      f.z,
    );
    bananaObj.rotation.y = -0.51;
    bananaObj.rotation.z = 0.025 + wobble('banana');
    fruitShadow.position.set(f.x, hPlate + 0.004, f.z);
    fruitShadow.visible = bananaObj.visible;
    const parked = p === 'ready' || p === 'pour' || p === 'clean',
      phaseLook = t.park;
    bladeObj.position.set(
      lerp(t.x, homeBladeX, phaseLook),
      hPlate + 0.032,
      lerp(t.z, homeBladeZ, phaseLook),
    );
    bladeObj.rotation.set(parked ? -0.04 : -0.49 + 0.44 * t.flat, t.yaw, wobble('blade'));
    if (p === 'curl' || p === 'tip' || p === 'offer') {
      bladeObj.position.set(ro.x, hPlate + 0.046, ro.z + 0.18);
      bladeObj.rotation.x = -0.19 - (p === 'offer' ? 0.42 * s.fall : 0);
    }
    edgeBead.visible = p === 'edge';
    edgeBead.position.set(s.edge.x, hPlate + 0.039, s.edge.z);

    const cupLip = ro.endZ - 0.69;
    const cupTravel =
      p === 'curl'
        ? ease((ro.length / Math.max(0.12, s.edge.z - ro.endZ) - 0.34) / 0.66)
        : p === 'tip' || p === 'offer'
          ? 1
          : p === 'clean'
            ? 1 - ease(s.age / 2.55)
            : 0;
    cupObj.position.copy(cupBase);
    cupObj.position.x = lerp(cupBase.x, ro.x + 0.05, cupTravel);
    cupObj.position.z = lerp(cupBase.z, cupLip, cupTravel);
    cupObj.position.y = lerp(cupBase.y, -0.8, cupTravel) + s.serve * 0.98;
    cupObj.rotation.set(
      0.07 + s.serve * 0.16,
      0.25 + s.wrist,
      0.05 - s.serve * 0.075 + wobble('cup'),
    );
    cupObj.scale.setScalar(1.14);
    const away = (narrow ? 7.22 : Math.max(9.8, aspect * 8.67)) * 0.74 + 1.2;
    if (p === 'clean') {
      const returning = s.age >= 3.4;
      const u = returning ? 1 - ease((s.age - 3.4) / 1.8) : s.handoff;
      cupObj.position.set(
        lerp(returning ? cupBase.x : ro.x + 0.05, away, u),
        lerp(returning ? cupBase.y : -0.8 + s.serve * 0.98, 0.7, u) + 0.26 * Math.sin(pi * u),
        lerp(returning ? cupBase.z : cupLip, -0.64, u),
      );
    }
    childHand.visible = p === 'clean' && s.age < 3.4;
    if (childHand.visible) {
      const reach = ease(s.age / 0.72);
      childHand.position.copy(cupObj.position);
      childHand.position.x += 0.52 + (1 - reach) * away;
      childHand.position.y += 0.52;
      childHand.position.z += 0.02;
      childHand.rotation.set(0.32, -1.47, 0.12);
    }
    mother.position.x = lerp(cupBase.x - 0.34, ro.x + 0.21, cupTravel);
    mamaArm.position.set(
      cupObj.position.x + 0.48,
      cupObj.position.y + 0.63,
      cupObj.position.z - 0.38,
    );
    mamaArm.rotation.set(0.26, -0.58, -0.3);
    if (p === 'clean') {
      const received = ease((s.age - 0.45) / 1.0);
      mamaArm.position.lerp(
        new T.Vector3(cupBase.x + 0.4, cupBase.y + 0.59, cupBase.z - 0.36),
        received,
      );
    }
    leftArm.position.set(mother.position.x - 0.69, 0.36, -3.46);
    leftArm.rotation.set(0.24, 0.63, 0.085);
    leftArm.scale.setScalar(0.97);
    if (arriving) {
      const a = ease((s.age - 13.5) / 0.64) * (1 - ease((s.age - 14.3) / 0.8));
      leftArm.position.lerp(new T.Vector3(f.x + 0.16, 0.84, f.z - 0.52), a);
    }
    joinSleeve(mamaArm, shoulders[0], 1);
    joinSleeve(leftArm, shoulders[1], -1);
    curlObj.visible = ['curl', 'tip', 'offer'].includes(p) || (p === 'clean' && s.age < 3.4);
    if (curlObj.visible) {
      const r = ro.radius;
      windRibbon(ro);
      curlObj.scale.set(1, r, r);
      curlObj.position.set(ro.x, hPlate + 0.016 + r, ro.z);
      curlObj.rotation.set(-ro.angle, -0.34, 0);
      const fall = p === 'offer' ? ease(s.fall) : p === 'clean' ? 1 : 0;
      if (fall) {
        curlObj.position.lerp(cupObj.position.clone().add(new T.Vector3(-0.03, 0.96, 0.28)), fall);
        curlObj.position.y += 0.34 * Math.sin(fall * pi);
        curlObj.rotation.z = fall * (1.37 - 0.14 * s.wrist);
        curlObj.rotation.y = fall * (0.16 + s.wrist);
        curlObj.scale.x = lerp(1, 0.71, fall);
      }
      let n = 0;
      const sections = ro.sections,
        step = Math.max(1, Math.ceil(sections.length / 105));
      for (let i = 0; i < sections.length && n < 88; i += step) {
        const sec = sections[i];
        if (sec.pulp < 0.00002) continue;
        const u = cap(sec.angle / (ro.angle + 0.001)),
          angle = 0.54 + sec.angle,
          core = Math.min(0.89, 0.041 / r),
          rad = core + (1 - core) * u;
        tmp.position.set(sec.offset, Math.cos(angle) * rad, Math.sin(angle) * rad);
        tmp.scale.set(0.023, 0.071, 0.067);
        tmp.rotation.set(0, 0, 0);
        tmp.updateMatrix();
        curlSpecks.setMatrixAt(n++, tmp.matrix);
        // The cut end exposes a second fleck at the original layer radius.
        if (n < 89 && sec.grains.length) {
          const grain = sec.grains.reduce((a, b) => (Math.abs(a[0]) > Math.abs(b[0]) ? a : b));
          if (Math.abs(grain[0]) > 0.27) {
            tmp.position.x = Math.sign(grain[0]) * 0.679;
            tmp.updateMatrix();
            curlSpecks.setMatrixAt(n++, tmp.matrix);
          }
        }
      }
      curlSpecks.count = n;
      curlSpecks.instanceMatrix.needsUpdate = true;
    }
    clothWipe.visible = p === 'clean' && s.wipe < 1;
    clothWipe.position.set(s.wipeX, hPlate + 0.038, s.wipeZ);
    clothWipe.scale.set(1.52, 1, 1.75);
    clothWipe.rotation.y = 0.095 * Math.sin(s.wipe * pi);
    if (s.time - lastFilm > 0.033 || lastFilm < 0) {
      updateFilm();
      lastFilm = s.time;
    }
    const ix = { ready: 0, pour: 0, spread: 1, edge: 2, curl: 2, tip: 3, offer: 3, clean: 3 }[p];
    for (let j = 0; j < 4; j++) {
      const active = j === ix;
      inlays[j].base.color.setHex(active ? 0xf2ddb3 : 0x335b4d);
      inlays[j].ink.color.setHex(active ? 0x365744 : 0xb3b89c);
    }
    for (let i = 0; i < beads.length; i++) {
      const b = beads[i],
        c = s.cells[b.idx],
        r = b.sz * (0.41 + 4 * c.dew) * (c.h > 0.1 ? 0.05 : 1);
      tmp.position.set(b.x, hPlate + 0.009, b.z);
      tmp.scale.set(r, r * 0.48, r);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      dewObj.setMatrixAt(i, tmp.matrix);
    }
    dewObj.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < s.motes.length; i++) {
      const a = s.motes[i];
      tmp.position.set(a.x, a.y, a.z);
      tmp.scale.setScalar(a.r);
      tmp.updateMatrix();
      dust.setMatrixAt(i, tmp.matrix);
    }
    dust.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < mist.length; i++) {
      const a = s.mist[i],
        o = mist[i];
      o.position.set(a.x, hPlate + a.y, a.z);
      o.material.opacity = a.moisture * 0.32;
      o.scale.set(0.37 + a.age * 0.12, 0.12 + a.age * 0.043, 1);
    }
    key.intensity = 3.05 + s.air * 0.025;
    guideHand();
    render.render(scene, camera);
  }
  let stamp = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - stamp) / 1000));
    stamp = now;
    if (!document.hidden) {
      sim.step(dt);
      sound.update(s);
      draw();
    }
    requestAnimationFrame(frame);
  }
  draw();
  requestAnimationFrame(frame);
  details.push(() => {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 80;
    const context = tile.getContext('2d');
    if (!context) return;
    const data = context.createImageData(80, 80);
    for (let i = 0; i < data.data.length; i += 4) {
      const value = rand() > 0.5 ? 255 : 0;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
      data.data[i + 3] = Math.floor(rand() * 8);
    }
    context.putImageData(data, 0, 0);
    document.querySelector('main').style.setProperty('--grain', 'url(' + tile.toDataURL() + ')');
  });
  function furnish() {
    const task = details.shift();
    if (task) task();
    if (details.length) requestAnimationFrame(() => setTimeout(furnish, 0));
  }
  requestAnimationFrame(() => setTimeout(furnish, 0));
})();
