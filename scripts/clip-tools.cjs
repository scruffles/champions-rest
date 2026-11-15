// Helpers for re-cutting clippings from full pages. Used with scripts/cut-clipping.cjs.
//
//   node scripts/clip-tools.cjs locate <id>
//       Finds review/work/<id>/candidate.jpg on the article's full page(s) and prints the box in
//       full-resolution page coordinates. Writes review/work/<id>/locate.jpg: the surrounding page
//       region with a labelled coordinate grid.
//   node scripts/clip-tools.cjs view <page.jpg> <x0,y0,x1,y1> <out.jpg>
//       Renders any page region with the same labelled grid (labels are full-resolution coordinates).
//   node scripts/clip-tools.cjs page <page.jpg> <out.jpg>
//       Whole page with grid.
//   node scripts/clip-tools.cjs tiles <clip.jpg> <outDir>
//       Slices a tall clipping into overlapping 1100px tiles for reading at full resolution.
//   node scripts/clip-tools.cjs todo
//       Lists which ids from review/work/cutoff-candidates.html are still to cut, already cut
//       (review/work/<id>/clip.json), not done, installed (database points at a c-file) or removed.
//   node scripts/clip-tools.cjs pages <id>
//       Prints the article's full-page files, sizes and md5s, and other articles on the same page.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const big = { limitInputPixels: false };

async function loadDb() {
  return (await import(pathToFileURL(path.join(root, 'data', 'database.js')).href)).db;
}
function pagesOf(a) {
  const full = Array.isArray(a.localCopyFull) ? a.localCopyFull : [a.localCopyFull];
  return full.filter(Boolean).map(p => path.join(root, 'public', p));
}

async function grey(file, scale, region) {
  let s = sharp(file, big);
  if (region) s = s.extract(region);
  const m = region || await sharp(file, big).metadata();
  const w = Math.max(1, Math.round(m.width * scale)), h = Math.max(1, Math.round(m.height * scale));
  const { data } = await s.greyscale().resize(w, h, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return { data, w, h };
}

// normalised cross-correlation of template t at (ox, oy) in image p
function ncc(p, t, ox, oy, tm, td) {
  let sp = 0, spp = 0, spt = 0;
  for (let y = 0; y < t.h; y++) {
    const pr = (oy + y) * p.w + ox, trw = y * t.w;
    for (let x = 0; x < t.w; x++) { const a = p.data[pr + x], b = t.data[trw + x] - tm; sp += a; spp += a * a; spt += a * b; }
  }
  const n = t.w * t.h, pv = spp - sp * sp / n;
  return pv <= 0 ? -1 : spt / Math.sqrt(pv * td);
}
function stats(t) {
  let s = 0; for (const v of t.data) s += v; const m = s / t.data.length;
  let d = 0; for (const v of t.data) d += (v - m) * (v - m);
  return [m, d];
}

async function findOnPage(pageFile, candFile) {
  const cm = await sharp(candFile).metadata();
  const ch = Math.min(cm.height, 2400); // match on the top part of tall candidates
  const reg = { left: 0, top: 0, width: cm.width, height: ch };
  const pm = await sharp(pageFile, big).metadata();
  if (cm.width > pm.width || ch > pm.height) return null;
  // coarse pass
  const c = 1 / 16, P = await grey(pageFile, c), T = await grey(candFile, c, reg);
  let [tm, td] = stats(T), best = { s: -2 };
  for (let y = 0; y + T.h <= P.h; y++) for (let x = 0; x + T.w <= P.w; x++) {
    const s = ncc(P, T, x, y, tm, td); if (s > best.s) best = { s, x, y };
  }
  // fine pass around the coarse hit
  const f = 1 / 4, P2 = await grey(pageFile, f), T2 = await grey(candFile, f, reg);
  [tm, td] = stats(T2);
  const cx = Math.round(best.x / c * f), cy = Math.round(best.y / c * f);
  let fine = { s: -2 };
  for (let y = Math.max(0, cy - 10); y <= Math.min(P2.h - T2.h, cy + 10); y++)
    for (let x = Math.max(0, cx - 10); x <= Math.min(P2.w - T2.w, cx + 10); x++) {
      const s = ncc(P2, T2, x, y, tm, td); if (s > fine.s) fine = { s, x, y };
    }
  const x0 = Math.round(fine.x / f), y0 = Math.round(fine.y / f);
  return { score: +fine.s.toFixed(3), x0, y0, x1: x0 + cm.width, y1: y0 + cm.height, pageW: pm.width, pageH: pm.height };
}

// Render a page region scaled down, with grid lines labelled in full-resolution coordinates.
async function view(pageFile, box, out, mark) {
  const pm = await sharp(pageFile, big).metadata();
  const x0 = Math.max(0, Math.round(box[0])), y0 = Math.max(0, Math.round(box[1]));
  const x1 = Math.min(pm.width, Math.round(box[2])), y1 = Math.min(pm.height, Math.round(box[3]));
  const w = x1 - x0, h = y1 - y0;
  const sc = Math.min(1, 1100 / w, 1500 / h);
  const W = Math.round(w * sc), H = Math.round(h * sc);
  const step = [100, 200, 250, 500, 1000, 2000].find(s => s * sc >= 70) || 2000;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">`;
  const lab = (x, y, t) => `<rect x="${x}" y="${y - 11}" width="${t.length * 7 + 4}" height="14" fill="#ffff66" opacity="0.9"/><text x="${x + 2}" y="${y}" font-family="Helvetica,Arial,sans-serif" font-size="12" fill="#c00000">${t}</text>`;
  for (let gx = Math.ceil(x0 / step) * step; gx < x1; gx += step) {
    const px = (gx - x0) * sc; svg += `<line x1="${px}" y1="0" x2="${px}" y2="${H}" stroke="#ff0000" stroke-width="1" opacity="0.45"/>` + lab(px + 2, 12, 'x' + gx);
  }
  for (let gy = Math.ceil(y0 / step) * step; gy < y1; gy += step) {
    const py = (gy - y0) * sc; svg += `<line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="#0000ff" stroke-width="1" opacity="0.45"/>` + lab(2, py + 13, 'y' + gy);
  }
  if (mark) svg += `<rect x="${(mark.x0 - x0) * sc}" y="${(mark.y0 - y0) * sc}" width="${(mark.x1 - mark.x0) * sc}" height="${(mark.y1 - mark.y0) * sc}" fill="none" stroke="#00aa00" stroke-width="3"/>`;
  svg += '</svg>';
  const base = await sharp(pageFile, big).extract({ left: x0, top: y0, width: w, height: h }).resize(W, H).png().toBuffer();
  await sharp(base).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).jpeg({ quality: 68 }).toFile(out);
  return { out, region: [x0, y0, x1, y1], scale: +sc.toFixed(3) };
}

