// Deterministic clipping cutter.
// usage: node cut.cjs <out.jpg> <seg> [<seg>...] [--tol=80] [--ytol=60] [--preview=out.png]
//   seg = page.jpg:x0,y0,x1,y1   (approximate full-resolution coordinates)
// Each segment's x edges snap to the nearest vertical column rule (or, failing
// that, the emptiest gutter column); y edges snap to the nearest blank row band.
// Segments are stacked top to bottom into one column.
const sharp = require('sharp');

const args = process.argv.slice(2);
const opts = { tol: 80, ytol: 60, snapx: 1, snapy: 1 };
const segs = [];
let out = null;
for (const a of args) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) opts[m[1]] = isNaN(+m[2]) ? m[2] : +m[2];
  else if (!out) out = a;
  else {
    const i = a.lastIndexOf(':');
    const [x0, y0, x1, y1] = a.slice(i + 1).split(',').map(Number);
    segs.push({ page: a.slice(0, i), x0, y0, x1, y1 });
  }
}

const cache = {};
async function load(page) {
  if (!cache[page]) {
    const { data, info } = await sharp(page, { limitInputPixels: false }).greyscale().raw().toBuffer({ resolveWithObject: true });
    cache[page] = { data, w: info.width, h: info.height };
  }
  return cache[page];
}

// mean darkness of each column in [xa,xb) over rows [ya,yb)
function colProfile(img, xa, xb, ya, yb) {
  const p = new Float64Array(xb - xa);
  for (let y = ya; y < yb; y++) { const r = y * img.w; for (let x = xa; x < xb; x++) p[x - xa] += 255 - img.data[r + x]; }
  for (let i = 0; i < p.length; i++) p[i] /= (yb - ya);
  return p;
}
function rowProfile(img, xa, xb, ya, yb) {
  const p = new Float64Array(yb - ya);
  for (let y = ya; y < yb; y++) { const r = y * img.w; let s = 0; for (let x = xa; x < xb; x++) s += 255 - img.data[r + x]; p[y - ya] = s / (xb - xa); }
  return p;
}

// Snap a vertical edge. side: 'L' or 'R'. Returns x just inside the rule.
function snapX(img, x, ya, yb, side, tol) {
  const xa = Math.max(0, x - tol), xb = Math.min(img.w, x + tol);
  return snapProfile(colProfile(img, xa, xb, ya, yb), xa, x, side);
}
// p[i] is the darkness of column xa+i; find the rule (or gutter) nearest x
function snapProfile(p, xa, x, side) {
  let base = Infinity; for (const v of p) if (v < base) base = v;
  const low = v => v <= base + 6;
  // a rule is a narrow ridge (3..34px) with blank gutter on both sides
  let best = null;
  for (let i = 0; i < p.length;) {
    if (p[i] > base + 15) {
      let j = i; while (j < p.length && p[j] > base + 10) j++;
      const wdt = j - i;
      let l = 0, r = 0;
      for (let k = i - 1; k >= Math.max(0, i - 14); k--) if (low(p[k])) l++;
      for (let k = j; k < Math.min(p.length, j + 14); k++) if (low(p[k])) r++;
      if (wdt >= 2 && wdt <= 34 && l >= 3 && r >= 3) {
        const mid = xa + ((i + j) >> 1), d = Math.abs(mid - x);
        if (!best || d < best.d) best = { i, j, d };
      }
      i = j;
    } else i++;
  }
  if (best) {
    // put the edge in the middle of the blank gutter on the article side of the rule
    return { x: side === 'L' ? xa + best.j + 1 : xa + best.i - 1, how: 'rule' };
  }
  // no rule: middle of the widest blank run, preferring ones near x
  let g = null;
  for (let i = 0; i < p.length;) {
    if (low(p[i])) { let j = i; while (j < p.length && low(p[j])) j++;
      const mid = xa + ((i + j) >> 1), sc = (j - i) * 3 - Math.abs(mid - x);
      if (j - i >= 4 && (!g || sc > g.sc)) g = { x: mid, sc };
      i = j; } else i++;
  }
  return g ? { x: g.x, how: 'gutter' } : { x, how: 'none' };
}

