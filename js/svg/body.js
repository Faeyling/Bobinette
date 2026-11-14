// Silhouette pour montrer où prendre les mesures.
// viewBox 0 0 240 440 ; axe central x = 120.

const COL = {
  skin: 'var(--body-fill)',
  line: 'var(--body-line)',
  tape: 'var(--tape)',
  tapeDark: 'var(--tape-dark)',
  skirt: 'var(--accent-soft)',
  text: 'var(--ink)',
};

export const BODY_Y = {
  haute: 152,
  naturelle: 166,
  basse: 196,
  hips: 222,
  crotch: 250,
  miCuisse: 290,
  genou: 328,
  miMollet: 368,
  cheville: 408,
};

/** Demi-largeur du corps (de face) à une hauteur y, pour poser les rubans. */
function halfWidth(y) {
  const pts = [[92, 50], [120, 44], [140, 44], [166, 28], [196, 40], [222, 47], [250, 44]];
  if (y <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (y <= pts[i][0]) {
      const [y0, w0] = pts[i - 1];
      const [y1, w1] = pts[i];
      return w0 + ((y - y0) / (y1 - y0)) * (w1 - w0);
    }
  }
  return 44;
}

/** Courbe lisse (Catmull-Rom → Bézier) passant par les points. */
function smooth(points) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function silhouette() {
  const right = [[132, 66], [134, 80], [168, 92], [164, 120], [159, 140], [149, 166], [157, 196], [167, 222], [164, 250]];
  const left = right.map(([x, y]) => [240 - x, y]).reverse();
  const leftPath = smooth(left);
  const torsoPath = smooth([[108, 66], ...right]) + ' L120 252 L76 250 ' + leftPath.slice(leftPath.indexOf('C')) + ' Z';
  const legR = smooth([[121, 248], [124, 290], [126, 330], [128, 370], [128, 404]]) + ' L140 412 L146 406 ' +
    smooth([[144, 404], [146, 370], [152, 330], [160, 290], [164, 250]]).replace(/^M/, 'L') + ' Z';
  const legL = smooth([[119, 248], [116, 290], [114, 330], [112, 370], [112, 404]]) + ' L100 412 L94 406 ' +
    smooth([[96, 404], [94, 370], [88, 330], [80, 290], [76, 250]]).replace(/^M/, 'L') + ' Z';
  const armR = smooth([[166, 94], [176, 130], [182, 180], [186, 236]]) + ' L178 240 ' +
    smooth([[176, 236], [170, 182], [162, 134], [160, 112]]).replace(/^M/, 'L') + ' Z';
  const armL = smooth([[74, 94], [64, 130], [58, 180], [54, 236]]) + ' L62 240 ' +
    smooth([[64, 236], [70, 182], [78, 134], [80, 112]]).replace(/^M/, 'L') + ' Z';
  return `
  <g fill="${COL.skin}" stroke="${COL.line}" stroke-width="2" stroke-linejoin="round">
    <path d="${armL}"/><path d="${armR}"/>
    <path d="${legL}"/><path d="${legR}"/>
    <path d="${torsoPath}"/>
    <rect x="111" y="56" width="18" height="16" rx="6"/>
    <ellipse cx="120" cy="38" rx="21" ry="24"/>
    <path d="M100 30 q20 -26 40 0 q-4 -10 -20 -10 q-16 0 -20 10z" fill="var(--body-line)" opacity=".35" stroke="none"/>
  </g>`;
}

function tapeAround(y, label) {
  const hw = halfWidth(y) + 3;
  return `
  <g class="hl">
    <path d="M${120 - hw} ${y} q${hw} -10 ${2 * hw} 0" fill="none" stroke="${COL.tapeDark}" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>
    <path d="M${120 - hw} ${y} q${hw} 10 ${2 * hw} 0" fill="none" stroke="${COL.tape}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${120 - hw} ${y} q${hw} 10 ${2 * hw} 0" fill="none" stroke="${COL.tapeDark}" stroke-width="1" stroke-dasharray="1 4" />
    <circle cx="${120 + hw}" cy="${y}" r="3" fill="${COL.tapeDark}"/>
    <line x1="${120 + hw + 4}" y1="${y}" x2="214" y2="${y}" stroke="${COL.text}" stroke-width="1" stroke-dasharray="2 2"/>
    <text x="216" y="${y + 4}" font-size="11" fill="${COL.text}" text-anchor="start">${label}</text>
  </g>`;
}

