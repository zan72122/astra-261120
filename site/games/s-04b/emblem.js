"use strict";
// Painted shop sign. All paths and pigments are part of the game.
function sweetSign(canvas) {
  canvas.width = 320;
  canvas.height = 340;
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  c.translate(80, 88);
  function path(points, fill, stroke, width = 1) {
    const p = new Path2D(points);
    if (fill) {
      c.fillStyle = fill;
      c.fill(p);
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = width;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.stroke(p);
    }
    return p;
  }
  function grad(x, y, X, Y, stops) {
    const g = c.createLinearGradient(x, y, X, Y);
    stops.forEach((color, i) => g.addColorStop(i / (stops.length - 1), color));
    return g;
  }
  function ellipse(x, y, rx, ry, col, a = 0) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
    c.fill();
  }
  c.save();
  c.scale(1, 0.97);
  c.beginPath();
  for (let j = 0; j <= 460; j++) {
    const a = (j / 460) * Math.PI * 2,
      r = 72.5 + 1.65 * Math.cos(22 * a);
    c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  c.closePath();
  c.fillStyle = "#f8e7c5";
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = "#ad7c4f";
  c.stroke();
  c.beginPath();
  c.arc(0, 0, 66.6, 0, Math.PI * 2);
  c.lineWidth = 1.45;
  c.strokeStyle = "#c97157";
  c.stroke();
  c.setLineDash([1.2, 3.4]);
  c.beginPath();
  c.arc(0, 0, 63.5, 0, Math.PI * 2);
  c.lineWidth = 0.75;
  c.strokeStyle = "#bc916d";
  c.stroke();
  c.setLineDash([]);
  c.restore();
  c.save();
  c.rotate(0.2);
  path(
    "M-29 -31 Q-34 -24 -29 -14 L-7 51 Q-5 57 -2 57 Q2 56 3 53 L31 -25 Q29 -39 17 -40 Q1 -51 -9 -45 Q-25 -47 -29 -31Z",
    grad(-30, -33, 22, 35, ["#e9aa59", "#ffdc95", "#ca8446"]),
    "#ab6f42",
    1.5
  );
  path("M-26 -25 Q-11 -38 5 -35 Q25 -37 28 -22 Q17 -6 -2 -9 Q-21 -8 -26 -25Z", "#c8874d");
  let s = 41;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 62; i++) {
    let y = rnd() * 68 - 36,
      w = (53 - y) * 0.32;
    ellipse((rnd() - 0.5) * 2 * w, y, 0.4 + rnd() * 1.5, 0.4 + rnd() * 1.3, "#c48b4e", rnd() * 2);
  }
  function whip(x, y, a, sz) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(sz, sz);
    path(
      "M-11 1 Q-14 -5 -7 -9 Q-9 -14 -2 -16 Q2 -18 0 -22 Q11 -19 9 -12 Q16 -10 12 -4 Q14 1 8 4 Q-3 8 -11 1Z",
      grad(-7, -17, 7, 6, ["#fffdf0", "#fff2d4", "#e6cf9c"]),
      "#c7ad80",
      0.95
    );
    path("M-8 -7 Q0 -3 7 -11 M-9 -1 Q0 3 9 -4 M-4 -14 Q1 -13 3 -17", null, "#d9c499", 1.1);
    c.restore();
  }
  function berry(x, y, a, sz, cut = false) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(sz, sz);
    path(
      "M-12 -4 Q-13 -13 -4 -14 Q-1 -14 1 -12 Q9 -16 13 -9 Q17 -2 9 9 Q3 18 0 18 Q-4 17 -9 7 Q-12 0 -12 -4Z",
      grad(-10, -9, 10, 14, ["#fa8a5a", "#e94c36", "#b94735"]),
      "#ad4030",
      1.15
    );
    if (cut) {
      path("M-9 -6 Q-8 -11 -2 -9 Q0 -6 3 -10 Q13 -15 10 -1 Q7 9 1 13 Q-5 6 -9 -6Z", "#f48e6c");
      path("M-5 -7 Q0 -7 1 -4 Q4 -9 7 -7 Q6 -1 2 7 Q0 4 -5 -7Z", "#ffd1a3");
    }
    for (let j = 0; j < 4; j++)
      for (let i = 0; i < 3; i++) {
        let xx = (i - 1) * (7 - j * 1.02) + ((j % 2) - 0.5) * 1.3,
          yy = -8 + j * 5.9;
        ellipse(xx, yy, 0.65, 1.15, "#ffcd8a", xx * 0.035);
      }
    c.restore();
  }
  function banana(x, y, a) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    ellipse(0, 0, 9.3, 11.5, "#bc914f");
    ellipse(-0.5, -1.6, 9, 11, "#ffe4a1");
    ellipse(-0.6, -1.6, 7.5, 9.2, "#fff0bd");
    for (let i = 0; i < 3; i++) {
      let b = i * 2.09;
      ellipse(Math.sin(b) * 2, Math.cos(b) * 2 - 2, 0.65, 1.6, "#c39c64", -b);
    }
    c.restore();
  }
  whip(-16, -27, -0.37, 1);
  berry(-10, -37, -0.44, 0.82);
  banana(11, -36, 0.51);
  whip(5, -29, 0.18, 0.83);
  berry(18, -24, 0.42, 0.87, true);
  berry(-11, -21, -0.2, 0.83, true);
  whip(1, -15, 0.1, 0.67);
  path(
    "M-27 -16 Q-11 -8 8 -9 Q-13 3 -4 49 Q-8 48 -10 40Z",
    grad(-21, -13, -3, 45, ["#f5c075", "#e2a55f"]),
    "#bc8751",
    0.95
  );
  const wrap = path("M-22 0 Q-1 10 24 -4 L3 54 Q1 59 -3 58 Q-6 58 -8 52Z", "#f3d7b5", "#ba8866", 1.25);
  c.save();
  c.clip(wrap);
  for (let k = -45; k < 45; k += 7) {
    c.fillStyle = "rgba(192,86,65,.42)";
    c.fillRect(k, -6, 3.2, 70);
  }
  for (let k = -6; k < 62; k += 7) {
    c.fillStyle = "rgba(196,85,65,.41)";
    c.fillRect(-30, k, 60, 3.2);
  }
  c.restore();
  path("M-22 0 Q-2 10 24 -4 L22 .6 Q-1 14 -21 4Z", "#fff1d8", "#bb8c68", 0.62);
  c.restore();
  for (const side of [-1, 1]) {
    c.save();
    c.scale(side, 1);
    path("M40 30 Q51 19 51 1", null, "#859169", 1.1);
    for (let i = 0; i < 3; i++) {
      ellipse(47 + i * 1.45, 22 - i * 7, 2.1, 4.3, "#96a17a", -0.85);
      ellipse(50 + i * 0.9, 18 - i * 6.6, 1.8, 3.8, "#85956e", 0.72);
    }
    c.restore();
  }
}
sweetSign(document.querySelector("#emblem"));