// Snap a horizontal edge to the middle of the nearest blank band.
function snapY(img, y, xa, xb, tol, side) {
  const ya = Math.max(0, y - tol), yb = Math.min(img.h, y + tol);
  const p = rowProfile(img, xa, xb, ya, yb);
  const sorted = Array.from(p).sort((a, b) => a - b);
  const thr = sorted[Math.floor(sorted.length * 0.1)] + 6;
  let best = null;
  for (let i = 0; i < p.length;) {
    if (p[i] <= thr) { let j = i; while (j < p.length && p[j] <= thr) j++;
      if (j - i >= 3) { const mid = ya + ((i + j) >> 1); const d = Math.abs(mid - y) - (j - i); const q = (j - i) >> 2; if (!best || d < best.d) best = { y: side === 'T' ? ya + i + q : ya + j - q, d, len: j - i }; }
      i = j; } else i++;
  }
  return best ? { y: best.y, how: 'gap' + best.len } : { y, how: 'none' };
}

// Track an edge down the page in bands; fit x = a + b*y (Theil-Sen) so tilted scans are followed.
function trackX(img, x, y0, y1, side, tol) {
  const band = 260, pts = [];
  for (let y = y0; y < y1; y += band) {
    const yb = Math.min(y1, y + band); if (yb - y < 80) break;
    // re-centre on the running estimate so drift larger than tol is followed
    const cx = pts.length ? pts[pts.length - 1].x : x;
    const r = snapX(img, cx, y, yb, side, pts.length ? Math.min(tol, 30) : tol);
    if (r.how === 'rule') pts.push({ y: (y + yb) / 2, x: r.x });
  }
  const nb = Math.ceil((y1 - y0) / band);
  if (pts.length < Math.max(2, nb * 0.6)) { const r = snapX(img, x, y0, y1, side, tol); return { f: () => r.x, how: r.how + '(flat ' + pts.length + '/' + nb + ')' }; }
  const sl = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) sl.push((pts[j].x - pts[i].x) / (pts[j].y - pts[i].y));
  sl.sort((p, q) => p - q); const b = sl.length ? sl[sl.length >> 1] : 0;
  const ic = pts.map(p => p.x - b * p.y).sort((p, q) => p - q); const a0 = ic[ic.length >> 1];
  // drop outliers (>10px from the median of their neighbours), then interpolate piecewise
  const good = pts.filter((p, i) => { const n = pts.slice(Math.max(0, i - 2), i + 3).map(q => q.x - b * (q.y - p.y)).sort((u, v) => u - v); return Math.abs(p.x - n[n.length >> 1]) <= 10; });
  const f = y => {
    if (y <= good[0].y) return good[0].x + b * (y - good[0].y);
    const l = good[good.length - 1]; if (y >= l.y) return l.x + b * (y - l.y);
    let k = 0; while (good[k + 1].y < y) k++;
    const p = good[k], q = good[k + 1]; return p.x + (q.x - p.x) * (y - p.y) / (q.y - p.y);
  };
  return { f, b, frac: good.length / nb, how: 'rule ' + good.length + '/' + nb + ' slope ' + b.toFixed(4) };
}

// Find an edge by following a trusted edge: the profile is taken along lines parallel to
// f (so a tilted page does not smear it), at offsets around `off` pixels from f.
function shearedSnap(img, f, y0, y1, off, side, tol) {
  const n = 2 * tol + 1, p = new Float64Array(n); let rows = 0;
  for (let y = y0; y < y1; y += 2) {
    const bx = Math.round(f(y)) + off - tol; if (bx < 0 || bx + n > img.w) continue;
    const r = y * img.w + bx; for (let i = 0; i < n; i++) p[i] += 255 - img.data[r + i]; rows++;
  }
  if (!rows) return null;
  for (let i = 0; i < n; i++) p[i] /= rows;
  const r = snapProfile(p, 0, tol, side);
  return r.how === 'none' ? null : { d: off - tol + r.x, how: r.how };
}