function verticalTape(y0, y1, x, label) {
  let ticks = '';
  for (let y = y0 + 8; y < y1; y += 8) ticks += `<line x1="${x - 3}" y1="${y}" x2="${x + 3}" y2="${y}" stroke="${COL.tapeDark}" stroke-width="1"/>`;
  return `
  <g class="hl">
    <rect x="${x - 4}" y="${y0}" width="8" height="${y1 - y0}" rx="2" fill="${COL.tape}"/>
    ${ticks}
    <path d="M${x - 8} ${y0} h16 M${x - 8} ${y1} h16" stroke="${COL.tapeDark}" stroke-width="2"/>
    <text x="${x + 10}" y="${(y0 + y1) / 2}" font-size="11" fill="${COL.text}" transform="rotate(90 ${x + 10} ${(y0 + y1) / 2})" text-anchor="middle">${label}</text>
  </g>`;
}

/** Jupe cercle fantôme portée, pour visualiser la longueur. */
function ghostSkirt(waistY, hemY, flare = 1) {
  const hw = halfWidth(waistY) + 2;
  const spread = 30 + 50 * flare;
  const bottomHW = hw + (hemY - waistY) * 0.25 + spread * 0.5;
  return `<path d="M${120 - hw} ${waistY} Q${120 - hw - 12} ${(waistY + hemY) / 2} ${120 - bottomHW} ${hemY}
    q${bottomHW / 2} 8 ${bottomHW} 0 q${bottomHW / 2} 8 ${bottomHW} 0
    Q${120 + hw + 12} ${(waistY + hemY) / 2} ${120 + hw} ${waistY} Z"
    fill="${COL.skirt}" stroke="var(--accent)" stroke-width="1.5" opacity=".55"/>`;
}

/**
 * @param {object} o
 * @param {'waist'|'hips'|'length'|'none'} o.highlight
 * @param {'naturelle'|'haute'|'basse'} [o.port]
 * @param {number} [o.hemY] hauteur (y) du bas de jupe pour la longueur
 */
export function bodySVG({ highlight = 'none', port = 'naturelle', hemY = BODY_Y.genou } = {}) {
  const waistY = BODY_Y[port] ?? BODY_Y.naturelle;
  let extra = '';
  if (highlight === 'waist') {
    extra += tapeAround(waistY, 'taille');
    if (port === 'naturelle') {
      extra += `<g class="hint"><path d="M58 ${waistY - 14} q-12 14 0 28" fill="none" stroke="var(--accent)" stroke-width="1.6" marker-end="url(#arr)"/></g>`;
    }
  }
  if (highlight === 'hips') {
    extra += `<line x1="70" y1="${waistY}" x2="170" y2="${waistY}" stroke="${COL.line}" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>`;
    extra += tapeAround(BODY_Y.hips, 'hanches');
  }
  if (highlight === 'length') {
    extra = ghostSkirt(waistY, hemY) + extra;
    extra += `<line x1="80" y1="${waistY}" x2="200" y2="${waistY}" stroke="${COL.line}" stroke-width="1" stroke-dasharray="2 3"/>`;
    extra += verticalTape(waistY, hemY, 206, 'longueur');
    for (const [k, lbl] of [['miCuisse', 'mi-cuisse'], ['genou', 'genou'], ['miMollet', 'mi-mollet'], ['cheville', 'cheville']]) {
      extra += `<g opacity=".75"><line x1="28" y1="${BODY_Y[k]}" x2="70" y2="${BODY_Y[k]}" stroke="${COL.line}" stroke-width=".8" stroke-dasharray="2 2"/>
        <text x="26" y="${BODY_Y[k] + 3}" font-size="9" fill="${COL.text}" text-anchor="end">${lbl}</text></g>`;
    }
  }
  return `<svg class="ill ill-body" viewBox="-30 0 300 440" role="img" aria-label="Silhouette : où mesurer" xmlns="http://www.w3.org/2000/svg">
    <defs><marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--accent)"/></marker></defs>
    ${silhouette()}
    ${extra}
  </svg>`;
}
