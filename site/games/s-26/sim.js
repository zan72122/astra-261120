/* Lengths on the work surface are decimetres. Film depths are millimetres. */
(function (root) {
  'use strict';
  const N = 49,
    R = 2.49,
    dx = (2 * R) / (N - 1),
    area = dx * dx * 10;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const approach = (x, y, k, dt) => x + (y - x) * -Math.expm1(-k * dt);
  function create(options = {}) {
    const s = {
      phase: 'ready',
      age: 0,
      time: 0,
      idle: 0,
      batches: 0,
      amount: options.amount ?? 119,
      initialTemp: options.temperature ?? 12,
      poured: 0,
      tilt: 0,
      beadLoad: 0.11,
      beadStretch: 0.048,
      beadVelocity: 0,
      drop: 0,
      flow: 0,
      guide: 0,
      condensation: 0,
      air: 0.2,
      tool: {
        x: 1.32,
        z: 1.22,
        tx: 1.32,
        tz: 1.22,
        vx: 0,
        vz: 0,
        flat: 0.2,
        force: 0,
        park: 1,
        yaw: 0.66,
      },
      fruit: { x: -0.28, z: -0.03, crush: 0, grain: 3.7 },
      roll: {
        x: 0,
        z: 0,
        radius: 0.045,
        endZ: -2.38,
        angle: 0,
        volume: 0,
        length: 0,
        sections: [],
      },
      edge: { x: 0, z: 0 },
      pressed: false,
      moved: 0,
      wet: 0,
      dry: 0,
      serve: 0,
      wrist: 0,
      gaze: 0,
      wipe: 0,
      wipeX: -R,
      wipeZ: 0,
      handoff: 0,
      fall: 0,
      cells: [],
      guideAge: 0,
      guideRest: 0,
      guideSpeed: 1,
      jostled: '',
      jostle: 0,
      jostleSpeed: 0,
      motes: [],
      mist: [],
    };
    let load = 0,
      carry = 0,
      rollingGoal = 0,
      rollStart = 0,
      spreadWork = 0,
      ambientTick = 0,
      seed = 7919,
      pourU = 0,
      firstDrop = false;
    const delta = new Float64Array(N * N),
      particles = new Float64Array(N * N),
      thermal = new Float64Array(N * N);
    const frost = new Float64Array(N * N),
      neighbors = [];
    let activeCount = 0;
    function rand() {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const x = -R + i * dx,
          z = -R + j * dx,
          active = x * x + z * z < (R - 0.035) ** 2;
        if (active) activeCount++;
        const chill = -17 + 2.8 * Math.sin(1.8 * x + 0.65 * z) + 1.2 * Math.cos(z * 3);
        s.cells.push({
          x,
          z,
          active,
          obstacle: clamp((0.53 - Math.hypot(x - s.fruit.x, z - s.fruit.z)) / 0.15, 0, 1),
          contactHeat: 0,
          contactIce: 0,
          peel: 0,
          cooling: 0.32 + 0.025 * Math.cos(x * 4),
          dewGoal: 0.16 + 0.05 * Math.cos(z * 2.8 + x),
          dewRate: 0.023 + 0.011 * (1 + Math.sin(x * 3)),
          h: 0,
          ice: 0,
          temp: chill,
          plate: chill,
          fruit: 0,
          dew: 0.015 + rand() * 0.026,
          base: chill,
        });
      }
    for (let k = 0; k < s.cells.length; k++)
      if (s.cells[k].active) {
        if (k % N < N - 1 && s.cells[k + 1].active) neighbors.push(k, k + 1);
        if (k + N < N * N && s.cells[k + N].active) neighbors.push(k, k + N);
      }
    for (let k = 0; k < 28; k++)
      s.motes.push({
        x: (rand() - 0.5) * 12,
        y: rand() * 3,
        z: (rand() - 0.5) * 6,
        v: 0.008 + rand() * 0.035,
        r: 0.003 + rand() * 0.006,
      });
    for (let k = 0; k < 11; k++) {
      const a = rand() * Math.PI * 2,
        x = 2.35 * Math.cos(a),
        z = 2.35 * Math.sin(a);
      s.mist.push({
        x,
        z,
        ox: x,
        oz: z,
        y: 0.015,
        moisture: rand() * 0.3,
        vx: 0,
        vz: 0,
        age: rand() * 4,
        cell: Math.round((z + R) / dx) * N + Math.round((x + R) / dx),
      });
    }
    function phase(p) {
      s.phase = p;
      s.age = 0;
      s.pressed = false;
      s.idle = 0;
      s.guideAge = 0;
    }
    function disk(x, z, r, fn) {
      const loI = clamp(Math.floor((x - r + R) / dx), 0, N - 1),
        hiI = clamp(Math.ceil((x + r + R) / dx), 0, N - 1);
      const loJ = clamp(Math.floor((z - r + R) / dx), 0, N - 1),
        hiJ = clamp(Math.ceil((z + r + R) / dx), 0, N - 1);
      for (let j = loJ; j <= hiJ; j++)
        for (let i = loI; i <= hiI; i++) {
          const k = j * N + i,
            c = s.cells[k],
            d = Math.hypot(x - c.x, z - c.z);
          if (c.active && d < r) fn(c, k, 1 - d / r);
        }
    }
    function deposit(x, z, ml, r) {
      let total = 0;
      disk(x, z, r, (c, k, w) => {
        total += w * w * (1 - c.obstacle * (1 - s.fruit.crush));
      });
      if (!total) return;
      disk(x, z, r, (c, k, w) => {
        const add = (ml * w * w * (1 - c.obstacle * (1 - s.fruit.crush))) / (total * area);
        c.contactHeat += ((s.initialTemp - c.temp - c.contactHeat) * add) / (c.h + add + 0.6);
        c.ice *= 1 - add / (c.h + add + 0.19);
        c.h += add;
      });
    }
    function aim(x, z) {
      const m = Math.hypot(x, z),
        f = m > R - 0.04 ? (R - 0.04) / m : 1;
      s.tool.tx = x * f;
      s.tool.tz = z * f;
    }
    function input(kind, x, z, pressure = 0.48) {
      const p = s.phase;
      if (kind === 'up') {
        if (s.phase === 'offer' && s.pressed && s.serve > 0.83 && s.moved < 0.24) phase('clean');
        s.pressed = false;
        return;
      }
      if (kind === 'look') {
        s.gaze = clamp(x, -1, 1);
        return;
      }
      if (kind === 'miss') {
        s.jostled = x;
        s.jostleSpeed = 0.48;
        return;
      }
      s.idle = 0;
      load = clamp(pressure, 0.15, 1);
      if (kind === 'down') {
        if (p === 'ready') {
          phase('pour');
          s.drop = 0.001;
          return;
        }
        if (p === 'tip') {
          phase('offer');
          return;
        }
        if (p === 'offer') s.gaze = clamp(x, -1, 1);
        if (p === 'edge') {
          const guided =
            Math.hypot(x - s.edge.x, z - s.edge.z) < 0.68 ||
            Math.hypot(x - s.tool.x, z - s.tool.z) < 0.72;
          let chosen = null,
            closest = 0.28;
          if (!guided)
            disk(x, z, 0.28, (c, k) => {
              const d = Math.hypot(c.x - x, c.z - z);
              if (d >= closest || c.ice < 0.5 || c.h < 0.13 || c.z < -1.8) return;
              const border = [k - 2, k + 2, k - 2 * N, k + 2 * N].some(
                (j) => !s.cells[j]?.active || s.cells[j].h < c.h * 0.39,
              );
              if (border) {
                chosen = c;
                closest = d;
              }
            });
          if (guided || chosen) {
            if (chosen) {
              s.edge.x = chosen.x;
              s.edge.z = chosen.z;
            }
            phase('curl');
            s.roll.x = s.edge.x;
            s.roll.z = s.edge.z;
            rollStart = s.edge.z;
            rollingGoal = 0;
            s.roll.endZ = -Math.sqrt(Math.max(0.09, 2.38 ** 2 - s.edge.x ** 2));
            aim(s.edge.x, s.edge.z);
            s.pressed = true;
            return;
          }
        }
        if (p === 'curl')
          rollingGoal = Math.min(
            rollStart - s.roll.endZ,
            Math.max(rollingGoal, s.roll.length + 0.26),
          );
        s.pressed = true;
        s.moved = 0;
      }
      if ((p === 'spread' || p === 'edge') && s.pressed) {
        s.moved += Math.min(0.4, Math.hypot(x - s.tool.tx, z - s.tool.tz));
        aim(x, z);
      }
      if (p === 'curl' && s.pressed && kind === 'move') {
        rollingGoal = Math.max(rollingGoal, rollStart - z);
        aim(clamp(x, s.edge.x - 0.58, s.edge.x + 0.58), rollStart - rollingGoal);
      }
      if (p === 'offer' && kind === 'move') {
        s.moved += Math.abs(s.gaze - clamp(x, -1, 1));
        s.gaze = clamp(x, -1, 1);
      }
    }
    function physics(dt) {
      s.time += dt;
      s.age += dt;
      if (!s.pressed) s.idle += dt;
      else s.idle = 0;
      s.guide = approach(
        s.guide,
        s.idle > 4 && ['ready', 'spread', 'edge', 'curl', 'tip', 'offer'].includes(s.phase) ? 1 : 0,
        4,
        dt,
      );
      if (s.guide > 0.02) {
        if (s.guideRest > 0) s.guideRest -= dt;
        else s.guideAge += dt * s.guideSpeed;
        if (s.guideAge > 3.78) {
          s.guideAge = 0;
          s.guideRest = 0.65 + rand() * 1.6;
          s.guideSpeed = 0.81 + rand() * 0.34;
        }
      } else {
        s.guideAge = 0;
        s.guideRest = 0;
      }
      s.jostleSpeed += (-64 * s.jostle - 9 * s.jostleSpeed) * dt;
      s.jostle += s.jostleSpeed * dt;
      ambientTick -= dt;
      if (ambientTick <= 0) {
        carry = (rand() - 0.42) * 0.7;
        ambientTick = 0.4 + rand() * 1.6;
      }
      s.air = approach(s.air, carry, 0.75, dt);
      for (const a of s.motes) {
        a.y += a.v * dt;
        a.x += dt * s.air * 0.17;
        if (a.y > 3.1) {
          a.y = 0.02;
          a.x = (rand() - 0.5) * 12;
        }
      }
      for (const a of s.mist) {
        const c = s.cells[a.cell];
        a.age += dt;
        const vapor = (c.dew * (1 - c.h / (1 + c.h)) * Math.max(0, -c.plate)) / 18;
        a.moisture = approach(a.moisture, a.age < 2.7 ? vapor : 0, a.age < 2.7 ? 0.44 : 1.4, dt);
        a.vx = approach(a.vx, s.air * 0.21 + 0.017 * a.ox, 0.6, dt);
        a.vz = approach(a.vz, 0.021 * a.oz, 0.5, dt);
        a.x += dt * a.vx;
        a.z += dt * a.vz;
        a.y += (dt * 0.026) / (1 + a.age * 0.3);
        if (a.age > 4 && a.moisture < 0.003) {
          a.x = a.ox;
          a.z = a.oz;
          a.y = 0.015;
          a.age = rand() * 0.4;
        }
      }
      s.tilt = approach(s.tilt, s.phase === 'pour' && s.poured < s.amount - 0.02 ? 1 : 0, 3.6, dt);
      if (s.phase === 'ready') {
        s.beadLoad = approach(s.beadLoad, 0.24, 0.057, dt);
        s.beadVelocity +=
          (29 * (0.035 + s.beadLoad * 0.18 + s.air * 0.012 - s.beadStretch) -
            4.1 * s.beadVelocity) *
          dt;
        s.beadStretch += s.beadVelocity * dt;
      }
      if (s.phase === 'pour') {
        s.drop = Math.min(1, s.drop + dt * (0.4 + 4.8 * s.drop));
        if (s.drop >= 0.998 && !firstDrop) {
          const dose = Math.min(s.amount, s.beadLoad);
          deposit(-0.36, 0.32, dose, 0.18);
          s.poured += dose;
          firstDrop = true;
        }
        const targetFlow = s.drop >= 0.998 && s.poured < s.amount - 0.001 ? 21 : 0;
        s.flow = approach(s.flow, targetFlow, 3.3, dt);
        const ml = Math.min(s.amount - s.poured, s.flow * dt);
        if (ml > 0) {
          pourU += dt;
          deposit(-0.36 + 0.17 * Math.sin(pourU * 0.83), 0.18 + 0.14 * Math.cos(pourU), ml, 0.73);
          s.poured += ml;
        }
        if (s.poured >= s.amount - 0.001 && s.flow < 0.55) {
          phase('spread');
          aim(0.65, 0.47);
        }
      }
      const tool = s.tool,
        fruit = s.fruit,
        roll = s.roll;
      if (s.phase === 'curl') {
        if (s.pressed) rollingGoal = Math.min(rollStart - s.roll.endZ, rollingGoal + dt * 0.22);
        const desired = Math.min(rollStart - s.roll.endZ, Math.max(0, rollingGoal));
        roll.length += clamp(desired - roll.length, 0, dt * 1.38);
        const nx = approach(roll.x, tool.tx, 3, dt),
          nz = rollStart - roll.length;
        const travel = Math.hypot(nx - roll.x, nz - roll.z);
        roll.x = nx;
        roll.z = nz;
        roll.endZ = -Math.sqrt(Math.max(0.09, 2.38 ** 2 - nx ** 2));
        tool.tz = nz + 0.18;
        if (travel > 0.000001) {
          let vol = 0,
            pulp = 0,
            weightedX = 0;
          const grains = [];
          disk(nx, nz, 0.74, (c, k, w) => {
            const dz = Math.abs(c.z - nz),
              ax = c.x - nx;
            if (dz > 0.135 || Math.abs(ax) > 0.69 || c.h < 0.001) return;
            const exposed =
              clamp((Math.min(c.z + 0.096, rollStart) - nz) / 0.192, 0, 1) *
              clamp((0.69 - Math.abs(ax)) / 0.055, 0, 1);
            const fraction = clamp((exposed - c.peel) / Math.max(0.0001, 1 - c.peel), 0, 1);
            const q = c.h * fraction;
            c.peel = Math.max(c.peel, exposed);
            const part = (c.fruit * q) / c.h;
            c.fruit -= part;
            c.h -= q;
            vol += q * area;
            pulp += part;
            weightedX += part * ax;
            if (part > 0.00006) grains.push([ax, c.z, part]);
          });
          roll.volume += vol;
          roll.angle += (travel / (roll.radius + 0.018)) * Math.min(1, vol / (travel * 1.7));
          if (vol > 0.0001)
            roll.sections.push({
              z: nz,
              x: nx,
              volume: vol,
              angle: roll.angle,
              pulp,
              offset: pulp ? weightedX / pulp : 0,
              grains,
            });
          roll.radius = Math.sqrt(0.045 ** 2 + roll.volume / (Math.PI * 13.8 * 10));
        }
        if (roll.z <= roll.endZ + 0.015 && Math.abs(tool.z - roll.z) < 0.45) phase('tip');
      }
      if (s.phase === 'edge' && !s.pressed && s.idle > 1.3) aim(s.edge.x, s.edge.z + 0.11);
      tool.vx +=
        (Math.max(-5, Math.min(5, (tool.tx - tool.x) * 7)) - tool.vx) * -Math.expm1(-14 * dt);
      tool.vz +=
        (Math.max(-5, Math.min(5, (tool.tz - tool.z) * 7)) - tool.vz) * -Math.expm1(-14 * dt);
      tool.x += tool.vx * dt;
      tool.z += tool.vz * dt;
      const parked = ['ready', 'pour', 'clean'].includes(s.phase);
      tool.park = approach(tool.park, parked ? 1 : 0, 3.4, dt);
      tool.yaw = approach(
        tool.yaw,
        parked
          ? 0.66
          : ['curl', 'tip', 'offer'].includes(s.phase)
            ? -0.34
            : clamp(-tool.vx * 0.2, -0.66, 0.66) - 0.1,
        4,
        dt,
      );
      const speed = Math.hypot(tool.vx, tool.vz);
      tool.force = approach(tool.force, s.pressed ? load : 0, 8, dt);
      tool.flat = approach(
        tool.flat,
        clamp(0.19 + speed * 0.29 + Math.min(s.moved, 2) * 0.15 - load * 0.1, 0.15, 1),
        3.4,
        dt,
      );
      let wet = 0,
        dry = 0;
      if ((s.phase === 'spread' || s.phase === 'edge') && tool.force > 0.012) {
        const distance = Math.hypot(tool.x - fruit.x, tool.z - fruit.z);
        const press = tool.force * Math.max(0, 1 - distance / 0.94);
        const crushed = Math.min(1 - fruit.crush, dt * press * (1.22 + 0.12 * speed));
        fruit.crush += crushed;
        fruit.grain = Math.max(0.65, fruit.grain - crushed * (1.45 + load * 1.45));
        if (crushed > 0)
          disk(fruit.x, fruit.z, 0.48, (c, k, w) => {
            c.fruit += crushed * w * (0.45 + 0.38 * Math.cos(c.x * 27 + c.z * 21));
          });
        // Each blade contact moves material to neighbouring cells on the leading lip.
        const width = 0.26 + 0.59 * tool.flat,
          ix = tool.vx / (speed + 0.01),
          iz = tool.vz / (speed + 0.01);
        disk(tool.x, tool.z, width, (c, k, w) => {
          if (c.h < 0.001) return;
          const drag = (0.4 + speed * 0.65) * tool.force * w,
            q = c.h * -Math.expm1(-drag * (1 - 0.82 * c.ice) * dt * 5);
          const ox = c.x - tool.x,
            oz = c.z - tool.z,
            d = Math.hypot(ox, oz) || 1;
          const transverse = -iz * ox + ix * oz;
          const sideways =
            Math.sign(transverse) *
            0.37 *
            tool.flat ** 1.7 *
            clamp(speed, 0, 1) *
            Math.max(0, 1 - Math.abs(transverse) / width);
          const destI = clamp(
            Math.round((c.x + dx * (1.18 * ix + (0.91 * ox) / d) - iz * sideways + R) / dx),
            0,
            N - 1,
          );
          const destJ = clamp(
            Math.round((c.z + dx * (1.18 * iz + (0.91 * oz) / d) + ix * sideways + R) / dx),
            0,
            N - 1,
          );
          const dest = destJ * N + destI;
          if (dest !== k && s.cells[dest].active) {
            const f = (c.fruit * q) / Math.max(0.01, c.h);
            delta[k] -= q;
            delta[dest] += q;
            particles[k] -= f;
            particles[dest] += f;
            frost[dest] += q * c.ice;
            frost[k] -= q * c.ice;
            thermal[dest] += q * c.temp;
            thermal[k] -= q * c.temp;
            spreadWork += q * area;
          }
          wet += drag * (1 - c.ice) * 0.08;
          dry += drag * c.ice * 0.09;
        });
      }
      if (s.phase === 'curl') dry = (Math.abs(tool.vz) + Math.abs(tool.vx)) * (0.55 + roll.radius);
      s.wet = approach(s.wet, Math.min(1, wet), 11, dt);
      s.dry = approach(s.dry, Math.min(1, dry), 9, dt);
      // Symmetric conservative flux. Thin, frozen edges resist refilling.
      if (s.poured > 0) {
        for (let n = 0; n < neighbors.length; n += 2) {
          const a = neighbors[n],
            b = neighbors[n + 1],
            ca = s.cells[a],
            cb = s.cells[b];
          const barrier = 17 * (1 - fruit.crush),
            ha = ca.h + barrier * ca.obstacle,
            hb = cb.h + barrier * cb.obstacle;
          const hi = ha > hb ? ca : cb;
          if (hi.h < 0.009) continue;
          const from = hi === ca ? a : b,
            to = hi === ca ? b : a;
          const mobility = (1 - hi.ice) ** 3;
          const q = Math.min(
            hi.h * 0.1,
            dt * 3.2,
            Math.max(0, Math.abs(ha - hb) - 0.012) *
              dt *
              3.2 *
              mobility *
              (0.7 + Math.min(8, hi.h)),
          );
          delta[from] -= q;
          delta[to] += q;
          const f = (hi.fruit * q) / Math.max(0.01, hi.h);
          frost[from] -= q * hi.ice;
          frost[to] += q * hi.ice;
          particles[from] -= f;
          particles[to] += f;
          thermal[from] -= q * hi.temp;
          thermal[to] += q * hi.temp;
        }
      }
      let thin = 0,
        covered = 0,
        solid = 0,
        best = -100,
        dew = 0;
      for (let k = 0; k < s.cells.length; k++) {
        const c = s.cells[k];
        if (!c.active) continue;
        const h = Math.max(0, c.h + delta[k]); // The contact layer retains sensible and latent heat even at the moving meniscus.
        c.contactHeat += (thermal[k] - delta[k] * (c.temp + c.contactHeat)) / (h + 0.6);
        c.contactIce = clamp(
          c.contactIce + (frost[k] - delta[k] * (c.ice + c.contactIce)) / (h + 0.19),
          -c.ice,
          1 - c.ice,
        );
        const bonded = c.contactIce * -Math.expm1(-dt * 5.2);
        c.contactIce -= bonded;
        const released = c.contactHeat * -Math.expm1(-dt * 4.1);
        c.contactHeat -= released;
        c.temp = clamp(c.temp + released, -23, 32);
        c.ice = clamp(c.ice + bonded, 0, 1);
        frost[k] = 0;
        c.h = h;
        c.fruit = Math.max(0, c.fruit + particles[k]);
        delta[k] = 0;
        particles[k] = 0;
        thermal[k] = 0;
        c.plate = approach(c.plate, c.base + Math.min(7, h * 0.42), 0.17, dt);
        c.temp = approach(c.temp, c.plate, c.cooling / (1 + h * 0.68), dt);
        if (h > 0.003)
          c.ice = approach(c.ice, clamp((-c.temp - 1) / 7, 0, 1), 0.47 / (1 + h * 0.36), dt);
        else c.ice = approach(c.ice, 0, 2, dt);
        c.dew = approach(c.dew, h > 0.018 ? 0 : c.dewGoal + s.air * 0.04, c.dewRate, dt);
        dew += c.dew;
        if (h > 0.16) {
          covered++;
          if (c.ice > 0.48) {
            solid++;
            if (h < 2.5) thin++;
          }
          const rank = c.z - 0.27 * Math.abs(c.x) + 0.12 * c.ice;
          if (c.ice > 0.52 && h > 0.38 && rank > best && s.phase === 'spread') {
            s.edge.x = c.x;
            s.edge.z = c.z;
            best = rank;
          }
        }
      }
      s.condensation = dew / activeCount;
      if (
        s.phase === 'spread' &&
        fruit.crush > 0.85 &&
        solid > 24 &&
        thin > 12 &&
        spreadWork > 21 &&
        best > -99
      ) {
        const touching = s.pressed;
        phase('edge');
        s.pressed = touching;
      }
      if (s.phase === 'offer') {
        s.fall = approach(s.fall, 1, 1.6, dt);
        s.serve = approach(s.serve, s.fall > 0.9 ? 1 : 0, 0.78, dt);
        s.wrist = approach(s.wrist, 0.26 + s.gaze * 0.3, 2.5, dt);
        if (s.age > 10 && s.idle > 4 && !s.pressed) phase('clean');
      }
      if (s.phase === 'clean') {
        s.handoff = approach(s.handoff, 1, 1.74 / (1 + roll.volume * 0.004), dt);
        s.wipe = Math.min(1, s.wipe + dt * 0.081);
        const stripe = s.wipe * 5,
          leg = Math.min(4, Math.floor(stripe)),
          u = clamp(stripe - leg, 0, 1);
        s.wipeZ = -2.2 + stripe * 0.88;
        s.wipeX =
          (leg % 2 === 0 ? 1 : -1) *
          (2 * u - 1) *
          Math.sqrt(Math.max(0.04, R * R - s.wipeZ * s.wipeZ));
        for (const c of s.cells)
          if (Math.hypot(c.x - s.wipeX, c.z - s.wipeZ) < 0.83) {
            const f = Math.exp(-dt * 18);
            c.h *= f;
            c.fruit *= f;
          }
        s.serve = approach(s.serve, 0, 1.1, dt);
        if (s.age > 15.2) {
          for (const c of s.cells) {
            c.h = 0;
            c.fruit = 0;
            c.ice = 0;
            c.peel = 0;
            c.contactHeat = 0;
            c.contactIce = 0;
          }
          s.poured = 0;
          s.handoff = 0;
          s.drop = 0;
          s.fall = 0;
          s.wipe = 0;
          s.wrist = 0;
          s.serve = 0;
          s.tilt = 0;
          s.gaze = 0;
          s.batches++;
          fruit.crush = 0;
          fruit.grain = 3.7;
          Object.assign(roll, {
            radius: 0.045,
            endZ: -2.38,
            angle: 0,
            volume: 0,
            length: 0,
            sections: [],
          });
          spreadWork = 0;
          pourU = 0;
          firstDrop = false;
          s.beadLoad = 0.11;
          aim(1.32, 1.22);
          phase('ready');
        }
      }
    }
    return {
      s,
      N,
      R,
      dx,
      area,
      input,
      step(dt) {
        if (!Number.isFinite(dt) || dt <= 0) return;
        const n = Math.ceil(dt * 90);
        for (let i = 0; i < n; i++) physics(dt / n);
      },
      getState() {
        return JSON.parse(JSON.stringify(s));
      },
    };
  }
  const api = { create, N, R, dx, area };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.IceKitchen = api;
})(typeof window !== 'undefined' ? window : globalThis);
