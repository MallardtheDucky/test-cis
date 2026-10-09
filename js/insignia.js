/* Insignia renderer: draws each rank plate as SVG from the spec in data.js */

function hexPoints(cx, cy, r) {
  const p = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
  }
  return p;
}

/* Confederate hexagon: six white wedges around a navy core */
function emblemGroup(cx, cy, r) {
  const v = hexPoints(cx, cy, r);
  const core = hexPoints(cx, cy, r * 0.3).join(' ');
  const sw = Math.max(1.5, r * 0.07);
  let g = `<g stroke="#151a70" stroke-width="${sw}" stroke-linejoin="round">`;
  g += `<polygon points="${v.join(' ')}" fill="none" stroke-width="${sw * 2}"/>`;
  for (let i = 0; i < 6; i++) {
    g += `<polygon points="${cx},${cy} ${v[i]} ${v[(i + 1) % 6]}" fill="#fff"/>`;
  }
  g += `<polygon points="${core}" fill="#151a70"/></g>`;
  return g;
}

function emblemSVG(size, cls) {
  return `<svg class="${cls || ''}" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="Confederate Provincial Authority emblem">${emblemGroup(50, 50, 46)}</svg>`;
}

function strip(n, first, x0, y0, W, H, fill, gapColor) {
  const hw = W / 2;
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + i * hw;
    const up = (first === 'up') === (i % 2 === 0);
    const pts = up
      ? `${x},${y0 + H} ${x + W},${y0 + H} ${x + hw},${y0}`
      : `${x},${y0} ${x + W},${y0} ${x + hw},${y0 + H}`;
    out += `<polygon points="${pts}" fill="${fill}" stroke="${gapColor}" stroke-width="3" stroke-linejoin="miter"/>`;
  }
  return out;
}

function insigniaSVG(spec, pal) {
  const VW = 300, VH = 84;
  let body = '';

  if (spec.supreme) {
    const W = 44, H = 35, hw = W / 2, stripW = 7 * hw, r = 35;
    const total = stripW + 14 + r * 2;
    const x0 = (VW - total) / 2, y0 = (VH - H * 2) / 2;
    body += strip(6, 'up', x0, y0, W, H, '#f5b800', pal.bg);
    body += strip(6, 'down', x0, y0 + H, W, H, '#b3121a', pal.bg);
    body += emblemGroup(x0 + stripW + 14 + r, VH / 2, r);
    return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
  }

  const s = spec.s || 1;
  const W = 56 * s, H = 48 * s, hw = W / 2;
  const stripW = (spec.n + 1) * hw;
  const hexR = 20;
  const extra = spec.hex ? hexR * 2 + 12 : 0;
  const x0 = (VW - stripW - extra) / 2;
  const y0 = (VH - H) / 2;

  body += strip(spec.n, spec.first, x0, y0, W, H, pal.mark, pal.bg);

  const bar = (b, y) => {
    const [c, from, len] = b;
    return `<rect x="${x0 + from * hw}" y="${y}" width="${(len + 1) * hw}" height="4" fill="${BAR[c]}"/>`;
  };
  if (spec.u) body += bar(spec.u, y0 + H + 6);
  if (spec.o) body += bar(spec.o, y0 - 10);
  if (spec.hex) body += emblemGroup(x0 + stripW + 12 + hexR, VH / 2, hexR);

  return `<svg viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${body}</svg>`;
}

/* Returns the plate (colored field + insignia) as HTML */
function plateHTML(branch, rank, extraClass) {
  const b = BRANCHES[branch];
  return `<div class="plate ${extraClass || ''}" style="background:${b.bg}">${insigniaSVG(rank.i, b)}</div>`;
}
