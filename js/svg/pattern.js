// Schémas de patron (panneau coté), plan de coupe et illustrations de tissu.
import { sectorPolygon } from '../calc/geometry.js';

const DEG = Math.PI / 180;
const fmt = (x) => (Math.round(x * 10) / 10).toString().replace('.', ',');

const KIND_STYLE = {
  panel: { fill: 'var(--piece-panel)', label: 'Jupe' },
  facing: { fill: 'var(--piece-facing)', label: 'Parementure' },
  band: { fill: 'var(--piece-band)', label: 'Ceinture' },
  placket: { fill: 'var(--piece-band)', label: 'Patte' },
  pocket: { fill: 'var(--piece-pocket)', label: 'Poche' },
};

const pathOf = (poly) => 'M' + poly.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(' L') + ' Z';

// Point polaire avec l'axe du panneau orienté vers le bas (+y SVG).
const polar = (rho, a) => [rho * Math.sin(a), rho * Math.cos(a)];

function arcPath(rho, a0, a1, n = 48) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const [x, y] = polar(rho, a);
    d += (i ? ' L' : 'M') + `${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const c = x1 * y2 - x2 * y1;
    a += c;
    cx += (x1 + x2) * c;
    cy += (y1 + y2) * c;
  }
  a /= 2;
  return [cx / (6 * a), cy / (6 * a)];
}

/**
 * Panneau de jupe coté, à l'échelle.
 * @param {object} res résultat de computeCircleSkirt
 */
export function patternDiagram(res) {
  const beta = (res.angle / 2) * DEG;
  // Polygone de coupe, tourné pour que l'axe pointe vers le bas.
  const cut = sectorPolygon({ rIn: res.rInCut, rOut: res.rOutCut, angle: res.angle, seam: res.s })
    .map(([x, y]) => [y, x]);
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (const [x, y] of cut) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const size = Math.max(maxX - minX, maxY - minY);
  const fs = size / 26;
  const pad = fs * 5;
  const extraTop = res.notches.length * fs * 1.1;
  const vb = [minX - pad, minY - pad * 1.2 - extraTop, maxX - minX + 2 * pad, maxY - minY + 2.4 * pad + extraTop];
  const sw = size / 300;

  const [lw1x, lw1y] = polar(res.r, -beta);
  const [lh1x, lh1y] = polar(res.R, -beta);
  const [rw1x, rw1y] = polar(res.r, beta);
  const [rh1x, rh1y] = polar(res.R, beta);

  // Cotes le long du bord gauche (côté -beta), décalées vers l'extérieur.
  const nrm = [-Math.cos(beta), -Math.sin(beta)]; // normale extérieure du bord gauche (en coordonnées SVG)
  const off = res.s + fs * 2.2;
  const o = (p, k = 1) => [p[0] + nrm[0] * off * k, p[1] + nrm[1] * off * k];
  const dimLine = (p, q, text, k = 1) => {
    const a = o(p, k), b = o(q, k);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) / DEG;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    return `<g class="dim">
      <line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--ink)" stroke-width="${sw}" marker-start="url(#dimA)" marker-end="url(#dimA)"/>
      <line x1="${p[0]}" y1="${p[1]}" x2="${a[0]}" y2="${a[1]}" stroke="var(--ink-soft)" stroke-width="${sw * 0.6}" stroke-dasharray="${sw * 3} ${sw * 3}"/>
      <line x1="${q[0]}" y1="${q[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--ink-soft)" stroke-width="${sw * 0.6}" stroke-dasharray="${sw * 3} ${sw * 3}"/>
      <text x="${mid[0]}" y="${mid[1]}" font-size="${fs}" text-anchor="middle" dy="${-fs * 0.4}" transform="rotate(${ang} ${mid[0]} ${mid[1]})" class="dim-t">${text}</text>
    </g>`;
  };

  const notches = res.notches.map((n, idx) => {
    const rho = res.rInCut + n.from;
    const [px, py] = polar(rho, beta);
    const t = [Math.cos(beta), -Math.sin(beta)]; // normale extérieure du bord droit
    const ex = px + t[0] * res.s, ey = py + t[1] * res.s;
    const d = fs * 0.8;
    const u = [Math.sin(beta), Math.cos(beta)];
    const k = 1.4 + (idx % 2) * 1.8;
    const p1 = [ex - t[0] * d + u[0] * d * 0.5, ey - t[1] * d + u[1] * d * 0.5];
    const p2 = [ex - t[0] * d - u[0] * d * 0.5, ey - t[1] * d - u[1] * d * 0.5];
    return `<g class="notch">
      <path d="M${ex} ${ey} L${p1[0]} ${p1[1]} L${p2[0]} ${p2[1]} Z" fill="var(--accent)"/>
      <circle cx="${ex + t[0] * d * k}" cy="${ey + t[1] * d * k}" r="${fs * 0.6}" fill="var(--paper)" stroke="var(--accent)" stroke-width="${sw}"/>
      <text x="${ex + t[0] * d * k}" y="${ey + t[1] * d * k}" font-size="${fs * 0.75}" text-anchor="middle" dominant-baseline="central" class="lbl">${idx + 1}</text>
    </g>`;
  }).join('');

  const span = beta;
  const wideAngle = res.angle >= 180;
  const labelHem = polar(res.rOutCut + fs * 1.4, 0);
  const labelWaist = polar(res.rInCut + fs * 1.6, 0);
  const pivotLabel = wideAngle ? [0, -fs * 1.2] : [0, -fs * 1];

  return `<svg class="ill ill-pattern" viewBox="${vb.join(' ')}" role="img" aria-label="Panneau de jupe coté" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="dimA" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" fill="var(--ink)"/></marker>
  </defs>
  <path d="${pathOf(cut)}" fill="var(--piece-panel)" stroke="var(--ink)" stroke-width="${sw * 1.6}"/>
  <g fill="none" stroke="var(--accent)" stroke-width="${sw * 1.2}" stroke-dasharray="${sw * 6} ${sw * 4}">
    <path d="${arcPath(res.r, -span, span)}"/>
    <path d="${arcPath(res.R, -span, span)}"/>
    <path d="M${lw1x} ${lw1y} L${lh1x} ${lh1y}"/>
    <path d="M${rw1x} ${rw1y} L${rh1x} ${rh1y}"/>
  </g>
  <g stroke="var(--ink-soft)" stroke-width="${sw * 0.7}" stroke-dasharray="${sw * 2} ${sw * 3}">
    <line x1="0" y1="0" x2="${lw1x}" y2="${lw1y}"/>
    <line x1="0" y1="0" x2="${rw1x}" y2="${rw1y}"/>
  </g>
  <circle cx="0" cy="0" r="${fs * 0.35}" fill="var(--ink)"/>
  <text x="${pivotLabel[0]}" y="${pivotLabel[1]}" font-size="${fs}" text-anchor="middle" class="lbl">C</text>
  ${dimLine([0, 0], [lw1x, lw1y], `rayon ${fmt(res.r)} cm`, 1)}
  ${dimLine([lw1x, lw1y], [lh1x, lh1y], `longueur ${fmt(res.Lp)} cm`, 1)}
  <text x="${labelWaist[0]}" y="${labelWaist[1]}" font-size="${fs * 0.85}" text-anchor="middle" class="note">taille (coupe à ${fmt(res.rInCut)} cm de C)</text>
  <text x="${labelHem[0]}" y="${labelHem[1] + fs * 0.4}" font-size="${fs * 0.85}" text-anchor="middle" class="note">ourlet (coupe à ${fmt(res.rOutCut)} cm de C)</text>
  <text x="${polar((res.r + res.R) / 2, 0)[0]}" y="${polar((res.r + res.R) / 2, 0)[1]}" font-size="${fs * 1.1}" text-anchor="middle" class="lbl">Panneau × ${res.k}</text>
  <text x="${polar((res.r + res.R) / 2, 0)[0]}" y="${polar((res.r + res.R) / 2, 0)[1] + fs * 1.4}" font-size="${fs * 0.8}" text-anchor="middle" class="note">angle ${fmt(res.angle)}° · marges ${fmt(res.s)} cm</text>
  ${notches}
  <g transform="translate(${vb[0] + fs}, ${vb[1] + vb[3] - fs * 0.8})" font-size="${fs * 0.8}" class="note">
    <line x1="0" y1="${-fs * 0.3}" x2="${fs * 2}" y2="${-fs * 0.3}" stroke="var(--accent)" stroke-width="${sw * 1.2}" stroke-dasharray="${sw * 6} ${sw * 4}"/>
    <text x="${fs * 2.5}" y="0">ligne de couture</text>
    <line x1="${fs * 11}" y1="${-fs * 0.3}" x2="${fs * 13}" y2="${-fs * 0.3}" stroke="var(--ink)" stroke-width="${sw * 1.6}"/>
    <text x="${fs * 13.5}" y="0">ligne de coupe</text>
  </g>
  ${res.notches.map((n, i) => `<text x="${vb[0] + fs}" y="${vb[1] + fs * (1.2 + i * 1.1)}" font-size="${fs * 0.8}" class="note">${i + 1} · ${n.label} (${n.seam}) : ${fmt(n.from)} cm du bord de taille</text>`).join('')}
</svg>`;
}

/**
 * Plan de coupe : le coupon déplié, lisières en haut et en bas.
 */
export function layoutDiagram(layout, { title = 'tissu' } = {}) {
  const Lg = Math.max(layout.length, 10);
  const Wd = layout.width;
  const fs = Math.max(Lg, Wd) / 38;
  const sw = Math.max(Lg, Wd) / 500;
  const padL = fs * 1.5, padR = fs * 5, padT = fs * 3, padB = fs * 4.5;
  const vb = [-padL, -padT, Lg + padL + padR, Wd + padT + padB];
  const pieces = layout.placements.map((p) => {
    const st = KIND_STYLE[p.piece.kind] ?? KIND_STYLE.panel;
    const [cx, cy] = centroid(p.poly);
    const name = p.piece.label;
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    for (const [x, y] of p.poly) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    const vertical = by1 - by0 > (bx1 - bx0) * 1.5;
    const tfs = Math.min(fs * 0.9, (Math.min(bx1 - bx0, by1 - by0)) * 0.55);
    return `<g class="piece">
      <path d="${pathOf(p.poly)}" fill="${st.fill}" stroke="var(--ink)" stroke-width="${sw * 1.5}"/>
      <text x="${cx}" y="${cy}" font-size="${tfs}" text-anchor="middle" dominant-baseline="middle" class="lbl"${vertical ? ` transform="rotate(-90 ${cx} ${cy})"` : ''}>${name}</text>
    </g>`;
  }).join('');
  let selv = '';
  for (let x = 0; x < Lg; x += fs * 0.8) {
    selv += `<circle cx="${x + fs * 0.4}" cy="${fs * 0.35}" r="${sw * 1.2}" fill="var(--ink-soft)"/><circle cx="${x + fs * 0.4}" cy="${Wd - fs * 0.35}" r="${sw * 1.2}" fill="var(--ink-soft)"/>`;
  }
  return `<svg class="ill ill-layout" viewBox="${vb.join(' ')}" role="img" aria-label="Plan de coupe sur le ${title}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="dimB" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" fill="var(--ink)"/></marker>
    <pattern id="weave" width="${fs * 0.6}" height="${fs * 0.6}" patternUnits="userSpaceOnUse">
      <path d="M0 ${fs * 0.3} H${fs * 0.6}" stroke="var(--fabric-line)" stroke-width="${sw * 0.6}"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="${Lg}" height="${Wd}" fill="var(--fabric)" stroke="var(--ink-soft)" stroke-width="${sw}"/>
  <rect x="0" y="0" width="${Lg}" height="${Wd}" fill="url(#weave)"/>
  <rect x="0" y="0" width="${Lg}" height="${fs * 0.7}" fill="var(--selvage)"/>
  <rect x="0" y="${Wd - fs * 0.7}" width="${Lg}" height="${fs * 0.7}" fill="var(--selvage)"/>
  ${selv}
  <text x="${Lg / 2}" y="${-fs * 0.6}" font-size="${fs * 0.85}" text-anchor="middle" class="note">lisière</text>
  ${pieces}
  <g class="dim">
    <line x1="0" y1="${Wd + fs * 1.8}" x2="${Lg}" y2="${Wd + fs * 1.8}" stroke="var(--ink)" stroke-width="${sw * 1.2}" marker-start="url(#dimB)" marker-end="url(#dimB)"/>
    <text x="${Lg / 2}" y="${Wd + fs * 3.4}" font-size="${fs * 1.1}" text-anchor="middle" class="dim-t">${fmt(Math.ceil(layout.length))} cm</text>
    <line x1="${Lg + fs * 1.6}" y1="0" x2="${Lg + fs * 1.6}" y2="${Wd}" stroke="var(--ink)" stroke-width="${sw * 1.2}" marker-start="url(#dimB)" marker-end="url(#dimB)"/>
    <text x="${Lg + fs * 2.6}" y="${Wd / 2}" font-size="${fs * 1.1}" text-anchor="middle" transform="rotate(90 ${Lg + fs * 2.6} ${Wd / 2})" class="dim-t">laize ${fmt(Wd)} cm</text>
  </g>
  <g transform="translate(${fs}, ${Wd + fs * 1.8})">
    <text x="0" y="${fs * 1.6}" font-size="${fs * 0.8}" class="note">↔ droit-fil parallèle aux lisières</text>
  </g>
</svg>`;
}

/** Petit schéma de principe d'une jupe 1/4 de cercle, pour le questionnaire. */
export function patternMini({ highlight = 'none', fraction = 0.25 } = {}) {
  const ang = Math.min(fraction * 360, 180);
  const beta = (ang / 2) * DEG;
  const r = fraction >= 1 ? 22 : fraction >= 0.5 ? 34 : 50;
  const R = r + 90;
  const hl = 'var(--tape-dark)';
  const base = 'var(--ink-soft)';
  const [lx, ly] = polar(r, -beta);
  const [lX, lY] = polar(R, -beta);
  const [rx, ry] = polar(r, beta);
  const [rX, rY] = polar(R, beta);
  const w = (k) => (highlight === k ? 5 : 1.6);
  const c = (k) => (highlight === k ? hl : base);
  const sector = `M${lx} ${ly} L${lX} ${lY} ${arcPath(R, -beta, beta).replace(/^M/, 'L')} L${rx} ${ry} ${arcPath(r, beta, -beta).replace(/^M/, 'L')} Z`;
  let notes = '';
  if (highlight === 'waist') notes = `<text x="0" y="${r + 30}" text-anchor="middle" class="note" font-size="11">tour de taille = arc de taille</text>`;
  if (highlight === 'length') {
    notes = `<text x="${(lx + lX) / 2 - 8}" y="${(ly + lY) / 2}" text-anchor="end" class="note" font-size="11">longueur</text>`;
  }
  if (highlight === 'hips') {
    const depth = 26;
    const [hx, hy] = polar(r + depth, beta);
    notes = `<path d="${arcPath(r + depth, -beta, beta)}" fill="none" stroke="${hl}" stroke-width="2" stroke-dasharray="4 3"/>
      <line x1="${rx}" y1="${ry}" x2="${hx}" y2="${hy}" stroke="${hl}" stroke-width="5"/>
      <text x="${hx + 8}" y="${hy}" class="note" font-size="11">ouverture</text>
      <text x="0" y="${r + depth + 14}" text-anchor="middle" class="note" font-size="10">ici la jupe = hanches + 2 cm</text>`;
  }
  if (highlight === 'hem') notes = `<text x="0" y="${R + 16}" text-anchor="middle" class="note" font-size="11">ourlet</text>`;
  if (highlight === 'seam') notes = `<text x="${rX + 6}" y="${rY - 6}" class="note" font-size="11">couture</text>`;
  const vbW = Math.max(2 * R * Math.sin(Math.min(beta, Math.PI / 2)), R) + 70;
  const minY = ang >= 180 ? -R * 0.15 - 20 : -20;
  return `<svg class="ill ill-mini" viewBox="${-vbW / 2} ${minY} ${vbW} ${R + 40 - minY}" role="img" aria-label="Où se reporte la mesure sur le tissu" xmlns="http://www.w3.org/2000/svg">
    <path d="${sector}" fill="var(--piece-panel)" stroke="${base}" stroke-width="1.6"/>
    <path d="${arcPath(r, -beta, beta)}" fill="none" stroke="${c('waist')}" stroke-width="${w('waist')}" stroke-linecap="round"/>
    <path d="${arcPath(R, -beta, beta)}" fill="none" stroke="${c('hem')}" stroke-width="${w('hem')}" stroke-linecap="round"/>
    <line x1="${lx}" y1="${ly}" x2="${lX}" y2="${lY}" stroke="${c('length')}" stroke-width="${w('length')}" stroke-linecap="round"/>
    <line x1="${rx}" y1="${ry}" x2="${rX}" y2="${rY}" stroke="${c('seam')}" stroke-width="${w('seam')}" stroke-linecap="round"/>
    <line x1="0" y1="0" x2="${lx}" y2="${ly}" stroke="${base}" stroke-dasharray="2 3"/>
    <line x1="0" y1="0" x2="${rx}" y2="${ry}" stroke="${base}" stroke-dasharray="2 3"/>
    <circle r="3" fill="var(--ink)"/>
    <text y="-6" text-anchor="middle" font-size="11" class="lbl">C</text>
    ${notes}
  </svg>`;
}

/** Illustration de la laize : un coupon avec ses lisières. */
export function fabricSVG() {
  let holes = '';
  for (let x = 30; x < 290; x += 8) holes += `<circle cx="${x}" cy="40" r="1" /><circle cx="${x}" cy="160" r="1" />`;
  return `<svg class="ill ill-fabric" viewBox="0 0 320 210" role="img" aria-label="Mesurer la laize d'un tissu" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 34 H290 q14 66 0 132 H20 z" fill="var(--fabric)" stroke="var(--ink-soft)" stroke-width="1.5"/>
    <rect x="20" y="34" width="270" height="10" fill="var(--selvage)"/>
    <rect x="20" y="156" width="270" height="10" fill="var(--selvage)"/>
    <g fill="var(--ink-soft)">${holes}</g>
    <text x="155" y="26" text-anchor="middle" font-size="12" class="note">lisière (bord fini)</text>
    <text x="155" y="184" text-anchor="middle" font-size="12" class="note">lisière</text>
    <line x1="250" y1="44" x2="250" y2="156" stroke="var(--tape-dark)" stroke-width="3" marker-start="url(#fa)" marker-end="url(#fa)"/>
    <text x="244" y="104" text-anchor="end" font-size="13" class="lbl">laize</text>
    <line x1="40" y1="100" x2="160" y2="100" stroke="var(--accent)" stroke-width="2" marker-end="url(#fa2)"/>
    <text x="44" y="92" font-size="11" class="note">droit-fil</text>
    <text x="155" y="202" text-anchor="middle" font-size="11" class="note">on mesure d’une lisière à l’autre, sans les compter</text>
    <defs>
      <marker id="fa" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L10 5L0 9z" fill="var(--tape-dark)"/></marker>
      <marker id="fa2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L10 5L0 9z" fill="var(--accent)"/></marker>
    </defs>
  </svg>`;
}