(async () => {
  const [cmd, ...a] = process.argv.slice(2);
  if (cmd === 'locate') {
    const id = a[0], db = await loadDb(), art = db.find(x => x.id === id);
    if (!art) throw new Error('no article ' + id + ' in the database');
    const cand = path.join(root, 'review', 'work', id, 'candidate.jpg');
    const pages = pagesOf(art);
    if (!fs.existsSync(cand)) { console.log(JSON.stringify({ id, pages, note: 'no candidate.jpg; use the page command and find it by eye' })); return; }
    let best = null;
    for (const p of pages) { const r = await findOnPage(p, cand); if (r && (!best || r.score > best.score)) best = { page: p, ...r }; }
    if (!best) { console.log(JSON.stringify({ id, pages, note: 'candidate does not fit on the page' })); return; }
    const out = path.join(root, 'review', 'work', id, 'locate.jpg');
    const colW = best.x1 - best.x0;
    const v = await view(best.page, [best.x0 - colW * 0.9, best.y0 - 500, best.x1 + colW * 0.9, Math.min(best.y1, best.y0 + 2400) + 900], out, best);
    console.log(JSON.stringify({ id, title: art.title, date: art.sourceDate, currentClipping: art.localCopyEdited, page: path.relative(root, best.page), pageSize: [best.pageW, best.pageH], candidateBox: [best.x0, best.y0, best.x1, best.y1], score: best.score, trusted: best.score > 0.6, view: path.relative(root, v.out), viewRegion: v.region }));
  } else if (cmd === 'view') {
    console.log(JSON.stringify(await view(a[0], a[1].split(',').map(Number), a[2])));
  } else if (cmd === 'page') {
    const m = await sharp(a[0], big).metadata();
    console.log(JSON.stringify({ pageSize: [m.width, m.height], ...(await view(a[0], [0, 0, m.width, m.height], a[1])) }));
  } else if (cmd === 'tiles') {
    const m = await sharp(a[0], big).metadata(); fs.mkdirSync(a[1], { recursive: true });
    const base = path.basename(a[0]).replace(/\.\w+$/, ''); const outs = [];
    for (let y = 0, n = 0; y < m.height - 120 || n === 0; y += 1000) {
      const h = Math.min(1100, m.height - y), f = path.join(a[1], `${base}-${String(++n).padStart(2, '0')}.jpg`);
      await sharp(a[0], big).extract({ left: 0, top: y, width: m.width, height: h }).toFile(f); outs.push(f);
    }
    console.log(JSON.stringify({ size: [m.width, m.height], tiles: outs }));
  } else if (cmd === 'pages') {
    const db = await loadDb(), art = db.find(x => x.id === a[0]);
    const md5 = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex');
    const mine = pagesOf(art).map(p => ({ page: path.relative(root, p), md5: md5(p) }));
    const same = db.filter(x => x.id !== art.id && x.sourceDate === art.sourceDate).map(x => ({ id: x.id, title: x.title, publication: x.publication, clipping: x.localCopyEdited,
      sharesPage: pagesOf(x).some(p => fs.existsSync(p) && mine.some(m => m.md5 === md5(p))) }));
    console.log(JSON.stringify({ id: art.id, title: art.title, publication: art.publication, pages: mine, sameDate: same }, null, 1));
  } else if (cmd === 'todo') {
    // ids from review/work/cutoff-candidates.html that still need a clipping cut
    const db = await loadDb();
    const html = fs.readFileSync(path.join(root, 'review', 'work', 'cutoff-candidates.html'), 'utf8');
    const ids = [...html.matchAll(/<h3>(\d+) ·/g)].map(m => m[1]);
    const out = { todo: [], cut: [], not_done: [], installed: [], removed: [] };
    for (const id of ids) {
      const art = db.find(x => x.id === id);
      const rec = path.join(root, 'review', 'work', id, 'clip.json');
      if (!art) out.removed.push(id);
      else if (/image-\d+[c-z]\.jpg$/.test(art.localCopyEdited || '')) out.installed.push(id);
      else if (fs.existsSync(rec)) { const st = JSON.parse(fs.readFileSync(rec, 'utf8')).status; (st === 'done' || st === 'duplicate' ? out.cut : out.not_done).push(id); }
      else out.todo.push(id);
    }
    console.log(JSON.stringify({ counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])), ...out }));
  } else {
    console.log('commands: todo | locate <id> | view <page> <x0,y0,x1,y1> <out> | page <page> <out> | tiles <clip> <outDir> | pages <id>');
  }
})().catch(e => { console.error(String(e.stack || e)); process.exit(1); });
