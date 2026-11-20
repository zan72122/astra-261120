"use strict";
const blush = "#edb09a",
  skinMat = mat(0xeeb897, 0.78),
  hairMat = mat(0x493026, 0.68),
  hairLight = mat(0x583a2c, 0.73);
function faceTexture() {
  return makeTex(512, 512, (c) => {
    c.fillStyle = "#e9b799";
    c.fillRect(0, 0, 512, 512);
    function patch(x, y, r, co) {
      const g = c.createRadialGradient(x, y, 1, x, y, r);
      g.addColorStop(0, co);
      g.addColorStop(1, "rgba(237,160,143,0)");
      c.fillStyle = g;
      c.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    function line(col, w, pts) {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(...pts[0]);
      c.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]);
      c.stroke();
    }
    patch(256, 303, 47, "rgba(211,139,119,.15)");
    for (const s of [-1, 1]) {
      let x = 256 + 31 * s;
      patch(x + s * 10, 280, 24, "rgba(221,131,120,.48)");
      line("#785244", 3.6, [
        [x - 10, 233],
        [x - 5, 228],
        [x + 5, 228],
        [x + 11, 233]
      ]);
      c.fillStyle = "#fff1db";
      c.beginPath();
      c.moveTo(x - 10, 252);
      c.quadraticCurveTo(x, 241, x + 10, 251);
      c.quadraticCurveTo(x + 1, 258, x - 10, 252);
      c.fill();
      c.fillStyle = "#4a342d";
      c.beginPath();
      c.ellipse(x, 251, 4.1, 5.2, 0, 0, TAU);
      c.fill();
      line("#563b33", 2.3, [
        [x - 10, 252],
        [x - 4, 245],
        [x + 4, 246],
        [x + 10, 251]
      ]);
      c.fillStyle = "#fff4de";
      c.beginPath();
      c.arc(x - 1.2, 249, 0.95, 0, TAU);
      c.fill();
    }
    patch(256, 277, 10, "rgba(210,139,116,.6)");
    line("#ae7964", 1.9, [
      [249, 281],
      [250, 282],
      [251, 282],
      [252, 282]
    ]);
    line("#ae7964", 1.9, [
      [260, 282],
      [262, 282],
      [263, 281],
      [263, 281]
    ]);
    line("#a55f52", 3.1, [
      [242, 299],
      [250, 308],
      [261, 309],
      [270, 298]
    ]);
    line("#e5a796", 2.4, [
      [251, 308],
      [255, 309],
      [260, 309],
      [263, 307]
    ]);
  });
}
const faceMaterial = mat(0xffffff, 0.83, 0, { map: faceTexture() });
function param(p, nu, nv, fn, material) {
  const pos = [],
    uv = [],
    ix = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      pos.push(...fn(i / nu, j / nv));
      uv.push(i / nu, 1 - j / nv);
      if (i < nu && j < nv) {
        let k = j * (nu + 1) + i;
        ix.push(k, k + nu + 1, k + 1, k + 1, k + nu + 1, k + nu + 2);
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(ix);
  g.computeVertexNormals();
  return mesh(p, g, material);
}
function facePoint(u, t) {
  const a = (u - 0.5) * TAU,
    s = Math.sin(t * PI),
    e = Math.cos(t * PI),
    x = Math.sin(a) * s * (7.85 - 2.5 * Math.max(0, -e)),
    y = e * 10.05,
    z = Math.cos(a) * s * (7.7 + e * 0.5);
  const front = Math.max(0, Math.cos(a)) ** 6;
  const bump = (xx, yy, wx, wy) => Math.exp(-Math.pow((x - xx) / wx, 2) - Math.pow((y - yy) / wy, 2));
  return [
    x,
    y,
    z +
      front *
        (2.25 * bump(0, -1.4, 1.45, 2.5) +
          0.7 * bump(0, 0.3, 1, 3) +
          0.62 * (bump(-4, -2.1, 2.6, 2.4) + bump(4, -2.1, 2.6, 2.4)) +
          0.55 * bump(0, -4.5, 3.4, 1.5))
  ];
}
function hairEnd(a, girl, male) {
  let front = Math.cos(a);
  return (
    0.5 -
    0.16 * front +
    0.036 * Math.sin(a * 3 + 0.45) +
    0.014 * Math.cos(a * 5) +
    (girl ? 0.065 : 0) -
    (male ? 0.045 : 0)
  );
}
function hairPoint(a, t, girl, male) {
  const e = Math.cos(t * PI),
    s = Math.sin(t * PI);
  return [Math.sin(a) * s * 8.5, e * 10.6 + 0.25, Math.cos(a) * s * 8.4 - 0.35];
}
function makeHead(parent, girl, male, chef) {
  const head = group(parent, 0, 119.5, 1.25);
  param(head, 58, 32, facePoint, faceMaterial);
  for (const s of [-1, 1]) {
    const ear = ball(head, s * 7.6, -0.8, 0.45, 1.55, 2.3, 1.45, skinMat);
    ear.rotation.z = s * -0.16;
    ball(head, s * 8.6, -0.7, 0.7, 0.56, 1.04, 0.62, 0xd8967f);
  }
  param(
    head,
    64,
    24,
    (u, t) => {
      let a = (u - 0.5) * TAU;
      return hairPoint(a, t * hairEnd(a, girl, male), girl, male);
    },
    hairMat
  );
  for (let i = 0; i < 23; i++) {
    const az = (i / 23) * TAU - PI,
      pts = [];
    for (let j = 0; j < 10; j++) {
      const t = 0.075 + j * 0.098,
        a = az + 0.49 * (1 - t);
      let q = hairPoint(a, hairEnd(az, girl, male) * t, girl, male);
      q[0] *= 1.002;
      q[1] += 0.04;
      q[2] *= 1.005;
      pts.push(q);
    }
    path(head, pts, 0.075 + (i % 4) * 0.016, hairLight, 11);
  }
  if (girl) {
    for (const s of [-1, 1]) {
      for (let j = 0; j < 4; j++) {
        const lock = ball(
          head,
          s * (7.4 + 0.3 * Math.sin(j)),
          -4 - j * 2.1,
          -2.8,
          2.4 - j * 0.27,
          2.5,
          2.1 - j * 0.17,
          hairMat
        );
        lock.rotation.z = s * (j % 2 ? 0.35 : -0.3);
      }
      ball(head, s * 7.6, -10.9, -2.8, 1.5, 0.7, 1.6, 0xc75d4b);
      for (const b of [-1, 1]) {
        const bow = ball(head, s * 7.6 + b * 1.2, -11.15, -2.7, 1.5, 0.6, 0.73, 0xc66956);
        bow.rotation.z = b * 0.4;
      }
    }
  } else if (!male) {
    ball(head, 0, 1.9, -8.3, 5.9, 5.1, 4.8, hairMat);
    ring(head, 0, 1.5, -8.5, 4.4, 0.55, 0x987052);
  }
  if (chef) {
    const band = mat(0xf4e4c6, 0.93, 0, { map: tex.cloth, side: T.DoubleSide });
    param(
      head,
      58,
      12,
      (u, t) => {
        let a = (u - 0.5) * TAU,
          b = 0.19 + 0.13 * (1 - Math.cos(a)) * 0.5 + t * (0.115 + 0.15 * (1 - Math.cos(a)) * 0.5);
        let q = hairPoint(a, b);
        return [q[0] * 1.025, q[1] * 1.035, q[2] * 1.025];
      },
      band
    );
    for (let i = 0; i < 2; i++) {
      let knot = ball(head, -4 + i * 2, 1, -9, 2.5, 1.1, 2.4, band);
      knot.rotation.z = i ? -0.5 : 0.4;
    }
  }
  if (male) {
    const hat = group(head, 0, 5.8, -0.2);
    hat.rotation.z = -0.09;
    hat.rotation.x = -0.08;
    lathe(
      hat,
      0,
      0,
      0,
      [
        [0.2, -0.3],
        [9.3, -0.65],
        [11.4, -0.3],
        [11.5, 0.35],
        [9.0, 0.9],
        [7.7, 1.2],
        [7.6, 3.9],
        [6.6, 5.5],
        [3.8, 6.1],
        [0.1, 5.7]
      ],
      0xae9163,
      54
    );
    lathe(
      hat,
      0,
      0,
      0,
      [
        [7.9, 0.83],
        [7.7, 2.15]
      ],
      0x6c6151,
      50
    );
  }
  if (!girl && !male && !chef) {
    for (let s of [-1, 1]) {
      let lock = ball(head, s * 6.6, -2.4, -2.7, 2.2, 6.5, 3.6, hairMat);
      lock.rotation.z = -s * 0.1;
    }
  }
  batch(head);
  return head;
}
function shapeBody(p, profile, color, squash = 0.72) {
  const obj = lathe(p, 0, 0, 0, profile, color, 40);
  obj.scale.z = squash;
  return obj;
}
function makePerson(parent, x, y, z, type, angle = 0, scale = 1) {
  const g = group(parent, x, y, z),
    girl = type === "girl",
    chef = type === "chef",
    male = type === "dad";
  g.rotation.y = angle;
  g.scale.setScalar(scale);
  const body = group(g);
  const shirt = male ? 0xa68143 : chef ? 0xf6e8ce : girl ? 0xf9e9ce : 0xc57d65,
    apron = chef ? 0x668b77 : girl ? linen : male ? 0x696f67 : 0xb5a886;
  if (chef)
    for (const s of [-1, 1]) {
      rod(body, v(s * 6.7, 5, 0), v(s * 6.3, 62, 0), 4.0, male ? 0x606b65 : skinMat, 5.6);
      ball(body, s * 6.6, 3.2, 2.5, 4.3, 3.1, 8, 0x654b39);
    }
  shapeBody(
    body,
    [
      [1, 51],
      [14.6, 51.3],
      [15.3, 54],
      [12.1, 72],
      [10.3, 81],
      [11.7, 90],
      [13.4, 99],
      [13.3, 103],
      [10.6, 106],
      [5.3, 108],
      [3.8, 109]
    ],
    shirt
  );
  cyl(body, 0, 110.2, 0.5, 3.52, 4.0, 9.3, skinMat);
  shapeBody(
    body,
    [
      [0.2, 48],
      [15.1, 48.7],
      [15.4, 51],
      [11, 79],
      [10.7, 85]
    ],
    apron,
    0.77
  );
  if (chef || girl) {
    const bib = param(
      body,
      22,
      20,
      (u, t) => {
        let x = (u - 0.5) * (15.3 + 5.1 * t),
          y = 100 - 20 * t,
          rad = mix(13.5, 10.6, t);
        return [
          x,
          y,
          0.4 +
            rad * 0.72 * Math.sqrt(Math.max(0.01, 1 - (x * x) / (rad * rad))) +
            0.17 * Math.cos(x * 1.2) * t
        ];
      },
      typeof apron === "object" ? apron : m(apron)
    );
    bib.material.side = T.DoubleSide;
    for (const s of [-1, 1]) {
      path(
        body,
        [
          [s * 6.6, 83, 6.9],
          [s * 6.8, 97, 8.6],
          [s * 6.8, 105, 5.9],
          [s * 7.1, 107, 0],
          [s * 7.3, 101, -6.6]
        ],
        1.25,
        apron
      );
      ball(body, s * 6.5, 98.2, 9.2, 0.7, 0.7, 0.36, brass);
    }
  }
  if (male || (!girl && !chef)) {
    for (let k = 0; k < 4; k++) ball(body, 0, 102 - k * 5, 8.8 - k * 0.17, 0.55, 0.55, 0.35, 0x816c53);
    for (const s of [-1, 1]) {
      let collar = ball(body, s * 2.8, 105, 5.0, 3.5, 2, 0.65, shirt);
      collar.rotation.z = s * 0.43;
    }
  }
  if (chef || girl) {
    const pocket = group(body, 0, 71, 8.48);
    let pocketCloth = chef ? 0x789784 : linen;
    let pouch = ball(pocket, 0, 0, 0, 5.7, 4.7, 0.8, pocketCloth);
    path(
      pocket,
      [
        [-5.25, 2, 0.35],
        [-4.7, -1.7, 0.55],
        [0, -3.95, 0.76],
        [4.7, -1.7, 0.55],
        [5.25, 2, 0.35]
      ],
      0.1,
      0xe2c7a4
    );
    path(
      pocket,
      [
        [-5.2, 2.2, 0.5],
        [0, 2.5, 0.99],
        [5.2, 2.2, 0.5]
      ],
      0.16,
      0xd9c3a2
    );
  }
  const head = makeHead(body, girl, male, chef);
  head.rotation.x = 0.085;
  const scaleHead = girl ? 1.15 : 1;
  head.scale.setScalar(scaleHead);
  batchStaticBody(body, head);
  const legs = [];
  if (girl) {
    for (const s of [-1, 1]) {
      let x = s * 6.0,
        thigh = group(body, x, 54, 0),
        shin = group(thigh, 0, -25, 0),
        shoe = group(shin, 0, -25, 0);
      rod(thigh, v(), v(0, -25, 0), 4.4, skinMat, 3.0);
      ball(shin, 0, 0, 0, 3.05, 3.0, 2.95, skinMat);
      rod(shin, v(0, 0, 0), v(0, -25, 0), 3.05, skinMat, 2.15);
      cyl(shin, 0, -20.5, 0, 2.5, 2.4, 8, 0xf8e9d2);
      ball(shoe, 0, -0.45, 2.3, 3.7, 2.85, 6.7, 0x8d5840);
      ball(shoe, 0, -2.65, 2.2, 3.8, 0.7, 6.6, 0x6c503c);
      legs.push({ thigh, shin, shoe, s });
    }
  }
  let stride = 0;
  function walk(distance) {
    stride += distance * 0.115;
    const amp = Math.min(1, distance * 3.5);
    for (const l of legs) {
      let a = stride + (l.s < 0 ? PI : 0),
        swing = Math.sin(a) * amp * 0.32,
        knee = Math.max(0, -Math.cos(a)) * amp * 0.46;
      l.thigh.rotation.x = swing - knee * 0.38;
      l.shin.rotation.x = knee;
      l.shoe.rotation.x = -swing - knee * 0.42;
    }
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const shoulder = v(s * 10.9, 102, 0.2),
      upper = group(body),
      lower = group(body),
      hand = group(body);
    ball(upper, 0, 1.2, 0, 4.6, 3.6, 4.6, shirt);
    lathe(
      upper,
      0,
      0,
      0,
      [
        [3.1, 0],
        [4.7, 1.5],
        [5.1, 4],
        [4.4, 12],
        [3.75, 18],
        [3.7, 20]
      ],
      shirt,
      24
    );
    cyl(upper, 0, 19.2, 0, 3.95, 3.85, 2.1, shirt, 24);
    ring(upper, 0, 18.5, 0, 3.9, 0.105, chef ? 0xe1cfb4 : girl ? 0xe8c9b0 : shirt);
    ball(lower, 0, 0.4, 0, 3.05, 3.12, 3.02, skinMat);
    lathe(
      lower,
      0,
      0,
      0,
      [
        [2.9, -1],
        [3.15, 1],
        [3.3, 5],
        [2.6, 14],
        [2.15, 20],
        [1.95, 21]
      ],
      skinMat,
      20
    );
    ball(hand, 0, 0.8, 0, 2.35, 2.9, 1.3, skinMat);
    for (let j = 0; j < 4; j++) {
      const f = ball(
        hand,
        (j - 1.5) * 0.99,
        3.1 + (j === 1 || j === 2 ? 0.55 : 0),
        0.25,
        0.58,
        2.15,
        0.73,
        skinMat
      );
      f.rotation.z = (j - 1.5) * -0.06;
    }
    ball(hand, -s * 2, 1.55, 0.45, 0.85, 1.7, 1, skinMat).rotation.z = -s * 0.36;
    batch(upper);
    batch(lower);
    batch(hand);
    arms.push({ shoulder, upper, lower, hand, s });
  }
  function pose(i, target) {
    const a = arms[i],
      d = target.clone().sub(a.shoulder);
    let len = clamp(d.length(), 5, 40.7);
    d.normalize();
    const reach = a.shoulder.clone().addScaledVector(d, len),
      side = v(a.s * 0.75, -0.84, -0.45);
    side.addScaledVector(d, -side.dot(d)).normalize();
    const along = (20 * 20 - 21 * 21 + len * len) / (2 * len),
      elbow = a.shoulder
        .clone()
        .addScaledVector(d, along)
        .addScaledVector(side, Math.sqrt(Math.max(0, 400 - along * along)));
    for (const [obj, from, to] of [
      [a.upper, a.shoulder, elbow],
      [a.lower, elbow, reach]
    ]) {
      obj.position.copy(from);
      obj.quaternion.setFromUnitVectors(v(0, 1), to.clone().sub(from).normalize());
    }
    a.hand.position.copy(reach);
    a.hand.quaternion.copy(a.lower.quaternion);
  }
  pose(0, v(-12, chef ? 82 : 68, chef ? 24 : 8));
  pose(1, v(12, chef ? 83 : 69, chef ? 24 : 9));
  return { root: g, body, head, pose, arms, walk };
}
function batchStaticBody(body, head) {
  body.remove(head);
  batch(body);
  body.add(head);
}
