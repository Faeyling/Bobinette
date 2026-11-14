// Tests du calcul des jupes cercles : node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCircleSkirt } from '../js/calc/circleSkirt.js';
import { sectorPolygon, packPieces, rotatePolygon, bbox } from '../js/calc/geometry.js';
import { CLOSURES, HEMS, SEAMS, FABRICS, WAIST_FINISHES } from '../js/data/options.js';

const base = {
  port: 'naturelle', taille: 70, hanches: 98, longueur: 60, tissu: 'stable', laize: 140, sens: false,
  finition: 'ceinture', hauteurCeinture: 4, largeurElastique: 3, fermeture: 'invisible',
  couture: 'surfilee', ourlet: 'double', poches: false, fente: false, hauteurFente: 15, doublure: false, laizeDoublure: 140,
};
const close = (a, b, eps = 0.05) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('jupe 1/4 : le rayon de taille redonne le tour de taille + aisance', () => {
  const r = computeCircleSkirt('quart', base);
  assert.ok(r.ok);
  close(2 * Math.PI * r.r * 0.25, 71); // 70 + 1 cm d’aisance
  close(r.Lp, 56); // 60 − 4 cm de ceinture
  close(r.R - r.r, r.Lp);
  close(r.rInCut, r.r - 1);
  close(r.rOutCut, r.R + 1.5);
});

test('demi et cercle complet : rayon divisé par la fraction', () => {
  const q = computeCircleSkirt('quart', base);
  const d = computeCircleSkirt('demi', base);
  const c = computeCircleSkirt('complet', base);
  close(d.r, q.r / 2);
  close(c.r, q.r / 4);
  assert.ok(c.k >= 2, 'un cercle complet demande au moins 2 panneaux');
});

test('ceinture élastique : taille calculée sur les hanches', () => {
  const r = computeCircleSkirt('demi', { ...base, finition: 'elastique', fermeture: 'aucune' });
  assert.ok(r.ok);
  close(r.Wf, 102);
  close(r.Lp, 60 - 4);
});

test('sans fermeture et sans élastique : erreur, la jupe ne passe pas les hanches', () => {
  const r = computeCircleSkirt('quart', { ...base, fermeture: 'aucune' });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /hanches/);
});

test('ouverture : à cette profondeur la jupe fait au moins hanches + 2 cm', () => {
  for (const fr of ['quart', 'demi', 'complet']) {
    const r = computeCircleSkirt(fr, base);
    const circ = 2 * Math.PI * r.f * (r.r + r.opening);
    assert.ok(circ >= r.H + 2 - 1e-9, `${fr}: ${circ}`);
    assert.ok(r.zip.buy >= r.zip.needed);
  }
});

test('poches : coutures de côté obligatoires', () => {
  const r = computeCircleSkirt('quart', { ...base, poches: true });
  assert.ok(r.k >= 2);
});

test('tissu fluide : −1 cm à la taille et réserve d’ourlet', () => {
  const r = computeCircleSkirt('quart', { ...base, tissu: 'fluide' });
  close(r.Wf, 70);
  close(r.hemA, 3.5);
});

test('marge de couture : la plus grande exigence l’emporte', () => {
  assert.equal(computeCircleSkirt('quart', { ...base, couture: 'surjeteuse', fermeture: 'classique' }).s, 2);
  assert.equal(computeCircleSkirt('quart', { ...base, couture: 'surjeteuse' }).s, 1.5);
  assert.equal(computeCircleSkirt('quart', { ...base, couture: 'rabattue' }).s, 2);
});

test('tissu trop étroit : message clair', () => {
  const r = computeCircleSkirt('complet', { ...base, longueur: 110, laize: 90 });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /trop étroit/);
});

test('placement : aucune pièce ne déborde de la laize ni ne chevauche une autre', () => {
  const r = computeCircleSkirt('demi', { ...base, poches: true });
  const W = r.laize;
  for (const p of r.layout.placements) {
    const b = bbox(p.poly);
    assert.ok(b.minY >= -1e-6 && b.maxY <= W + 1e-6);
    assert.ok(b.minX >= -1e-6 && b.maxX <= r.layout.length + 1e-6);
  }
  // test de chevauchement par échantillonnage
  const inside = (poly, [x, y]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const P = r.layout.placements;
  for (let y = 0.25; y < W; y += 1) {
    for (let x = 0.25; x < r.layout.length; x += 1) {
      const n = P.filter((p) => inside(p.poly, [x, y])).length;
      assert.ok(n <= 1, `chevauchement en (${x}, ${y})`);
    }
  }
});

test('secteur : la ligne de coupe est à la bonne distance du centre', () => {
  const poly = sectorPolygon({ rIn: 40, rOut: 100, angle: 90, seam: 1.5 });
  const radii = poly.map(([x, y]) => Math.hypot(x, y));
  close(Math.min(...radii), 40, 1e-6);
  close(Math.max(...radii), 100, 1e-6);
  const b = bbox(rotatePolygon(poly, 45));
  assert.ok(b.w > 100 && b.h > 100);
});

test('toutes les combinaisons d’options se calculent sans planter', () => {
  let n = 0;
  for (const fr of ['quart', 'demi', 'complet'])
    for (const tissu of Object.keys(FABRICS))
      for (const finition of Object.keys(WAIST_FINISHES))
        for (const fermeture of Object.keys(CLOSURES))
          for (const ourlet of Object.keys(HEMS))
            for (const couture of Object.keys(SEAMS))
              for (const extra of [{}, { poches: true, fente: true, doublure: true }]) {
                const r = computeCircleSkirt(fr, { ...base, tissu, finition, fermeture, ourlet, couture, ...extra });
                assert.ok(r.ok || r.errors.length, 'résultat ou erreur explicite');
                if (r.ok) assert.ok(Number.isFinite(r.fabricLength));
                n++;
              }
  assert.ok(n > 1000);
});

test('packPieces signale une pièce trop large', () => {
  const big = sectorPolygon({ rIn: 10, rOut: 120, angle: 180, seam: 1.5 });
  const res = packPieces([{ id: 'a', kind: 'panel', label: 'A', poly: big, rotations: [0, 90] }], 100);
  assert.equal(res.fits, false);
});
