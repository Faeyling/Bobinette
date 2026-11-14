// Géométrie des pièces de patron et placement sur le tissu.
// Toutes les longueurs sont en centimètres, les angles en degrés sauf mention.

const DEG = Math.PI / 180;

/**
 * Panneau en secteur de couronne (jupe cercle), avec marges de couture.
 * Le centre du cercle (point de pivot) est à l'origine, l'axe de symétrie
 * du panneau est l'axe +x.
 *
 * @param {object} o
 * @param {number} o.rIn    rayon de la ligne de COUPE à la taille
 * @param {number} o.rOut   rayon de la ligne de COUPE à l'ourlet
 * @param {number} o.angle  angle du panneau aux lignes de couture (degrés)
 * @param {number} o.seam   marge sur les bords droits (coutures)
 * @returns {Array<[number, number]>} polygone de la ligne de coupe
 */
export function sectorPolygon({ rIn, rOut, angle, seam }) {
  const beta = (angle / 2) * DEG;
  const s = seam;
  // Une droite parallèle au rayon (angle beta), décalée de s vers l'extérieur,
  // coupe le cercle de rayon rho à l'angle beta + atan(s / sqrt(rho² - s²)).
  const edgeAngle = (rho) => beta + Math.atan2(s, Math.sqrt(Math.max(rho * rho - s * s, 0)));
  const aOut = edgeAngle(rOut);
  const aIn = edgeAngle(rIn);
  const pts = [];
  const nOut = Math.max(24, Math.ceil((2 * aOut * rOut) / 2));
  for (let i = 0; i <= nOut; i++) {
    const a = -aOut + (2 * aOut * i) / nOut;
    pts.push([rOut * Math.cos(a), rOut * Math.sin(a)]);
  }
  const nIn = Math.max(16, Math.ceil((2 * aIn * rIn) / 2));
  for (let i = 0; i <= nIn; i++) {
    const a = aIn - (2 * aIn * i) / nIn;
    pts.push([rIn * Math.cos(a), rIn * Math.sin(a)]);
  }
  return pts;
}

/** Rectangle (largeur selon x, hauteur selon y), coin en bas à gauche à l'origine. */
export function rectPolygon(w, h, round = 0) {
  if (!round) return [[0, 0], [w, 0], [w, h], [0, h]];
  // Rectangle à deux coins arrondis (fond de poche) côté x = w.
  const pts = [[0, 0]];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / n);
    pts.push([w - round + round * Math.cos(a), round + round * Math.sin(a)]);
  }
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / 2) * (i / n);
    pts.push([w - round + round * Math.cos(a), h - round + round * Math.sin(a)]);
  }
  pts.push([0, h]);
  return pts;
}

export function rotatePolygon(poly, deg) {
  const c = Math.cos(deg * DEG);
  const s = Math.sin(deg * DEG);
  return poly.map(([x, y]) => [x * c - y * s, x * s + y * c]);
}

export function bbox(poly) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

/**
 * Étendue en x du polygone dans chaque bande horizontale [i*bh, (i+1)*bh].
 * Le minimum/maximum de x dans une bande est atteint soit sur un sommet
 * situé dans la bande, soit à l'intersection d'une arête avec un bord de bande.
 */
function bandExtents(poly, bh, nBands) {
  const ext = new Array(nBands).fill(null);
  const push = (i, x) => {
    if (i < 0 || i >= nBands) return;
    const e = ext[i];
    if (!e) ext[i] = [x, x];
    else {
      if (x < e[0]) e[0] = x;
      if (x > e[1]) e[1] = x;
    }
  };
  for (const [x, y] of poly) {
    const i = Math.floor(y / bh);
    push(i, x);
    // Un sommet pile sur une limite de bande appartient aux deux bandes.
    if (Math.abs(y - i * bh) < 1e-9) push(i - 1, x);
  }
  for (let k = 0; k < poly.length; k++) {
    const [x1, y1] = poly[k];
    const [x2, y2] = poly[(k + 1) % poly.length];
    const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    if (hi - lo < 1e-12) continue;
    const iStart = Math.ceil(lo / bh);
    const iEnd = Math.floor(hi / bh);
    for (let i = iStart; i <= iEnd; i++) {
      const yb = i * bh;
      const t = (yb - y1) / (y2 - y1);
      const x = x1 + t * (x2 - x1);
      push(i, x);
      push(i - 1, x);
    }
  }
  return ext;
}