(async () => {
  const strips = [];
  const tr = [];
  for (const s of segs) {
    const img = await load(s.page);
    tr.push({ L: trackX(img, s.x0, s.y0, s.y1, 'L', opts.tol), R: trackX(img, s.x1, s.y0, s.y1, 'R', opts.tol) });
  }
  const ruled = t => t.how.startsWith('rule ');
  const ws = tr.map((t, i) => ruled(t.L) && ruled(t.R) ? t.R.f((segs[i].y0 + segs[i].y1) / 2) - t.L.f((segs[i].y0 + segs[i].y1) / 2) : null).filter(v => v).sort((p, q) => p - q);
  const colW = opts.width || (ws.length ? ws[ws.length >> 1] : null);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], img = await load(s.page);
    let { L, R } = tr[i];
    // The two sides of a column are parallel. If only one side tracked a rule, or the two
    // disagree on the tilt, keep the better-tracked side and find the other parallel to it.
    const okL = ruled(L), okR = ruled(R), agree = okL && okR && Math.abs(L.b - R.b) <= 0.004;
    if ((okL || okR) && !agree) {
      const keepL = okL && (!okR || L.frac >= R.frac);
      const est = s.x1 - s.x0;
      if (keepL) {
        const h = shearedSnap(img, L.f, s.y0, s.y1, est, 'R', opts.tol);
        const d = h ? h.d : (colW || est), f0 = L.f;
        R = { f: y => f0(y) + d, how: (h ? h.how : 'width') + ' parallel to L +' + Math.round(d) + (okR ? ' (own track disagreed)' : '') };
      } else {
        const h = shearedSnap(img, R.f, s.y0, s.y1, -est, 'L', opts.tol);
        const d = h ? h.d : -(colW || est), f0 = R.f;
        L = { f: y => f0(y) + d, how: (h ? h.how : 'width') + ' parallel to R ' + Math.round(d) + (okL ? ' (own track disagreed)' : '') };
      }
    }
    const ym = (s.y0 + s.y1) / 2;
    const lx = y => Math.round(L.f(y)), rx = y => Math.round(R.f(y));
    const T = opts.snapy ? snapY(img, s.y0, lx(s.y0) + 10, rx(s.y0) - 10, opts.ytol, 'T') : { y: s.y0, how: 'fixed' };
    const B = opts.snapy ? snapY(img, s.y1, lx(s.y1) + 10, rx(s.y1) - 10, opts.ytol, 'B') : { y: s.y1, how: 'fixed' };
    // trim blank paper at the top and bottom of the segment down to a small margin, so joins
    // between columns keep normal line spacing and page margins are not carried in
    if (opts.trim !== 0 && !opts.legacy) {
      // Classify each row as blank, rule (one long unbroken dark run and little else) or text,
      // using ink pixels rather than the row's mean darkness, so a short last line is not
      // mistaken for blank paper and a grey margin is not mistaken for print. Blank rows and
      // rules are stripped from both ends: page-top rules and margins at column joins, and the
      // divider rule above a headline or below the last line.
      const M = 14, inset = 12, xa = y => lx(y) + inset, xb = y => rx(y) - inset;
      const hist = new Uint32Array(256); let n = 0;
      for (let y = T.y; y < B.y; y += 3) { const r = y * img.w; for (let x = xa(y); x < xb(y); x += 3) { hist[255 - img.data[r + x]]++; n++; } }
      const pct = q => { let c = 0; for (let v = 0; v < 256; v++) { c += hist[v]; if (c >= n * q) return v; } return 255; };
      const bg = pct(0.5), ink = pct(0.98), thr = Math.max(bg + 40, bg + (ink - bg) * 0.5);
      const minRule = Math.max(60, Math.min(100, (rx(ym) - lx(ym)) * 0.12));
      const delta = Math.max(40, (ink - bg) * 0.5), memo = new Map();
      const tilt = (ruled(L) ? L.b : ruled(R) ? R.b : 0) || 0, xmid = (lx(ym) + rx(ym)) >> 1, skew = Math.ceil(Math.abs(tilt) * (rx(ym) - lx(ym)) / 2);
      // Ink is judged against the row's own paper tone (its lightest fifth of pixels): a line
      // of text always has light gaps between letters, while a grey margin or a solid black
      // band is the same tone all the way across and so reads as blank, not as print.
      const info = y => {
        if (memo.has(y)) return memo.get(y);
        // a printed line is perpendicular to the column rules: follow the tilt across the row
        const a = xa(y), b = xb(y), px = x => { const yy = Math.max(0, Math.min(img.h - 1, y - Math.round(tilt * (x - xmid)))); return 255 - img.data[yy * img.w + x]; };
        const h = new Uint32Array(256);
        for (let x = a; x < b; x++) h[px(x)]++;
        let c = 0, paper = 0; for (; paper < 256; paper++) { c += h[paper]; if (c >= (b - a) * 0.2) break; }
        const t = paper + delta;
        let total = 0, run = 0, gap = 0, best = 0, runs = 0, win = 0, maxWin = 0;
        for (let x = a; x < b; x++) {
          const d = px(x) > t ? 1 : 0;
          total += d;
          if (d) { if (!run) runs++; run += 1 + gap; gap = 0; if (run > best) best = run; } else if (run && gap < 2) gap++; else { run = 0; gap = 0; }
          win += d; if (x - 60 >= a) win -= px(x - 60) > t ? 1 : 0; if (win > maxWin) maxWin = win;
        }
        // B blank; R rule (a long unbroken run and at most a few other marks); X anything else
        const k = maxWin < 5 ? 'B' : best >= minRule && runs <= 4 ? 'R' : 'X';
        // broken: a rule printed faintly or in pieces (long marks, unlike the short strokes of letters)
        const o = { k, runs, best, total, broken: runs > 0 && total / runs >= 14 && total >= minRule }; memo.set(y, o); return o;
      };
      const kind = y => info(y).k;
      // Walk in from one end over blank rows and rules. A band of print with blank beyond it is
      // also taken as a rule when it is a thin line (<= 8 rows), a speck (<= 14 rows, never more than 12 ink pixels across), a faint broken rule
      // (<= 12 rows), a rough, curved or ornamental rule (<= 30 rows with a row that is one long
      // unbroken run, or <= 45 rows with two), or a heavy rule (<= 70 rows, mostly such rows). A line of text, however
      // short, has no long unbroken run, so it stops the walk.
      const walk = (from, to, step) => {
        let y = from, rule = -1;
        for (;;) {
          while (y !== to && kind(y) !== 'X') { if (kind(y) === 'R') rule = y; y += step; }
          if (y === to) return { y, rule };
          let e = y, nR = 0, broken = false, speck = true;
          while (e !== to && kind(e) !== 'B' && Math.abs(e - y) <= 71) { if (kind(e) === 'R') nR++; if (info(e).broken) broken = true; if (info(e).total > 12) speck = false; e += step; }
          const h = Math.abs(e - y), ended = e !== to && kind(e) === 'B';
          if (ended && (h <= 8 || (h <= 14 && speck) || (h <= 12 && broken) || (h <= 30 && nR) || (h <= 45 && nR >= 2) || (h <= 70 && nR >= h * 0.6))) { rule = e - step; y = e; continue; }
          return { y, rule };
        }
      };
      const t0 = T.y, b0 = B.y;
      if (opts.debug) { const d = (a, b) => { let o = ''; for (let y = a; y < b; y++) { const q = info(y); o += q.k === 'B' ? '.' : q.k === 'R' ? 'R' : (q.runs <= 4 ? 'x' : 'X'); } return o; }; console.log('top', d(t0, Math.min(b0, t0 + 110))); console.log('bot', d(Math.max(t0, b0 - 110), b0)); }
      const top = walk(t0, b0, 1);
      if (top.y < b0) {
        const bot = walk(b0 - 1, top.y, -1);
        // the output keeps the tilt, so leave room for it; next to a rule, cut midway between rule and text
        const nt = Math.max(t0, top.rule < 0 ? top.y - M - skew : Math.max(top.y - M - skew, (top.rule + 1 + top.y) >> 1));
        const nb = Math.min(b0, bot.rule < 0 ? bot.y + 1 + M + skew : Math.min(bot.y + 1 + M + skew, (bot.rule + bot.y + 1) >> 1));
        if (nt > t0) { T.y = nt; T.how += ' trim' + (nt - t0) + (top.rule >= 0 ? ' (rule removed)' : ''); }
        if (nb < b0) { B.y = nb; B.how += ' trim' + (b0 - nb) + (bot.rule >= 0 ? ' (rule removed)' : ''); }
      }
    } else if (opts.trim !== 0) {
      // old behaviour (mean row darkness), kept only to reproduce earlier cuts: --legacy=1
      const rp = rowProfile(img, lx(ym) + 12, rx(ym) - 12, T.y, B.y);
      const so = Array.from(rp).sort((p, q) => p - q), thr = so[Math.floor(so.length * 0.1)] + 6, M = 14;
      let i = 0; while (i < rp.length && rp[i] <= thr) i++;
      let j = rp.length; while (j > i && rp[j - 1] <= thr) j--;
      if (i > M) { T.y += i - M; T.how += ' trim' + (i - M); }
      if (rp.length - j > M) { B.y -= rp.length - j - M; B.how += ' trim' + (rp.length - j - M); }
    }
    const width = rx(ym) - lx(ym);
    console.log(JSON.stringify({ page: s.page.split('/').pop(), left: lx(T.y) + '..' + lx(B.y), top: T.y, bottom: B.y, width, L: L.how, R: R.how, T: T.how, B: B.how }));
    // rows grouped by equal left offset (a 1px shear step at a time)
    const chunks = [];
    for (let y = T.y; y < B.y;) { const l = lx(y); let e = y; while (e < B.y && lx(e) === l) e++; chunks.push({ left: l, top: y, width, height: e - y }); y = e; }
    strips.push({ page: s.page, chunks, width, height: B.y - T.y });
  }
  const W = Math.max(...strips.map(p => p.width));
  const H = strips.reduce((a, b) => a + b.height, 0);
  const comp = []; const bufs = [];
  let top = 0;
  for (const st of strips) {
    const padL = (W - st.width) >> 1;
    for (const c of st.chunks) {
      comp.push({ input: await sharp(st.page, { limitInputPixels: false }).extract(c).png().toBuffer(), left: padL, top });
      top += c.height;
    }
    bufs.push({ h: st.height });
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' }, limitInputPixels: false })
    .composite(comp).jpeg({ quality: 90 }).toFile(out);
  console.log('wrote', out, W + 'x' + H);
  if (opts.preview) {
    // per segment: its top and bottom 420px (with 60px of the neighbouring segment), tiled left to right
    const ph = 480, tiles = [];
    let y = 0;
    for (const b of bufs) {
      for (const t of [Math.max(0, y - 60), Math.min(H - ph, y + b.h - ph + 60)]) {
        const tt = Math.max(0, Math.min(H - Math.min(ph, H), t));
        tiles.push(await sharp(out).extract({ left: 0, top: tt, width: W, height: Math.min(ph, H) }).toBuffer());
      }
      y += b.h;
    }
    const big = await sharp({ create: { width: (W + 20) * tiles.length, height: Math.min(ph, H), channels: 3, background: '#ff0000' } })
      .composite(tiles.map((t, i) => ({ input: t, left: i * (W + 20), top: 0 }))).png().toBuffer();
    await sharp(big).resize({ width: Math.min(1800, 450 * tiles.length), withoutEnlargement: true }).jpeg({ quality: 65 }).toFile(opts.preview);
  }
})();
