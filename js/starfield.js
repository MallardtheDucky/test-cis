/* Starfield + hyperspace jump. Respects prefers-reduced-motion. */
(function () {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1, stars = [];
  const CRUISE = 0.05;           // idle drift speed
  let speed = CRUISE;
  let jump = null;               // { start, dur, peak }
  let last = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = Math.floor(window.innerWidth * dpr);
    h = canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }

  function seed() {
    const count = window.innerWidth < 700 ? 160 : 300;
    stars = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random() * 0.98 + 0.02,
      tint: Math.random() < 0.18 ? 1 : 0
    }));
  }

  function project(x, y, z) {
    const f = Math.min(w, h) * 0.55;
    return [w / 2 + (x / z) * f * 0.5, h / 2 + (y / z) * f * 0.5];
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (jump) {
      const t = (now - jump.start) / jump.dur;
      if (t >= 1) { jump = null; speed = CRUISE; }
      else {
        // fast ramp, long ease-out
        const e = t < 0.18 ? t / 0.18 : Math.pow(1 - (t - 0.18) / 0.82, 2.2);
        speed = CRUISE + jump.peak * e;
      }
    }

    ctx.fillStyle = jump ? 'rgba(4,6,13,0.32)' : '#04060d';
    ctx.fillRect(0, 0, w, h);

    for (const s of stars) {
      const prevZ = s.z;
      s.z -= speed * dt;
      if (s.z <= 0.02) {
        s.x = (Math.random() - 0.5) * 2;
        s.y = (Math.random() - 0.5) * 2;
        s.z = 1;
        continue;
      }
      const [px, py] = project(s.x, s.y, s.z);
      if (px < -50 || px > w + 50 || py < -50 || py > h + 50) { s.z = 1; continue; }
      const b = Math.min(1, (1 - s.z) * 1.2 + 0.4);
      ctx.strokeStyle = s.tint ? `rgba(120,180,255,${b})` : `rgba(235,242,255,${b})`;
      ctx.lineWidth = (1.1 + (1 - s.z) * 1.8) * dpr;
      if (speed > 0.4) {
        const [qx, qy] = project(s.x, s.y, prevZ + speed * 0.045);
        ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 0.6 * dpr, py + 0.6 * dpr); ctx.stroke();
      }
    }
    requestAnimationFrame(frame);
  }

  window.starfield = {
    jump(duration) {
      if (reduce) return;
      jump = { start: performance.now(), dur: duration || 2800, peak: 3.2 };
    }
  };

  resize(); seed();
  window.addEventListener('resize', () => { resize(); seed(); });

  if (reduce) {
    // one static frame
    ctx.fillStyle = '#04060d'; ctx.fillRect(0, 0, w, h);
    for (const s of stars) {
      const [px, py] = project(s.x, s.y, s.z);
      ctx.fillStyle = 'rgba(235,242,255,0.8)';
      ctx.fillRect(px, py, dpr, dpr);
    }
  } else {
    requestAnimationFrame(frame);
  }
})();