/**
 * Place les pièces sur un tissu de laize donnée (axe y = largeur, de lisière
 * à lisière ; axe x = longueur, le long des lisières = droit-fil).
 * Algorithme glouton : chaque pièce, essayée dans chaque rotation autorisée et
 * à chaque hauteur possible, est glissée vers le début du coupon jusqu'à
 * toucher les pièces déjà posées. On garde la position qui finit le plus tôt.
 *
 * @param {Array<{id:string,label:string,poly:Array,rotations:number[]}>} pieces
 * @param {number} width laize utile (cm)
 * @param {object} [opt]
 * @returns {{fits:boolean, length:number, width:number, placements:Array, tooWide?:object}}
 */
export function packPieces(pieces, width, opt = {}) {
  const bh = opt.band ?? 0.5;
  const gap = opt.gap ?? 0.5;
  const nBands = Math.floor(width / bh + 1e-9);
  const env = new Array(nBands).fill(0);
  const placements = [];

  const order = pieces
    .map((p) => ({ p, area: polygonArea(p.poly) }))
    .sort((a, b) => b.area - a.area)
    .map((o) => o.p);

  for (const piece of order) {
    let best = null;
    for (const rot of piece.rotations) {
      const rp = rotatePolygon(piece.poly, rot);
      const b = bbox(rp);
      if (b.h > width + 1e-6) continue;
      const norm = rp.map(([x, y]) => [x - b.minX, y - b.minY]);
      const localBands = Math.ceil(b.h / bh - 1e-9);
      const ext = bandExtents(norm, bh, Math.max(localBands, 1));
      const maxJ = Math.floor((width - b.h) / bh + 1e-9);
      for (let j = 0; j <= maxJ; j++) {
        let dx = 0;
        for (let i = 0; i < ext.length; i++) {
          const e = ext[i];
          if (!e) continue;
          const g = j + i;
          if (g >= nBands) continue;
          if (env[g] > 0) {
            const need = env[g] + gap - e[0];
            if (need > dx) dx = need;
          }
        }
        const end = dx + b.w;
        if (!best || end < best.end - 1e-6 || (Math.abs(end - best.end) < 1e-6 && dx < best.dx)) {
          best = { end, dx, j, rot, norm, ext, b };
        }
      }
    }
    if (!best) {
      // La pièce ne rentre dans aucune orientation.
      let minH = Infinity;
      for (const rot of piece.rotations) {
        minH = Math.min(minH, bbox(rotatePolygon(piece.poly, rot)).h);
      }
      return { fits: false, length: Infinity, width, placements, tooWide: { piece, minWidth: minH } };
    }
    const dy = best.j * bh;
    for (let i = 0; i < best.ext.length; i++) {
      const e = best.ext[i];
      const g = best.j + i;
      if (!e || g >= nBands) continue;
      env[g] = Math.max(env[g], best.dx + e[1]);
    }
    placements.push({
      piece,
      rotation: best.rot,
      x: best.dx,
      y: dy,
      poly: best.norm.map(([x, y]) => [x + best.dx, y + dy]),
    });
  }
  const length = Math.max(0, ...env);
  return { fits: true, length, width, placements };
}

/** Rotations utiles pour un panneau de jupe : axe ou bord droit sur le droit-fil / travers. */
export function panelRotations(angle) {
  const half = angle / 2;
  const set = new Set();
  for (let k = 0; k < 4; k++) {
    for (const base of [0, half, -half]) {
      set.add(((base + 90 * k) % 360 + 360) % 360);
    }
  }
  return [...set];
}
